#!/usr/bin/env node
/**
 * 레퍼런스 → 신규 제품 저장소 이관 명령. 작업 트리 파일 시스템만 읽고 git 명령은 쓰지 않는다
 * (작업 트리와 HEAD가 다르다). 대상 파일을 덮어쓰거나 지우지 않으며, 제품 의미가 필요한 자리는
 * `TRANSPLANT_PENDING_*` 로 남겨 사람이 닫는다.
 *
 *   node scripts/transplant/transplant.mjs plan   --target <repo> [--bundles a,b] [--with-ledger]
 *   node scripts/transplant/transplant.mjs stage  --target <repo> [--out <dir>] [--bundles a,b] [--with-ledger]
 *   node scripts/transplant/transplant.mjs apply  --target <repo> [--out <dir>]
 *   node scripts/transplant/transplant.mjs verify --target <repo>
 *
 * plan: 반출 목록을 copy / merge / template / generate / conditional / exclude 로 분류해 출력한다(읽기 전용).
 * stage: 치환(ADR 재번호, 예시 심볼, 원장 경로)을 적용한 사본을 out 디렉터리에 만들고 MANIFEST.json·PENDING.md를 쓴다.
 * apply: stage 사본 중 대상에 없는 파일만 복사한다(merge 그룹은 없어도 복사하지 않음). 이미 있는 파일은 diff 대상으로 보고만 한다.
 * verify: 대상에서 contracts:check --mode target, typecheck, lint, test:unit 을 순서대로 실행한다.
 *
 * 이관 단위는 선택한 bundle 의 의존 폐쇄(code + skill + ADR + tests)와 게이트 런타임·양쪽 런타임 진입점이다.
 * 이 제품의 활성 원장은 `--with-ledger` 없이는 나가지 않고, 대상 `docs/reference/product.json` 이 가리키는
 * 경로(없으면 product-paths 기본값)에 빈 원장 뼈대를 만든다. 원장 경로를 인용하는 모든 텍스트는 그 포인터로 다시 쓴다.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, lstatSync, readlinkSync, symlinkSync} from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { productTermsInLine, TRANSPLANT_SENTINEL } from '../contracts/contracts.mjs'
import { productPaths } from '../contracts/product-paths.mjs'
import {
  FOUNDATION_BUNDLE_IDS,
  FORBIDDEN_SEED_PATTERNS,
  listSeedFiles,
  listTransplantManifestFiles,
  productLedgerManifest,
  SEED_BUNDLES,
  TRANSPLANT_MANIFEST,
} from '../contracts/seed.mjs'

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Q3(2026-09-03): 대상은 ADR 을 0001 부터 다시 번호 붙인다. 이관 ADR 은 seed bundle 과 skill 이 이름으로
 * 가리키는 것이며 순서는 레퍼런스 번호 순이다. 0001·0002·0004 는 가지 않는다(0002·0004 는 조건부 재작성).
 * 0009~0012 는 0014 로 대체·삭제된 결번이라 목록에 없다.
 * 선택 bundle 에 따라 실제로 가지 않는 ADR 은 stage 가 `retired` 로 옮겨 인용만 표시한다.
 */
export const ADR_RENUMBER = [
  ['0003-datetime-utc', '0001-datetime-utc'],
  ['0005-locale-query-key', '0002-locale-query-key'],
  ['0006-auth-token-storage', '0003-auth-token-storage'],
  ['0008-primitive-implementation-selection', '0004-primitive-implementation-selection'],
  ['0014-single-screen-shape', '0005-single-screen-shape'],
  // 조건부(Q1/H6): 대상 버전과 대조해 채택·재작성·삭제한다. 번호 충돌을 피해 뒤에 붙인다.
  ['0002-typescript-version-pin', '0006-typescript-version-pin'],
  ['0004-runtime-version-pin', '0007-runtime-version-pin'],
]

/** 이관하지 않는 ADR. 본문에서 이 번호를 인용한 곳은 재번호 전에 표시하고 사람이 검토한다. */
export const ADR_NOT_TRANSPLANTED = ['0001']

/** 대상은 Managers 가 없다. 레퍼런스 consumer 를 가리키는 예시 심볼은 `{Domain}` 자리표시자로 바꾼다. */
export const EXAMPLE_SYMBOL_SUBSTITUTIONS = [
  ['useManagerListData', 'use{Domain}ListData'],
  ['useManagerListFilter', 'use{Domain}ListFilter'],
  ['useManagerListResult', 'use{Domain}ListResult'],
  ['useManagerDetail', 'use{Domain}Detail'],
  ['ManagerListResult', '{Domain}ListResult'],
  ['ManagerCreateScreen', '{Domain}CreateScreen'],
  ['ManagerForm', '{Domain}Form'],
]

/** 대상과 병합해야 하는 파일. 이미 있으면 절대 덮어쓰지 않는다. */
const MERGE_GROUPS = new Set(['templates', 'app', 'config'])
/** stage 가 만드는 빈 원장 뼈대. `--with-ledger` 의 `ledger` 그룹(레퍼런스 원장 복사)과 다르다. */
const LEDGER_GROUP = 'ledger-shell'

/** 대상 저장소는 자기 자신을 대상 모드로 검사한다. source 모드는 이 레퍼런스의 seed·manifest 폐쇄 검사다. */
const TARGET_CONTRACTS_CHECK = ['node scripts/contracts/check.mjs', 'node scripts/contracts/check.mjs --mode target']

function relativeTo(root, path) {
  return relative(root, path).split('\\').join('/')
}

