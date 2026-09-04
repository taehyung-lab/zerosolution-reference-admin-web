#!/usr/bin/env node
/**
 * 레퍼런스 → 신규 제품 저장소 이관 명령. 작업 트리 파일 시스템만 읽고 git 명령은 쓰지 않는다
 * (작업 트리와 HEAD가 다르다). 대상 파일을 덮어쓰거나 지우지 않으며, 제품 의미가 필요한 자리는
 * `TRANSPLANT_PENDING_*` 로 남겨 사람이 닫는다.
 *
 *   node scripts/transplant/transplant.mjs plan   --target <repo>
 *   node scripts/transplant/transplant.mjs stage  --target <repo> [--out <dir>]
 *   node scripts/transplant/transplant.mjs apply  --target <repo> [--out <dir>]
 *   node scripts/transplant/transplant.mjs verify --target <repo>
 *
 * plan: 반출 목록을 copy / merge / template / exclude / pending 으로 분류해 출력한다(읽기 전용).
 * stage: 치환(ADR 재번호, Managers 예시)을 적용한 사본을 out 디렉터리에 만들고 MANIFEST.json·PENDING.md를 쓴다.
 * apply: stage 사본 중 대상에 없는 파일만 복사한다. 이미 있는 파일은 diff 대상으로 보고만 한다.
 * verify: 대상에서 contracts:check --mode target, typecheck, lint, test:unit 을 순서대로 실행한다.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TRANSPLANT_SENTINEL } from '../contracts/contracts.mjs'
import {
  FORBIDDEN_SEED_PATTERNS,
  listSeedFiles,
  listTransplantManifestFiles,
  SEED_BUNDLES,
  TRANSPLANT_MANIFEST,
} from '../contracts/seed.mjs'

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Q3(2026-09-03): 대상은 ADR 을 0001 부터 다시 번호 붙인다. 이관 ADR 은 seed bundle 과 skill 이 이름으로
 * 가리키는 일곱이며 순서는 레퍼런스 번호 순이다. 0001·0002·0004·0007 은 가지 않는다(0002·0004 는 조건부 재작성).
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

/** 대상과 병합해야 하는 파일. 이미 있으면 절대 덮어쓰지 않는다. */
const MERGE_GROUPS = new Set(['templates', 'app', 'config'])

