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
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { headingAnchors, productTermsInLine, TRANSPLANT_SENTINEL } from '../contracts/contracts.mjs'
import { PRODUCT_POINTER, productPaths } from '../contracts/product-paths.mjs'
import {
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
 * 가리키는 것이며 순서는 레퍼런스 번호 순이다. 0001·0002·0004·0007 은 가지 않는다(0002·0004 는 조건부 재작성).
 * 선택 bundle 에 따라 실제로 가지 않는 ADR 은 stage 가 `retired` 로 옮겨 인용만 표시한다.
 */
export const ADR_RENUMBER = [
  ['0003-datetime-utc', '0001-datetime-utc'],
  ['0005-locale-query-key', '0002-locale-query-key'],
  ['0006-auth-token-storage', '0003-auth-token-storage'],
  ['0008-primitive-implementation-selection', '0004-primitive-implementation-selection'],
  ['0009-shared-boundaries', '0005-shared-boundaries'],
  ['0010-form-boundaries', '0006-form-boundaries'],
  ['0011-detail-data-and-update-history-boundaries', '0007-detail-data-and-update-history-boundaries'],
  // 조건부(Q1/H6): 대상 버전과 대조해 채택·재작성·삭제한다. 번호 충돌을 피해 뒤에 붙인다.
  ['0002-typescript-version-pin', '0008-typescript-version-pin'],
  ['0004-runtime-version-pin', '0009-runtime-version-pin'],
  // 공용 목록·필터 계약. 조건부 버전 핀 다음 번호지만 일반 ADR로 이관한다.
  ['0012-list-filter-draft-composition', '0010-list-filter-draft-composition'],
]

/** 이관하지 않는 ADR. 본문에서 이 번호를 인용한 곳은 재번호 전에 표시하고 사람이 검토한다. */
export const ADR_NOT_TRANSPLANTED = ['0001', '0007']

/** 대상은 Managers 가 없다. 레퍼런스 consumer 를 가리키는 예시 심볼은 `{Domain}` 자리표시자로 바꾼다. */
export const EXAMPLE_SYMBOL_SUBSTITUTIONS = [
  ['useManagerListData', 'use{Domain}ListData'],
  ['useManagerEditDetail', 'use{Domain}EditDetail'],
  ['useManagerDetail', 'use{Domain}Detail'],
  ['useUpdateManagerMutation', 'useUpdate{Domain}Mutation'],
  ['ManagerForm', '{Domain}Form'],
]

/**
 * 이전 AGENTS §1 사실 목록과의 호환: 라벨 → sentinel ID. 현행 제품 사실은 원장 README가 소유한다.
 * 값은 나가지 않는다 — 이 제품의 사실은 다른 제품의 기본값이 아니다.
 */
export const PRODUCT_FACT_SLOTS = [
  ['제품과 사용자', 'PRODUCT_USERS'],
  ['배포 환경', 'DEPLOY_ENV'],
  ['Admin OpenAPI URL', 'OPENAPI_URL'],
  ['계약 snapshot', 'CONTRACT_SNAPSHOT'],
  ['기술 스택', 'STACK'],
  ['다국어', 'LOCALES'],
  ['날짜·시간', 'DATETIME'],
  ['권한 기준선', 'PERMISSIONS'],
]

/** 대상과 병합해야 하는 파일. 이미 있으면 절대 덮어쓰지 않는다. */
const MERGE_GROUPS = new Set(['templates', 'app', 'config'])
/** stage 가 만드는 빈 원장 뼈대. `--with-ledger` 의 `ledger` 그룹(레퍼런스 원장 복사)과 다르다. */
const LEDGER_GROUP = 'ledger-shell'

/**
 * 이 저장소의 실측 기록이라 대상의 사실이 아니고, 그렇다고 지울 수도 없는 문서. 인용하는 문서가 앵커로 가리키므로
 * heading 골격만 남기고 본문을 비운다. 대상은 자기 드릴로 다시 채운다(파일 자신의 서문이 그렇게 지시한다).
 */
const HISTORICAL_STUBS = ['.agents/skills/screen-loop/references/observations.md']

/** 대상 저장소는 자기 자신을 대상 모드로 검사한다. source 모드는 이 레퍼런스의 seed·manifest 폐쇄 검사다. */
const TARGET_CONTRACTS_CHECK = ['node scripts/contracts/check.mjs', 'node scripts/contracts/check.mjs --mode target']

function relativeTo(root, path) {
  return relative(root, path).split('\\').join('/')
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/** 텍스트 파일에 ADR 재번호와 예시 심볼 치환을 적용한다. `retired` 에 든 번호는 재번호하지 않고 인용만 표시한다. */
export function rewriteText(text, { renumber = ADR_RENUMBER, symbols = EXAMPLE_SYMBOL_SUBSTITUTIONS, retired = ADR_NOT_TRANSPLANTED } = {}) {
  let out = text
  // 미이관 ADR 인용은 재번호 전에 레퍼런스 번호로 고정해 새 번호와 섞이지 않게 한다.
  for (const number of retired) {
    out = out.replace(new RegExp(`ADR\\s?${number}\\b`, 'g'), `ADR(레퍼런스 ${number}, 미이관)`)
  }
  const active = renumber.filter(([from]) => !retired.includes(from.split('-', 1)[0]))
  // 옛 번호 → 자리표시자 → 새 번호. 두 단계로 나눠야 0008→0004 뒤에 0004→0009 가 다시 잡히지 않는다.
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
    const requiredContract = sourceAbsolute.startsWith('.agents/skills/') ||
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
 * 이 저장소의 실측 기록을 중립 뼈대로 만든다. 본문·표·수치는 내보내지 않고, 문서 제목과 **다른 문서가 앵커로
 * 가리키는 절 제목**만 남긴다. 아무도 가리키지 않는 절 제목은 남길 이유가 없다 — 그 날짜의 드릴은 대상 저장소에서
 * 일어난 적이 없다. 코드 fence 안의 `#` 은 heading 이 아니다.
 */
export function historicalStub(text, cited = new Set()) {
  const out = []
  let fence = null
  for (const line of text.split('\n')) {
    const fenceMark = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMark) {
      if (fence === null) fence = fenceMark[1][0]
      else if (fenceMark[1][0] === fence) fence = null
      continue
    }
    if (fence !== null || !/^#{1,6} /.test(line)) continue
    if (out.length === 0) {
      out.push(line, '', '레퍼런스 저장소의 실측 기록은 이관되지 않았다. 이 저장소에는 아직 관찰이 없다. 아래 절 제목은 이 파일을 앵커로 인용하는 문서를 위해 남겨 둔 자리이며, 이 저장소의 드릴로 채운다.', '')
      continue
    }
    if (cited.has([...headingAnchors(line)][0])) out.push(line, '')
  }
  return out.join('\n')
}

/** 이번 stage 의 다른 문서가 `#앵커` 로 가리키는 절. 뼈대가 남겨야 하는 제목의 근거다. */
function citedAnchors(items, sourceRoot, file) {
  const anchors = new Set()
  for (const item of items) {
    if (item.action === 'exclude' || item.file === file || !item.file.endsWith('.md')) continue
    const path = join(sourceRoot, item.file)
    if (!existsSync(path)) continue
    const directory = posix.dirname(item.file)
    for (const [, target, anchor] of readFileSync(path, 'utf8').matchAll(/\]\(([^)\s#]+)(#[^)]*)\)/g)) {
      if (posix.normalize(posix.join(directory, target)) === file) anchors.add(anchor.slice(1).toLowerCase())
    }
  }
  return anchors
}

/**
 * staged seed 카탈로그를 선택한 bundle 만 남긴 것으로 바꾼다. 카탈로그는 대상의 게이트·`cli bundle` 이 읽는 목록이라,
 * 오지 않은 code·test·skill marker 를 그대로 두면 대상이 없는 파일을 요구한다(실측: 대상 `contracts:check` 가
 * `use-confirmation.ts` 없음으로 죽었다). 형식이 바뀌면 조용히 전부 내보내지 않고 여기서 실패한다.
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

/** 한 절의 heading 줄부터 같은 깊이 이상의 다음 heading 직전까지. 문서 서문·상위 절은 붙이지 않는다. */
function sectionBody(text, heading) {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => /^#{1,6} /.test(line) && line.replace(/^#+ /, '').trim() === heading)
  if (start === -1) throw new Error(`레퍼런스 원장 절이 없다: ${heading}`)
  const level = lines[start].match(/^#+/)[0].length
  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6}) /)
    if (match && match[1].length <= level) { end = index; break }
  }
  return lines.slice(start, end).join('\n').trimEnd()
}

/** `](../x)` 링크를 fromDir 기준에서 toDir 기준으로 다시 계산한다. 외부 URL·루트 절대 경로·앵커만 있는 링크는 그대로. */
function relocateLinks(text, fromDir, toDir) {
  return text.replace(/\]\(([^)\s#]+)(#[^)]*)?\)/g, (match, path, anchor = '') => {
    if (/^[a-z]+:/i.test(path) || path.startsWith('/')) return match
    const absolute = posix.normalize(posix.join(fromDir, path))
    return `](${posix.relative(toDir, absolute)}${anchor})`
  })
}

function readSource(sourceRoot, file) {
  return readFileSync(join(sourceRoot, file), 'utf8')
}

/**
 * 대상 포인터 경로에 놓는 빈 원장 뼈대. 절 구조·표 형식·근거 수명처럼 파서와 skill 이 의존하는 절은 레퍼런스 원장에서
 * 그대로 옮기고(제품 사실이 아니라 절차), 판독 우선순위·제품 이름·원문 출처는 sentinel 로 남긴다. 링크는 새 깊이로 재계산한다.
 */
export function ledgerTemplates(sourceRoot, source, target) {
  const inventoryReadme = readSource(sourceRoot, `${source.inventory}/README.md`)
  const scenariosReadme = readSource(sourceRoot, `${source.scenarios}/README.md`)
  const move = (text, from, to) => rewriteProductPaths(relocateLinks(text, from, to), source, target)
  const files = new Map()
  files.set(PRODUCT_POINTER, `${JSON.stringify(target, null, 2)}\n`)
  files.set(`${target.inventory}/README.md`, [
    '# 제품 surface 인벤토리',
    '',
    'TRANSPLANT_PENDING_INVENTORY: 이 제품의 원문(디자인 파일·정책 문서)과 관찰 방법·시점을 적고, 섹션 파일을 화면 × surface 단위로 채운다. 레퍼런스 제품의 관찰은 가져오지 않았다.',
    `[${posix.basename(target.index)}](${posix.relative(target.inventory, target.index)})은 이 인벤토리의 연결 정보만 소유한다. 경로는 \`${PRODUCT_POINTER}\` 이 가리킨다.`,
    '',
    '## 프로젝트 사실',
    '',
    'TRANSPLANT_PENDING_FACTS: 대상 제품과 사용자, 배포 환경, API 정본, 언어·시간·권한 정책을 실제 제품 근거로 확정한다. 원본 프로젝트 사실은 이관하지 않는다.',
    '',
    move(sectionBody(inventoryReadme, '근거의 수명과 읽기 범위'), source.inventory, target.inventory),
    '',
    move(sectionBody(inventoryReadme, '표 형식'), source.inventory, target.inventory),
    '',
    '## 판독 규칙',
    '',
    'TRANSPLANT_PENDING_READING_RULES: 두 원문이 같은 사실을 다르게 말할 때 어느 쪽을 정본으로 읽는지, 구성(항목·순서·초기 상태)은 어느 원문만이 열거하는지 이 제품에서 확정한다.',
    '',
    '## 섹션 파일',
    '',
    '| 파일 | 원문 위치 |',
    '| --- | --- |',
    '',
  ].join('\n'))
  files.set(target.index, `${JSON.stringify({ judgment: [], surfaces: [] }, null, 2)}\n`)
  files.set(target.judgment, [
    '# 공용화 판정',
    '',
    'TRANSPLANT_PENDING_JUDGMENT: 이 제품의 인벤토리와 시나리오를 근거로 surface 별 공용 / feature / 미확인 판정을 적는다. 레퍼런스 제품의 판정은 가져오지 않았다.',
    '',
    '## 1. 판정 원칙',
    '',
    '## 5. 미확인 — 답이 구현을 바꾸는 질문',
    '',
  ].join('\n'))
  files.set(`${target.scenarios}/README.md`, [
    '# 시나리오 원장',
    '',
    'TRANSPLANT_PENDING_SCENARIOS: 화면이 무엇으로 보이는지가 아니라 런타임에 무엇이 실제로 일어나는지를 카드로 기록한다. 아래 표에 없는 카드는 라우팅에서 도달하지 못한다.',
    '',
    move(sectionBody(scenariosReadme, '카드 한 장의 절 구조'), source.scenarios, target.scenarios),
    '',
    '## 현재 카드',
    '',
    '| 카드 | 다루는 것 | 연결된 이슈 |',
    '| --- | --- | --- |',
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

/**
 * AGENTS.md의 운영 모드와 제품 근거 포인터를 대상용으로 바꾼다. 이전 루트에 §1 사실 목록이 있으면
 * sentinel로 바꾸며, 현행 루트의 제품 사실은 ledgerTemplates가 빈 대상 원장으로 교체한다.
 */
export function rewriteAgentsForTarget(agents, { source, target, finish } = {}) {
  const sourcePointer = source ?? productPaths(SOURCE_ROOT)
  const targetPointer = target ?? productPaths(join(SOURCE_ROOT, '.ai-work', 'transplant-no-target'))
  const close = finish ?? ((text) => rewriteProductPaths(rewriteText(text), sourcePointer, targetPointer))
  const lines = agents.split('\n')
  const out = []
  let section = null
  let factIndex = 0
  for (const line of lines) {
    if (/^## 0\. /.test(line)) {
      section = 0
      out.push('## 0. 저장소 운영 모드: 제품 저장소')
      out.push('')
      out.push('이 저장소는 레퍼런스에서 검증된 UI·상태·URL·API·화면 조립 계약을 이관해 시작한 제품 저장소다. 이관된 skill·ADR·공용 코드는 설계 입력이고, 제품 진실은 이 제품의 요구사항·디자인 원문·OpenAPI·정책이다. 각 계약은 첫 실제 consumer 에서 `채택 / 수정 / 제외`로 판정하고 두 번째 consumer 에서 confirm 하거나 demote 한다. 레퍼런스 제품의 화면·정책·판정을 이 제품의 사실로 복사하지 않는다.')
      out.push('')
      out.push('문서는 100% 기준이 아니다. 근거는 코드·계약·검사·제품 증거와 실측한 결함이다. 문서와 더 나은 설계가 어긋나면 설계를 먼저 고치고 문서·skill·검사를 같은 작업에서 따라 바꾼다.')
      out.push('')
      out.push(`제품 전체의 관찰 증거는 화면 구성·정책이 [인벤토리](${targetPointer.inventory}/README.md), 런타임 상태 전이·실패·복구가 [시나리오](${targetPointer.scenarios}/README.md), 그 증거로 내린 공용/feature 판정과 미확인 질문이 \`${targetPointer.judgment}\`로 나뉜다. 네 위치(원장·판정·시나리오·색인)의 경로는 \`${PRODUCT_POINTER}\` 한 곳이 가리키고 scripts와 skill은 그 포인터로 읽는다. 각 원장의 읽기 범위·표 형식·재관찰 조건은 그 \`README.md\`가 소유한다. 화면을 조립하거나 공용화를 판단할 때 그 화면의 인벤토리 절과 색인이 연결한 판정·확정 답·미확인 질문을 먼저 대조하고, 없는 증거는 현재 코드로 채우지 않는다.`)
      out.push('')
      continue
    }
    if (/^## 1\. /.test(line)) {
      section = 1
      out.push(line)
      continue
    }
    if (/^## \d+\. /.test(line)) section = null
    if (section === 0) continue
    if (section === 1) {
      const fact = line.match(/^- ([^:]+): /)
      if (fact) {
        const label = fact[1].trim()
        const slot = PRODUCT_FACT_SLOTS.find(([known]) => label.startsWith(known))?.[1] ?? String(factIndex + 1)
        factIndex += 1
        out.push(`- ${label}: TRANSPLANT_PENDING_FACT_${slot} — 이 제품에서 확인한 값으로 바꾼다. 확정 전에는 추측해 채우지 않는다.`)
        continue
      }
      out.push(line)
      continue
    }
    if (/^- 신규 프로젝트 seed는 /.test(line)) {
      out.push('- 이관 결정이 필요한 자리에는 `TRANSPLANT_PENDING_<ID>`를 남기며 하나라도 있으면 bootstrap 완료가 아니다. `pnpm contracts:check --mode target`이 문서와 코드 전체에서 이를 검사한다. 채택 후보의 code 진입점·skill 문장·ADR 결정·focused test 4-part 와 shared/feature 소유권은 레퍼런스 `scripts/contracts/seed.mjs` 가 기록한 값을 입력으로 삼되, 이 저장소에서는 실제 consumer 가 채택 여부를 판정한다.')
      continue
    }
    out.push(line)
  }
  return close(out.join('\n'))
}

function selectBundles(ids) {
  if (ids === undefined) return SEED_BUNDLES
  return ids.map((id) => {
    const bundle = SEED_BUNDLES.find((candidate) => candidate.id === id)
    if (!bundle) throw new Error(`알 수 없는 seed bundle: ${id}. node scripts/agents/cli.mjs bundle 로 목록을 본다.`)
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
 * 이번 이관의 입력을 한 번에 정한다: 선택 bundle, 원장 포인터(대상이 가진 것이 이기고 없으면 product-paths 기본값;
 * `--with-ledger` 이고 대상 포인터가 없으면 레퍼런스 포인터 그대로), 활성 원장 포함 여부.
 */
function transplantInputs(targetRoot, { bundles, withLedger = false, sourceRoot = SOURCE_ROOT } = {}) {
  const source = productPaths(sourceRoot)
  const targetHasPointer = existsSync(join(targetRoot, PRODUCT_POINTER))
  const target = withLedger && !targetHasPointer ? source : productPaths(targetRoot)
  return { selected: selectBundles(bundles), source, target, withLedger, sourceRoot }
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
    } else if (HISTORICAL_STUBS.includes(item.file)) {
      writeFileSync(stagedPath, historicalStub(readFileSync(sourcePath, 'utf8'), citedAnchors(items, sourceRoot, item.file)))
    } else if (isTextFile(item.file)) {
      writeFileSync(stagedPath, rewrite(sourceText(sourcePath, item.file, selected, stagedPaths), item.file, item.targetPath))
    } else {
      cpSync(sourcePath, stagedPath)
    }
    const staged = readFileSync(stagedPath)
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
    '- `docs/decisions/0008-typescript-version-pin.md`·`0009-runtime-version-pin.md`(레퍼런스 0002·0004): 대상 `package.json`·lockfile 의 typescript·typescript-eslint·engines 와 대조해 같으면 머리글 sentinel 을 지우고 개정, 다르면 대상 결정으로 다시 쓴다.',
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
    cpSync(stagedPath, destination)
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