/** `stat` 은 링크를 따라가므로 판정은 `lstat` 으로 한다. */
const isSymlink = (path) => existsSync(path) && lstatSync(path).isSymbolicLink()

function sha256(path) {
  // 링크는 내용이 없다. 가리키는 곳이 그 정체이므로 그것을 해시한다.
  const bytes = isSymlink(path) ? Buffer.from(readlinkSync(path)) : readFileSync(path)
  return createHash('sha256').update(bytes).digest('hex')
}

/** 텍스트 파일에 ADR 재번호와 예시 심볼 치환을 적용한다. `retired` 에 든 번호는 재번호하지 않고 인용만 표시한다. */
export function rewriteText(text, { renumber = ADR_RENUMBER, symbols = EXAMPLE_SYMBOL_SUBSTITUTIONS, retired = ADR_NOT_TRANSPLANTED } = {}) {
  let out = text
  // 미이관 ADR 인용은 재번호 전에 레퍼런스 번호로 고정해 새 번호와 섞이지 않게 한다.
  for (const number of retired) {
    out = out.replace(new RegExp(`ADR\\s?${number}\\b`, 'g'), `ADR(레퍼런스 ${number}, 미이관)`)
  }
  const active = renumber.filter(([from]) => !retired.includes(from.split('-', 1)[0]))
  // 옛 번호 → 자리표시자 → 새 번호. 두 단계로 나눠야 0008→0004 뒤에 0004→0007 이 다시 잡히지 않는다.
  const placeholder = (index) => `\u0000ADR${index}\u0000`
  active.forEach(([from], index) => {
    const [fromNumber] = from.split('-', 1)
    out = out.split(from).join(`${placeholder(index)}-${from.slice(fromNumber.length + 1)}`)
    out = out.replace(new RegExp(`ADR\\s?${fromNumber}\\b`, 'g'), `ADR ${placeholder(index)}`)
    out = out.replace(new RegExp(`(^|[^\\w-])${fromNumber}\\.\\s`, 'gm'), `$1${placeholder(index)}. `)
  })
  active.forEach(([, to], index) => {
    const [toNumber] = to.split('-', 1)
    out = out.split(placeholder(index)).join(toNumber)
  })
  for (const [from, to] of symbols) out = out.split(from).join(to)
  return out
}

/** 이관하지 않는 ADR 을 인용한 줄. 자동 치환하지 않고 사람 검토 목록에 올린다. */
export function findRetiredAdrCitations(text, retired = ADR_NOT_TRANSPLANTED) {
  const hits = []
  text.split('\n').forEach((line, index) => {
    for (const number of retired) {
      if (new RegExp(`(ADR\\s?${number}\\b|decisions/${number}-)`).test(line)) {
        hits.push({ line: index + 1, number, text: line.trim().slice(0, 160) })
      }
    }
  })
  return hits
}

/**
 * 레퍼런스 원장 경로 → 대상 포인터 경로. 긴 경로부터 바꿔야 `…/zero-sol-figma-analysis.md` 가 `…/zero-sol` 접두로
 * 먼저 잡히지 않는다. 상대 링크의 `../` 접두와 `#앵커` 는 문자열 그대로 남는다(두 포인터 모두 저장소 루트 기준).
 */
export function rewriteProductPaths(text, source, target) {
  const keys = Object.keys(source).filter((key) => source[key] !== target[key]).sort((a, b) => source[b].length - source[a].length)
  let out = text
  keys.forEach((key, index) => { out = out.split(source[key]).join(`\u0000LEDGER${index}\u0000`) })
  keys.forEach((key, index) => { out = out.split(`\u0000LEDGER${index}\u0000`).join(target[key]) })
  return out
}

/**
 * Markdown 상대 링크가 가리키는 원장 파일을 대상 포인터로 옮긴다. `../reference/zero-sol/README.md` 처럼 `docs/` 접두가
 * 없는 상대 경로는 문자열 치환이 못 잡으므로 파일 위치 기준 절대 경로로 풀어 바꾸고 다시 상대화한다.
 * 원장 밖 링크·외부 URL·앵커만 있는 링크는 그대로 둔다.
 */
export function rewriteMarkdownLinks(text, fileDir, source, target) {
  return text.replace(/\]\(([^)\s#]+)(#[^)]*)?\)/g, (match, path, anchor = '') => {
    if (/^[a-z]+:/i.test(path) || path.startsWith('/')) return match
    const absolute = posix.normalize(posix.join(fileDir, path))
    const mapped = rewriteProductPaths(absolute, source, target)
    if (mapped === absolute) return match
    return `](${posix.relative(fileDir, mapped)}${anchor})`
  })
}

/** 치환 단계가 건드리면 안 되는 문자열의 자리표시자. 복원은 `restoreSourcePaths` 가 한다. */
const sourcePlaceholder = (index) => `\u0000SOURCE${index}\u0000`

/**
 * 이번 이관에서 나가지 않는 것을 가리키는 Markdown 링크를 푼다. 레퍼런스 원장의 절 파일·feature 코드·미이관 ADR·
 * e2e 스펙은 대상 제품에 없다. 경로만 대상 포인터로 바꾸면 그 제품이 가진 적 없는 근거를 만들어 내므로, 링크를 풀고
 * **레퍼런스 저장소의 경로를 그대로** 남겨 출처를 드러낸다. 남긴 경로는 자리표시자로 감싸 뒤따르는 ADR 재번호·원장
 * 경로 치환이 건드리지 않는다. 대상이 이미 가진 파일과 이번에 stage 되는 파일은 링크 그대로 둔다.
 */