function relativeTo(root, path) {
  return relative(root, path).split('\\').join('/')
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/** 텍스트 파일에 ADR 재번호와 예시 심볼 치환을 적용한다. */
export function rewriteText(text, { renumber = ADR_RENUMBER, symbols = EXAMPLE_SYMBOL_SUBSTITUTIONS, retired = ADR_NOT_TRANSPLANTED } = {}) {
  let out = text
  // 미이관 ADR 인용은 재번호 전에 레퍼런스 번호로 고정해 새 번호와 섞이지 않게 한다.
  for (const number of retired) {
    out = out.replace(new RegExp(`ADR\\s?${number}\\b`, 'g'), `ADR(레퍼런스 ${number}, 미이관)`)
  }
  // 옛 번호 → 자리표시자 → 새 번호. 두 단계로 나눠야 0008→0004 뒤에 0004→0009 가 다시 잡히지 않는다.
  const placeholder = (index) => `\u0000ADR${index}\u0000`
  renumber.forEach(([from], index) => {
    const [fromNumber] = from.split('-', 1)
    out = out.split(from).join(`${placeholder(index)}-${from.slice(fromNumber.length + 1)}`)
    out = out.replace(new RegExp(`ADR\\s?${fromNumber}\\b`, 'g'), `ADR ${placeholder(index)}`)
    out = out.replace(new RegExp(`(^|[^\\w-])${fromNumber}\\.\\s`, 'gm'), `$1${placeholder(index)}. `)
  })
  renumber.forEach(([, to], index) => {
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

function renamedPath(path) {
  for (const [from, to] of ADR_RENUMBER) {
    if (path.includes(`docs/decisions/${from}.md`)) return path.replace(`docs/decisions/${from}.md`, `docs/decisions/${to}.md`)
  }
  return path
}

function isTextFile(path) {
  return /\.(md|ts|tsx|mjs|js|json|yml|yaml|css|example|gitignore|nvmrc|node-version)$/.test(path)
    || /(^|\/)\.(nvmrc|node-version|env\.example)$/.test(path)
}

/** AGENTS.md 를 대상용으로 다시 쓴다. 레퍼런스 운영 모드 절만 바꾸고 나머지 자세·경계·라우팅은 유지한다. */
export function rewriteAgentsForTarget(agents) {
  const lines = agents.split('\n')
  const out = []
  let skipping = false
  for (const line of lines) {
    if (/^## 0\. /.test(line)) {
      skipping = true
      out.push('## 0. 저장소 운영 모드: 제품 저장소')
      out.push('')
      out.push('이 저장소는 레퍼런스(`zerosolution-reference-admin-web`)에서 검증된 UI·상태·URL·API·화면 조립 계약을 이관해 시작한 ZERO PLUS+ 제품 저장소다. 이관된 skill·ADR·공용 코드는 설계 입력이고, 제품 진실은 이 제품의 요구사항·Figma·OpenAPI·정책이다. 각 계약은 첫 실제 consumer 에서 `채택 / 수정 / 제외`로 판정하고 두 번째 consumer 에서 confirm 하거나 demote 한다.')
      out.push('')
      out.push('문서는 100% 기준이 아니다. 근거는 코드·계약·검사·제품 증거와 실측한 결함이다. 문서와 더 나은 설계가 어긋나면 설계를 먼저 고치고 문서·skill·검사를 같은 작업에서 따라 바꾼다.')
      out.push('')
      out.push('제품 전체의 관찰 증거는 `docs/reference/zero-sol/`이 소유하고, 그 증거로 내린 공용/feature 판정과 미확인 질문은 `docs/reference/zero-sol-figma-analysis.md`가 소유한다. 화면을 새로 조립하거나 공용화를 판단할 때 그 화면의 인벤토리 절과 판정 문서를 먼저 대조한다.')
      out.push('')
      continue
    }
    if (skipping) {
      if (/^## 1\. /.test(line)) skipping = false
      else continue
    }
    if (/^- 계약 snapshot: `openapi\/admin\.snapshot\.json`/.test(line)) {
      out.push('- Admin OpenAPI 와 계약 snapshot: TRANSPLANT_PENDING_OPENAPI_URL — 신규 백엔드 OpenAPI URL 과 `openapi/admin.snapshot.json` 출처가 확정되면 이 줄을 사실로 바꾼다. 확정 전에는 endpoint·DTO·enum·status·permission 을 추측하지 않는다.')
      continue
    }
    if (/^- 신규 프로젝트 seed는 /.test(line)) {
      out.push('- 이관 결정이 필요한 자리에는 `TRANSPLANT_PENDING_<ID>`를 남기며 하나라도 있으면 bootstrap 완료가 아니다. `pnpm contracts:check --mode target`이 문서와 코드 전체에서 이를 검사한다. 채택 후보의 code 진입점·skill 문장·ADR 결정·focused test 4-part 와 shared/feature 소유권은 레퍼런스 `scripts/contracts/seed.mjs` 가 기록한 값을 입력으로 삼되, 이 저장소에서는 실제 consumer 가 채택 여부를 판정한다.')
      continue
    }
    out.push(line)
  }
  return rewriteText(out.join('\n'))
}

/** 반출 대상 전체를 분류한다. plan 과 stage 가 같은 결과를 쓴다. */
export function planTransplant(targetRoot) {
  const items = []
  const seed = listSeedFiles().filter((file) => file !== 'AGENTS.md')
  const groups = new Map()
  for (const [group, entries] of Object.entries(TRANSPLANT_MANIFEST)) {
    for (const file of listTransplantManifestFiles({ [group]: entries })) groups.set(file, group)
  }
  const candidates = new Set([...seed, ...groups.keys()])
  for (const file of [...candidates].sort()) {
    if (FORBIDDEN_SEED_PATTERNS.some((pattern) => pattern.test(file))) {
      items.push({ file, action: 'exclude', reason: 'feature·리허설·도메인 번역' })
      continue
    }
    const group = groups.get(file) ?? 'seed'
    const targetPath = renamedPath(file)
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
  items.push({ file: 'AGENTS.md', targetPath: 'AGENTS.md', group: 'root', action: 'template', reason: '§0·§1 OpenAPI·§7 seed 문장 재작성' })
  items.push({ file: 'README.md', targetPath: 'README.md', group: 'root', action: 'template', reason: '대상 이름·scripts·verify 투영은 사람이 다시 쓴다' })
  return items
}

function summarize(items) {
  const counts = {}
  for (const item of items) counts[item.action] = (counts[item.action] ?? 0) + 1
  return counts
}

export function stageTransplant(targetRoot, outRoot, sourceRoot = SOURCE_ROOT) {
  const items = planTransplant(targetRoot)
  const manifest = []
  const pending = []
  const review = []
  mkdirSync(outRoot, { recursive: true })
  for (const item of items) {
    if (item.action === 'exclude') continue
    const sourcePath = join(sourceRoot, item.file)
    const stagedPath = join(outRoot, item.targetPath)
    mkdirSync(dirname(stagedPath), { recursive: true })
    if (item.action === 'template' && item.file === 'AGENTS.md') {
      writeFileSync(stagedPath, rewriteAgentsForTarget(readFileSync(sourcePath, 'utf8')))
    } else if (item.action === 'template') {
      writeFileSync(stagedPath, `TRANSPLANT_PENDING_README: 대상 저장소의 이름·런타임·scripts·verify 투영·문서 지도를 사람이 다시 쓴다. 레퍼런스 README 는 구조만 참고한다.\n\n${rewriteText(readFileSync(sourcePath, 'utf8'))}`)
    } else if (item.action === 'conditional') {
      writeFileSync(stagedPath, `> TRANSPLANT_PENDING_ADR_PIN: 레퍼런스 ${item.file} 의 버전 근거다. 대상 package.json·lockfile 과 대조해 채택하면 이 줄을 지우고 개정하며, 다르면 대상 결정으로 다시 쓴다.\n\n${rewriteText(readFileSync(sourcePath, 'utf8'))}`)
    } else if (isTextFile(item.file)) {
      writeFileSync(stagedPath, rewriteText(readFileSync(sourcePath, 'utf8')))
    } else {
      cpSync(sourcePath, stagedPath)
    }
    const staged = readFileSync(stagedPath)
    const text = isTextFile(item.file) ? staged.toString('utf8') : ''
    const isTest = /\.test\.(ts|tsx|mjs)$/.test(item.file)
    if (!isTest) for (const [, id] of text.matchAll(TRANSPLANT_SENTINEL)) pending.push({ file: item.targetPath, id })
    const original = isTextFile(item.file) && item.action !== 'template' ? readFileSync(sourcePath, 'utf8') : ''
    for (const hit of findRetiredAdrCitations(original)) review.push({ file: item.targetPath, ...hit })
    manifest.push({ ...item, sha256: createHash('sha256').update(staged).digest('hex') })
  }
  const excluded = items.filter((item) => item.action === 'exclude')
  writeFileSync(join(outRoot, 'MANIFEST.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceRoot,
    targetRoot,
    bundles: SEED_BUNDLES.map((bundle) => bundle.id),
    counts: summarize(items),
    items: manifest,
    excluded,
  }, null, 2)}\n`)
  const uniquePending = [...new Map(pending.map((item) => [`${item.file}:${item.id}`, item])).values()]
  writeFileSync(join(outRoot, 'PENDING.md'), [
    '# 이관 결정 대기 (사람이 닫는다)',
    '',
    '## TRANSPLANT_PENDING_* (하나라도 남으면 bootstrap 미완료)',
    ...uniquePending.map((item) => `- ${item.file}: ${item.id}`),
    '',
    '## 이관하지 않은 ADR 인용 (본문 검토·재작성)',
    ...review.map((item) => `- ${item.file}:${item.line} (ADR ${item.number}) ${item.text}`),
    '',
    '## 조건부',
    '- `docs/decisions/0008-typescript-version-pin.md`·`0009-runtime-version-pin.md`(레퍼런스 0002·0004): 대상 `package.json`·lockfile 의 typescript·typescript-eslint·engines 와 대조해 같으면 머리글 sentinel 을 지우고 개정, 다르면 대상 결정으로 다시 쓴다.',
    '- 대상에 이미 있는 primitive·config·package.json: MANIFEST.json 의 `merge` 항목. 덮어쓰지 않고 diff 를 사람이 병합한다.',
    '- 알려진 a11y known-defect: `MultiSelect` 빈 값 `—` 하드코딩, `Pagination` out-of-range `aria-current`. AT 실측 후 수정.',
    '',
  ].join('\n'))
  return { items, manifest, pending: uniquePending, review, outRoot }
}

export function applyTransplant(targetRoot, outRoot) {
  const manifestPath = join(outRoot, 'MANIFEST.json')
  if (!existsSync(manifestPath)) throw new Error(`stage 결과가 없다: ${manifestPath}. 먼저 stage 를 실행한다.`)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const copied = []
  const skipped = []
  for (const item of manifest.items) {
    const stagedPath = join(outRoot, item.targetPath)
    const destination = join(targetRoot, item.targetPath)
    if (sha256(stagedPath) !== item.sha256) throw new Error(`stage 사본이 MANIFEST 와 다르다: ${item.targetPath}. stage 를 다시 실행한다.`)
    if (!['copy', 'conditional'].includes(item.action) || existsSync(destination)) {
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
    console.error('usage: transplant.mjs <plan|stage|apply|verify> --target <repo> [--out <dir>]')
    process.exit(2)
  }
  const target = resolve(targetRoot)
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    console.error(`  ✗ 대상 디렉터리가 없다: ${target}`)
    process.exit(2)
  }
  if (resolve(target) === SOURCE_ROOT) {
    console.error('  ✗ 대상이 레퍼런스 자신이다.')
    process.exit(2)
  }
  const outRoot = resolve(argument('--out', join(SOURCE_ROOT, '.ai-work', 'transplant-stage')))

  if (command === 'plan') {
    const items = planTransplant(target)
    for (const item of items) {
      console.log(`  ${item.action.padEnd(8)} ${item.file}${item.targetPath && item.targetPath !== item.file ? ` → ${item.targetPath}` : ''}${item.reason ? `  (${item.reason})` : ''}`)
    }
    console.log(`\n  ${Object.entries(summarize(items)).map(([action, count]) => `${action} ${count}`).join(' · ')}`)
    return
  }
  if (command === 'stage') {
    const result = stageTransplant(target, outRoot)
    console.log(`  ✓ stage → ${relativeTo(SOURCE_ROOT, outRoot)}: ${Object.entries(summarize(result.items)).map(([action, count]) => `${action} ${count}`).join(' · ')}`)
    console.log(`  · pending sentinel ${result.pending.length}개, 미이관 ADR 인용 ${result.review.length}줄 → ${relativeTo(SOURCE_ROOT, join(outRoot, 'PENDING.md'))}`)
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