export function delinkUntravelled(text, { sourceFile, targetPath, source, target, retired, staged, targetRoot, collect, withLedger = false }) {
  const sourceDir = posix.dirname(sourceFile)
  return text.replace(/\[([^\]]*)\]\(([^)\s#]+)(#[^)]*)?\)/g, (match, label, path, anchor = '') => {
    if (/^[a-z]+:/i.test(path) || path.startsWith('/')) return match
    const sourceAbsolute = posix.normalize(posix.join(sourceDir, path))
    const targetAbsolute = renamedPath(rewriteProductPaths(sourceAbsolute, source, target), retired)
    const productEvidence = !withLedger && (
      sourceAbsolute === source.judgment ||
      [source.inventory, source.scenarios].some((root) => sourceAbsolute.startsWith(`${root}/`) &&
        ![`${root}/README.md`, source.index].includes(sourceAbsolute)) ||
      /^(src\/features\/|src\/routes\/|tests\/e2e\/)/.test(sourceAbsolute)
    )
    if (!productEvidence && (staged.has(targetAbsolute) || existsSync(join(targetRoot, targetAbsolute)))) return match
    // 디렉터리를 가리키는 링크(문서 지도의 `.agents/skills/`)는 파일 의존이 아니다.
    const requiredContract = (sourceAbsolute.endsWith('.md')
      && (sourceAbsolute.startsWith('.agents/skills/') || sourceAbsolute.startsWith('product/policies/'))) ||
      (sourceAbsolute.startsWith('docs/decisions/') && !retired.some((id) => posix.basename(sourceAbsolute).startsWith(`${id}-`)))
    if (requiredContract) throw new Error(`Missing normative transplant dependency: ${sourceAbsolute}`)
    const link = `${sourceAbsolute}${anchor}`
    collect.push({ file: targetPath, link })
    return `${label} (레퍼런스 저장소 ${sourcePlaceholder(collect.length - 1)})`
  })
}

export function restoreSourcePaths(text, collected) {
  let out = text
  collected.forEach((item, index) => { out = out.split(sourcePlaceholder(index)).join(item.link) })
  return out
}

/**
 * staged seed 카탈로그를 선택한 bundle 만 남긴 것으로 바꾼다. 카탈로그는 대상의 게이트·`cli bundle` 이 읽는 목록이라,
 * 오지 않은 code·test·skill marker 를 그대로 두면 대상이 없는 파일을 요구한다(실측: 대상 `contracts:check` 가
 * 이관되지 않은 공용 파일 없음으로 죽었다). 형식이 바뀌면 조용히 전부 내보내지 않고 여기서 실패한다.
 */
export function limitSeedCatalog(text, ids) {
  const kept = new Set(ids)
  const lines = text.split('\n')
  const bundles = replaceCatalogBlock(lines, 'export const SEED_BUNDLES = [', ']', (body) => {
    const chunks = []
    let current = null
    for (const line of body) {
      if (current === null) {
        if (line !== '  {') throw new Error(`seed 카탈로그 형식이 바뀌었다: ${line}`)
        current = [line]
        continue
      }
      current.push(line)
      if (line === '  },') { chunks.push(current); current = null }
    }
    if (current !== null) throw new Error('seed 카탈로그 항목이 닫히지 않았다')
    const declared = new Set(chunks.map((chunk) => /^\s*id: '([^']+)'/m.exec(chunk.join('\n'))?.[1]))
    for (const id of kept) {
      if (!declared.has(id)) throw new Error(`seed 카탈로그에 없는 bundle: ${id}`)
    }
    return chunks.filter((chunk) => kept.has(/^\s*id: '([^']+)'/m.exec(chunk.join('\n'))?.[1])).flat()
  })
  return replaceCatalogBlock(bundles, 'export const SEED_BUNDLE_EXPORTS = {', '}', (body) =>
    body.filter((line) => kept.has(/^\s{2}'?([A-Za-z0-9-]+)'?:/.exec(line)?.[1]))).join('\n')
}

function replaceCatalogBlock(lines, opener, closer, transform) {
  const start = lines.indexOf(opener)
  if (start === -1) throw new Error(`staged seed 카탈로그를 찾지 못했다: ${opener}`)
  const end = lines.indexOf(closer, start + 1)
  if (end === -1) throw new Error(`staged seed 카탈로그가 닫히지 않았다: ${opener}`)
  return [...lines.slice(0, start + 1), ...transform(lines.slice(start + 1, end)), ...lines.slice(end)]
}

/**
 * staged Markdown 의 상대 링크 중 stage 에도 대상에도 없는 것. 링크 풀기를 통과하고도 남은 것은 도구의 결함이므로
 * PENDING 에 남겨 보고한다. 대상 `contracts:check` 가 같은 줄을 link 실패로 낸다.
 */
function danglingLinks(text, targetPath, stagedPaths, targetRoot) {
  const fileDir = posix.dirname(targetPath)
  const hits = []
  text.split('\n').forEach((line, index) => {
    for (const [, path] of line.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
      if (/^[a-z]+:/i.test(path) || path.startsWith('/')) continue
      const absolute = posix.normalize(posix.join(fileDir, path))
      if (stagedPaths.has(absolute) || existsSync(join(targetRoot, absolute))) continue
      hits.push({ file: targetPath, line: index + 1, link: absolute })
    }
  })
  return hits
}

/**
 * 대상 제품에 놓는 **빈 제품 사실 뼈대**.
 *
 * 옛 체계는 inventory·judgment·scenarios·index 네 파일을 만들었고, 그 넷이 같은 surface 의 사실을
 * 나눠 가져 갱신마다 세 곳이 어긋났다. 지금은 한 surface 를 fact 하나가 소유하고 색인은 생성물이라,
 * 뼈대는 **fact 쓰는 법**과 **빈 색인** 둘뿐이다. 판독 규칙(`product/policies/`)은 절차라서
 * manifest 가 그대로 옮기고 여기서 다시 만들지 않는다.
 *
 * 레퍼런스 제품의 관찰·정책·미확인은 하나도 가져가지 않는다 — 그것이 이 저장소의 목적이다.
 */
export function ledgerTemplates(sourceRoot, source, target) {
  void sourceRoot
  void source
  const files = new Map()
  files.set(`${target.inventory}/README.md`, [
    '# 제품 사실 — fact 쓰는 법',
    '',
    'surface 하나의 **관찰 · 정책 · 전이 · 미확인 · 현재 코드**를 이 폴더의 파일 하나가 소유한다.',
    '파일 이름은 `<ID>.md` 이고 그 `ID` 는 **불변**이다. 색인은 frontmatter 에서 생성되므로',
    `[${posix.basename(target.index)}](${posix.relative(target.inventory, target.index)}) 를 손으로 고치지 않는다.`,
    '',
    'TRANSPLANT_PENDING_FACTS: 이 제품의 원문(디자인 파일·기능 문서)과 접근 방법을 확정하고, 화면마다',
    'fact 를 만든다. 레퍼런스 제품의 관찰은 하나도 가져오지 않았다.',
    '',
    '## frontmatter',
    '',
    '```yaml',
    'id: <불변 ID. 파일 이름과 같다>',
    'title: <사람이 읽는 화면 이름>',
    'role: list | detail | form | collection | shared-ui | api | policy',
    'status: 관찰됨 | 확정됨 | 미확인',
    'related: [<다른 fact 의 ID>]',
    'sources:',
    '  - kind: <원문 종류>',
    '    ref: <원문 URL 과 그 안의 위치>',
    '    observed: <YYYY-MM-DD>',
    '    how: <어떤 경로로 읽었는가>',
    '```',
    '',
    '`role` 이 기본으로 읽을 역할 계약을 말한다. 요청이 API·상태·route·구조를 추가로 건드리면',
    '그 계약도 함께 읽는다 — `role` 은 기본값이지 배제 목록이 아니다.',
    '',
    '## 본문의 절',
    '',
    '| 절 | 무엇을 적나 |',
    '| --- | --- |',
    '| 관찰 | 원문에서 **본 것**. 항목·순서·필수·선택지·문구 |',
    '| 정책 | 원문이 말한 동작과 전이. 두 원문이 다르게 말하면 둘 다 적고 미확인으로 |',
    '| 상태와 소유자 | 그 화면의 값이 어디에 사는가 |',
    '| 전이 | 무엇을 누르면 어디로 가는가 |',
    '| 미확인 | 무엇이 미확인인가 · 답에 따라 무엇이 달라지나 · 누구에게 묻나 |',
    '| 현재 코드 | 어디까지 구현됐고 무엇이 보류인가 |',
    '',
    '관찰을 갱신하면 **무엇이 달라졌는지**를 남긴다. 조용히 덮어쓰지 않는다.',
    '근거의 종류와 수명, 원문을 읽는 경로는 `product/policies/` 가 소유한다.',
    '',
  ].join('\n'))
  files.set(target.index, [
    '<!-- 생성물이다. scripts/product/build-index.mjs 가 만든다. 손으로 고치지 않는다. -->',
    '# 제품 사실 색인',
    '',
    'TRANSPLANT_PENDING_INDEX: fact 를 하나라도 만든 뒤 `pnpm product:index` 로 다시 생성한다.',
    '',
    '| ID | 제목 | 역할 | 상태 | fact |',
    '| --- | --- | --- | --- | --- |',
    '',
    '총 0개.',
    '',
  ].join('\n'))
  return files
}
/**
 * 반출 전 원본 텍스트. seed 카탈로그는 선택한 bundle 만 남기고, 검사 스크립트 기본값과
 * `package.json` 초안은 대상 모드를 가리킨다(source 모드는 이 레퍼런스의 폐쇄 검사다).
 */
function sourceText(sourcePath, file, selected, stagedPaths) {
  const text = readFileSync(sourcePath, 'utf8')
  if (file === 'scripts/contracts/seed.mjs') return limitSeedCatalog(text, selected.map((bundle) => bundle.id))
  if (file === 'scripts/contracts/check.mjs') {
    const declaration = "const DEFAULT_MODE = 'source'"
    if (text.split(declaration).length !== 2) throw new Error('contracts check 기본 모드 선언이 바뀌었다')
    return text.replace(declaration, "const DEFAULT_MODE = 'target'")
  }
  if (file === 'package.json') {
    const draft = JSON.parse(text.split(TARGET_CONTRACTS_CHECK[0]).join(TARGET_CONTRACTS_CHECK[1]))
    const missing = [...new Set(Object.values(draft.scripts ?? {}).flatMap((command) =>
      [...command.matchAll(/\bscripts\/[\w./-]+\.(?:mjs|js|ts)\b/g)].map(([path]) => path)))]
      .filter((path) => !stagedPaths.has(path)).sort()
    draft.transplantReview = `TRANSPLANT_PENDING_SCRIPTS: name·scripts·verify·CI를 대상에 맞게 병합한다. 반출되지 않은 실행 파일: ${missing.join(', ') || '없음'}`
    return `${JSON.stringify(draft, null, 2)}\n`
  }
  return text
}

function isTextFile(path) {
  return /\.(md|ts|tsx|mjs|js|json|yml|yaml|css|example|gitignore|nvmrc|node-version)$/.test(path)
    || /(^|\/)\.(nvmrc|node-version|env\.example)$/.test(path)
}

/** AGENTS.md의 운영 모드와 제품 근거 포인터를 대상용으로 바꾼다. */
export function rewriteAgentsForTarget(agents, { source, target, finish } = {}) {
  const sourcePointer = source ?? productPaths(SOURCE_ROOT)
  const targetPointer = target ?? productPaths(join(SOURCE_ROOT, '.ai-work', 'transplant-no-target'))
  const close = finish ?? ((text) => rewriteProductPaths(rewriteText(text), sourcePointer, targetPointer))
  const sourceMode = '이 저장소는 다른 제품으로 옮길 레퍼런스다.'
  const productMode = '이 저장소는 제품 저장소다. 이관된 문서·skill·공용 코드는 설계 입력이며, 제품 사실은 이 저장소의 요구사항·원문·서버 계약·정책이 소유한다. 레퍼런스 제품의 도메인 값·예시 화면·판정을 이 제품의 사실로 복사하지 않는다. 공용 계약은 실제 소비자에서 같은 의미·상태 전이·실패가 확인될 때만 채택한다.'
  const matchingLines = agents.split('\n').filter((line) => line.startsWith(sourceMode))
  if (matchingLines.length !== 1) throw new Error(`AGENTS.md 레퍼런스 운영 모드 문장은 정확히 하나여야 한다: ${matchingLines.length}`)
  return close(agents.split('\n').map((line) => line.startsWith(sourceMode) ? productMode : line).join('\n'))
}

function selectBundles(ids) {
  const selectedIds = ids === undefined ? FOUNDATION_BUNDLE_IDS : ids
  return selectedIds.map((id) => {
    const bundle = SEED_BUNDLES.find((candidate) => candidate.id === id)
    if (!bundle) throw new Error(`알 수 없는 seed bundle: ${id}. node scripts/evidence/cli.mjs bundle 로 목록을 본다.`)
    return bundle
  })
}

/** 이번 이관에서 실제로 나가지 않는 ADR 의 레퍼런스 번호. 그 인용은 재번호하지 않고 표시만 한다. */
function retiredAdrs(travelling) {
  const files = new Set(travelling.filter((file) => file.startsWith('docs/decisions/')))
  const retired = [...ADR_NOT_TRANSPLANTED]
  for (const [from] of ADR_RENUMBER) {
    if (!files.has(`docs/decisions/${from}.md`)) retired.push(from.split('-', 1)[0])
  }
  return [...new Set(retired)].sort()
}

function renamedPath(path, retired) {
  for (const [from, to] of ADR_RENUMBER) {
    if (retired.includes(from.split('-', 1)[0])) continue
    if (path.includes(`docs/decisions/${from}.md`)) return path.replace(`docs/decisions/${from}.md`, `docs/decisions/${to}.md`)
  }
  return path
}

/**
 * 이번 이관의 입력을 한 번에 정한다: 선택 bundle, 제품 사실 경로, 활성 원장 포함 여부.
 *
 * 옛 체계는 대상이 `docs/reference/product.json` 으로 원장 위치를 선언할 수 있었고, 이관은 그
 * 선언에 맞춰 모든 인용을 다시 썼다. 지금은 경로가 상수(`product/facts` · `product/generated-index.md`)
 * 라서 원본과 대상이 같고 **다시 쓸 것이 없다** — 대상이 이미 쓴 fact 는 `merge` 로 보존한다.
 */
function transplantInputs(targetRoot, { bundles, withLedger = false, sourceRoot = SOURCE_ROOT } = {}) {
  void targetRoot
  const paths = productPaths(sourceRoot)
  return { selected: selectBundles(bundles), source: paths, target: paths, withLedger, sourceRoot }
}

/** 반출 대상 전체를 분류한다. plan 과 stage 가 같은 결과를 쓴다. 결과 배열에 `inputs` 가 붙는다. */
export function planTransplant(targetRoot, options = {}) {
  if (resolve(options.sourceRoot ?? SOURCE_ROOT) !== resolve(process.cwd())) {
    throw new Error('Run transplant at the reference repository root (pnpm transplant:plan / transplant:stage); import closure and source bytes must use the same checkout.')
  }
  const inputs = transplantInputs(targetRoot, options)
  const { selected, source, target, withLedger, sourceRoot } = inputs
  const items = []
  const seed = listSeedFiles(selected).filter((file) => file !== 'AGENTS.md')
  const groups = new Map()
  const manifest = withLedger ? { ...TRANSPLANT_MANIFEST, ...productLedgerManifest(sourceRoot) } : TRANSPLANT_MANIFEST
  for (const [group, entries] of Object.entries(manifest)) {
    for (const file of listTransplantManifestFiles({ [group]: entries }, sourceRoot)) groups.set(file, group)
  }
  const candidates = [...new Set([...seed, ...groups.keys()])].sort()
  const retired = retiredAdrs(candidates)
  for (const file of candidates) {
    if (FORBIDDEN_SEED_PATTERNS.some((pattern) => pattern.test(file))) {
      items.push({ file, action: 'exclude', reason: 'feature·리허설·도메인 번역' })
      continue
    }
    const group = groups.get(file) ?? 'seed'
    const targetPath = renamedPath(file, retired)
    const existsInTarget = existsSync(join(targetRoot, targetPath))
    const action = group === 'conditional' ? 'conditional' : MERGE_GROUPS.has(group) ? 'merge' : existsInTarget ? 'merge' : 'copy'
    items.push({
      file,
      targetPath,
      group,
      action,
      reason: action === 'merge'
        ? (MERGE_GROUPS.has(group) ? `${group}: 대상과 병합` : '대상에 이미 있음: diff 검토')
        : action === 'conditional'
          ? '대상 typescript·typescript-eslint·engines 버전과 대조 후 채택/재작성/삭제'
          : undefined,
    })
  }
  if (!withLedger) {
    for (const targetPath of ledgerTemplates(sourceRoot, source, target).keys()) {
      const existsInTarget = existsSync(join(targetRoot, targetPath))
      items.push({
        file: targetPath,
        targetPath,
        group: LEDGER_GROUP,
        action: existsInTarget ? 'merge' : 'generate',
        reason: existsInTarget ? '대상 원장이 이미 있음: 유지' : '빈 원장 뼈대 (이 제품의 원장은 나가지 않음)',
      })
    }
  }
  items.push({ file: 'AGENTS.md', targetPath: 'AGENTS.md', group: 'root', action: 'template', reason: '운영 모드·제품 근거 포인터 재작성, 이전 사실 목록은 sentinel 처리' })
  items.push({ file: 'README.md', targetPath: 'README.md', group: 'root', action: 'template', reason: '대상 이름·scripts·verify 투영은 사람이 다시 쓴다' })
  return Object.assign(items, { inputs: { ...inputs, retired } })
}

function summarize(items) {
  const counts = {}
  for (const item of items) counts[item.action] = (counts[item.action] ?? 0) + 1
  return counts
}

/** 대상 루트 지시문에 남은 이 제품의 어휘. 실패가 아니라 검토 목록이다(일반어와 겹치는 오탐은 리뷰 몫). */
function productTermReview(targetPath, text) {
  const hits = []
  text.split('\n').forEach((line, index) => {
    const found = productTermsInLine(line)
    if (found.length) hits.push({ file: targetPath, line: index + 1, terms: found })
  })
  return hits
}

export function stageTransplant(targetRoot, outRoot, sourceRoot = SOURCE_ROOT, options = {}) {
  const items = planTransplant(targetRoot, { ...options, sourceRoot })
  const { source, target, retired, withLedger, selected } = items.inputs
  const templates = withLedger ? new Map() : ledgerTemplates(sourceRoot, source, target)
  const stagedPaths = new Set(items.filter((item) => item.action !== 'exclude').map((item) => item.targetPath))
  const sourceReferences = []
  const rewrite = (text, sourceFile, targetPath) => {
    const delinked = targetPath.endsWith('.md')
      ? delinkUntravelled(text, { sourceFile, targetPath, source, target, retired, staged: stagedPaths, targetRoot, collect: sourceReferences, withLedger })
      : text
    const renumbered = rewriteText(delinked, { retired })
    const linked = targetPath.endsWith('.md') ? rewriteMarkdownLinks(renumbered, posix.dirname(targetPath), source, target) : renumbered
    return restoreSourcePaths(rewriteProductPaths(linked, source, target), sourceReferences)
  }
  const manifest = []
  const pending = []
  const review = []
  const productTerms = []
  const dangling = []
  mkdirSync(outRoot, { recursive: true })
  for (const item of items) {
    if (item.action === 'exclude') continue
    const sourcePath = join(sourceRoot, item.file)
    const stagedPath = join(outRoot, item.targetPath)
    mkdirSync(dirname(stagedPath), { recursive: true })
    if (item.group === LEDGER_GROUP) {
      writeFileSync(stagedPath, templates.get(item.targetPath))
    } else if (item.action === 'template' && item.file === 'AGENTS.md') {
      const finish = (text) => rewrite(text, item.file, item.targetPath)
      writeFileSync(stagedPath, rewriteAgentsForTarget(readFileSync(sourcePath, 'utf8'), { source, target, finish }))
    } else if (item.action === 'template') {
      writeFileSync(stagedPath, `TRANSPLANT_PENDING_README: 대상 저장소의 이름·런타임·scripts·verify 투영·문서 지도를 사람이 다시 쓴다. 레퍼런스 README 는 구조만 참고한다.\n\n${rewrite(readFileSync(sourcePath, 'utf8'), item.file, item.targetPath)}`)
    } else if (item.action === 'conditional') {
      writeFileSync(stagedPath, `> TRANSPLANT_PENDING_ADR_PIN: 레퍼런스 ${item.file} 의 버전 근거다. 대상 package.json·lockfile 과 대조해 채택하면 이 줄을 지우고 개정하며, 다르면 대상 결정으로 다시 쓴다.\n\n${rewrite(readFileSync(sourcePath, 'utf8'), item.file, item.targetPath)}`)
    } else if (isSymlink(sourcePath)) {
      // 어댑터는 링크로 옮긴다. 복사하면 정본과 어긋나고, 그 어긋남은 아무도 보지 않는다.
      symlinkSync(readlinkSync(sourcePath), stagedPath)
    } else if (isTextFile(item.file)) {
      writeFileSync(stagedPath, rewrite(sourceText(sourcePath, item.file, selected, stagedPaths), item.file, item.targetPath))
    } else {
      cpSync(sourcePath, stagedPath)
    }
    const staged = isSymlink(stagedPath) ? Buffer.from(readlinkSync(stagedPath)) : readFileSync(stagedPath)
    const text = isTextFile(item.targetPath) ? staged.toString('utf8') : ''
    const isTest = /\.test\.(ts|tsx|mjs)$/.test(item.file)
    if (!isTest) for (const [, id] of text.matchAll(TRANSPLANT_SENTINEL)) pending.push({ file: item.targetPath, id })
    const original = item.group !== LEDGER_GROUP && isTextFile(item.file) && item.action !== 'template' ? readFileSync(sourcePath, 'utf8') : ''
    for (const hit of findRetiredAdrCitations(original, retired)) review.push({ file: item.targetPath, ...hit })
    if (['root', 'entrypoints', 'adrs', 'conditional'].includes(item.group)) productTerms.push(...productTermReview(item.targetPath, text))
    if (item.targetPath.endsWith('.md')) dangling.push(...danglingLinks(text, item.targetPath, stagedPaths, targetRoot))
    manifest.push({ ...item, sha256: createHash('sha256').update(staged).digest('hex') })
  }
  const excluded = items.filter((item) => item.action === 'exclude')
  writeFileSync(join(outRoot, 'MANIFEST.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceRoot,
    targetRoot,
    bundles: items.inputs.selected.map((bundle) => bundle.id),
    withLedger,
    productPointer: { source, target },
    retiredAdrs: retired,
    counts: summarize(items),
    items: manifest,
    excluded,
  }, null, 2)}\n`)
  const uniquePending = [...new Map(pending.map((item) => [`${item.file}:${item.id}`, item])).values()]
  const uniqueSourceReferences = [...new Map(sourceReferences.map((item) => [`${item.file}:${item.link}`, item])).values()]
  writeFileSync(join(outRoot, 'PENDING.md'), [
    '# 이관 결정 대기 (사람이 닫는다)',
    '',
    '## TRANSPLANT_PENDING_* (하나라도 남으면 bootstrap 미완료)',
    ...uniquePending.map((item) => `- ${item.file}: ${item.id}`),
    '',
    `## 이관하지 않은 ADR 인용 (본문 검토·재작성) — 레퍼런스 ${retired.join(', ')}`,
    ...review.map((item) => `- ${item.file}:${item.line} (ADR ${item.number}) ${item.text}`),
    '',
    '## 지시문·ADR에 남은 레퍼런스 제품 어휘 (일반어 오탐은 리뷰가 가른다)',
    ...productTerms.map((item) => `- ${item.file}:${item.line} ${item.terms.join('·')}`),
    '',
    '## 레퍼런스 저장소에만 있는 근거 (링크를 풀고 출처 경로를 남겼다 — 이 제품의 근거로 다시 쓴다)',
    ...uniqueSourceReferences.map((item) => `- ${item.file} → 레퍼런스 저장소 ${item.link}`),
    '',
    '## 남은 끊긴 링크 (링크 풀기를 통과했다 — 도구 결함)',
    ...dangling.map((item) => `- ${item.file}:${item.line} → ${item.link}`),
    '',
    '## 조건부',
    '- `docs/decisions/0006-typescript-version-pin.md`·`0007-runtime-version-pin.md`(레퍼런스 0002·0004): 대상 `package.json`·lockfile 의 typescript·typescript-eslint·engines 와 대조해 같으면 머리글 sentinel 을 지우고 개정, 다르면 대상 결정으로 다시 쓴다.',
    '- 대상에 이미 있는 primitive·config·package.json·런타임 진입점: MANIFEST.json 의 `merge` 항목. 덮어쓰지 않고 diff 를 사람이 병합한다.',
    withLedger
      ? '- `--with-ledger`: 레퍼런스 제품의 활성 원장이 그대로 들어갔다. 대상 제품의 원문으로 다시 관찰하기 전까지는 참고 자료이며 제품 사실이 아니다.'
      : `- 원장 뼈대(\`${target.inventory}/\`, \`${target.scenarios}/\`, \`${target.judgment}\`, \`${target.index}\`): 이 제품의 원문으로 채우고 색인 연결을 다시 구성한다. 레퍼런스 원장이 필요하면 \`--with-ledger\` 로 별도 stage 한다.`,
    '- 알려진 a11y known-defect: `MultiSelect` 빈 값 `—` 하드코딩, `Pagination` out-of-range `aria-current`. AT 실측 후 수정.',
    '',
  ].join('\n'))
  return {
    items,
    manifest,
    pending: uniquePending,
    review,
    productTerms,
    sourceReferences: uniqueSourceReferences,
    danglingLinks: dangling,
    retired,
    pointer: { source, target },
    outRoot,
  }
}

export function applyTransplant(targetRoot, outRoot) {
  const manifestPath = join(outRoot, 'MANIFEST.json')
  if (!existsSync(manifestPath)) throw new Error(`stage 결과가 없다: ${manifestPath}. 먼저 stage 를 실행한다.`)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  // 모든 사본을 먼저 확인한다. 늦게 정렬된 파일의 불일치로 대상이 일부만 채워지지 않게 한다.
  for (const item of manifest.items) {
    if (sha256(join(outRoot, item.targetPath)) !== item.sha256) throw new Error(`stage 사본이 MANIFEST 와 다르다: ${item.targetPath}. stage 를 다시 실행한다.`)
  }
  const copied = []
  const skipped = []
  for (const item of manifest.items) {
    const stagedPath = join(outRoot, item.targetPath)
    const destination = join(targetRoot, item.targetPath)
    // `merge` 는 대상이 가진 파일과 합치는 것이므로 없어도 복사하지 않는다(레퍼런스 설정을 대상 설정으로 만들지 않기 위해).
    // `template` 은 sentinel 이 박힌 사람용 초안이라 빈 자리에는 들어가야 게이트가 루트 지시문을 읽을 수 있다.
    if (!['copy', 'conditional', 'generate', 'template'].includes(item.action) || existsSync(destination)) {
      skipped.push({ ...item, reason: existsSync(destination) ? '대상에 이미 있음 (diff 병합은 사람이)' : item.reason })
      continue
    }
    mkdirSync(dirname(destination), { recursive: true })
    if (isSymlink(stagedPath)) symlinkSync(readlinkSync(stagedPath), destination)
    else cpSync(stagedPath, destination)
    copied.push(item.targetPath)
  }
  return { copied, skipped }
}

export function verifyTarget(targetRoot) {
  const steps = [
    ['pnpm', ['contracts:check', '--mode', 'target']],
    ['pnpm', ['typecheck']],
    ['pnpm', ['lint']],
    ['pnpm', ['test:unit']],
  ]
  const results = []
  for (const [command, args] of steps) {
    const run = spawnSync(command, args, { cwd: targetRoot, encoding: 'utf8', shell: process.platform === 'win32' })
    results.push({ step: [command, ...args].join(' '), status: run.status, tail: `${run.stdout}${run.stderr}`.trim().split('\n').slice(-8).join('\n') })
    if (run.status !== 0) break
  }
  return results
}

function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

function main() {
  const command = process.argv[2]
  const targetRoot = argument('--target')
  if (!command || !targetRoot) {
    console.error('usage: transplant.mjs <plan|stage|apply|verify> --target <repo> [--out <dir>] [--bundles a,b] [--with-ledger]')
    process.exit(2)
  }
  const target = resolve(targetRoot)
  if (['plan', 'stage'].includes(command) && resolve(process.cwd()) !== SOURCE_ROOT) {
    console.error('Run transplant at the reference repository root: pnpm transplant:plan / transplant:stage')
    process.exit(2)
  }
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    console.error(`  ✗ 대상 디렉터리가 없다: ${target}`)
    process.exit(2)
  }
  if (resolve(target) === SOURCE_ROOT) {
    console.error('  ✗ 대상이 레퍼런스 자신이다.')
    process.exit(2)
  }
  const outRoot = resolve(argument('--out', join(SOURCE_ROOT, '.ai-work', 'transplant-stage')))
  const bundlesArgument = argument('--bundles')
  const options = {
    bundles: bundlesArgument === undefined ? undefined : bundlesArgument.split(',').map((id) => id.trim()).filter(Boolean),
    withLedger: process.argv.includes('--with-ledger'),
  }

  if (command === 'plan') {
    const items = planTransplant(target, options)
    for (const item of items) {
      console.log(`  ${item.action.padEnd(11)} ${item.file}${item.targetPath && item.targetPath !== item.file ? ` → ${item.targetPath}` : ''}${item.reason ? `  (${item.reason})` : ''}`)
    }
    console.log(`\n  bundles ${items.inputs.selected.map((bundle) => bundle.id).join(', ')}`)
    console.log(`  원장 포인터 ${JSON.stringify(items.inputs.target)}${options.withLedger ? ' (활성 원장 포함)' : ' (빈 뼈대 생성)'} · 미이관 ADR ${items.inputs.retired.join(', ')}`)
    console.log(`  ${Object.entries(summarize(items)).map(([action, count]) => `${action} ${count}`).join(' · ')}`)
    return
  }
  if (command === 'stage') {
    const result = stageTransplant(target, outRoot, SOURCE_ROOT, options)
    console.log(`  ✓ stage → ${relativeTo(SOURCE_ROOT, outRoot)}: ${Object.entries(summarize(result.items)).map(([action, count]) => `${action} ${count}`).join(' · ')}`)
    console.log(`  · 원장 포인터 ${JSON.stringify(result.pointer.target)}`)
    console.log(`  · pending sentinel ${result.pending.length}개, 미이관 ADR 인용 ${result.review.length}줄, 루트 제품 어휘 ${result.productTerms.length}줄, 레퍼런스 근거 링크 ${result.sourceReferences.length}개, 남은 끊긴 링크 ${result.danglingLinks.length}개 → ${relativeTo(SOURCE_ROOT, join(outRoot, 'PENDING.md'))}`)
    return
  }
  if (command === 'apply') {
    const result = applyTransplant(target, outRoot)
    for (const file of result.copied) console.log(`  + ${file}`)
    for (const item of result.skipped) console.log(`  = ${item.targetPath}  (${item.reason})`)
    console.log(`\n  복사 ${result.copied.length} · 보류 ${result.skipped.length}. 보류 항목은 diff 를 사람이 병합한다.`)
    return
  }
  if (command === 'verify') {
    const results = verifyTarget(target)
    for (const result of results) {
      console.log(`  ${result.status === 0 ? '✓' : '✗'} ${result.step}`)
      if (result.status !== 0) console.log(result.tail.split('\n').map((line) => `      ${line}`).join('\n'))
    }
    process.exit(results.every((result) => result.status === 0) ? 0 : 1)
  }
  console.error(`  ✗ 알 수 없는 명령: ${command}`)
  process.exit(2)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
