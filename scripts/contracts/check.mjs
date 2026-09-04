#!/usr/bin/env node
/**
 * 규범 문서와 저장소 설정의 기계적 정합성만 검사한다.
 * 설계 판단이나 문서 내용의 옳고 그름은 검사하지 않는다. 그건 리뷰가 소유한다.
 *
 * `--mode source`(기본): 이 레퍼런스 저장소. seed·manifest 폐쇄를 검사하고, 코드 안의
 *   `TRANSPLANT_PENDING_*` 는 이관 대기 목록으로만 보고한다(문서 안의 sentinel은 실패).
 * `--mode target`: 이관된 제품 저장소. seed·manifest 검사는 source 전용이라 건너뛰고,
 *   문서·코드 어디에든 sentinel 이 남아 있으면 bootstrap 미완료로 실패한다.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  agentsSectionReferenceFailures,
  claudeAgentsImportFailure,
  ciVerifyStageFailures,
  ciWorkflowConcurrencyFailures,
  ciWorkflowScriptFailures,
  collectDocumentFiles,
  copilotAgentsPointerFailure,
  documentBudgetFailures,
  ledgerIndexFailures,
  DOCUMENT_LINE_BUDGET,
  parseReadmeVerifyProjection,
  parseVerifyChain,
  pnpmCommandFailures,
  prohibitedAbstractionSourceFailures,
  readLocalLinkFailures,
  retiredDocumentNameFailures,
  transplantSentinelFailures,
  transplantSentinelOccurrences,
} from './contracts.mjs'
import {
  findContractPathMismatches,
  findUnregisteredPorts,
  readDeclaredPaths,
} from './api-surface.mjs'
import {
  SEED_BUNDLES,
  collectImportClosure,
  collectTestImportClosure,
  findBundleClosureLeaks,
  findForbiddenSeedFiles,
  findUndeclaredContractExports,
  findUnexpectedSeedTests,
  listSeedFiles,
  listTransplantManifestFiles,
  validateSeedBundles,
  validateTransplantManifest,
} from './seed.mjs'

const modeIndex = process.argv.indexOf('--mode')
const mode = modeIndex === -1 ? 'source' : process.argv[modeIndex + 1]
if (mode !== 'source' && mode !== 'target') {
  console.error(`  ✗ --mode 는 source | target 이어야 한다: ${mode}`)
  process.exit(1)
}

const failures = []
const notes = []

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const chain = parseVerifyChain(packageJson.scripts?.verify ?? '')
failures.push(...ciVerifyStageFailures(packageJson.scripts ?? {}))
const workflow = readFileSync(resolve('.github/workflows/verify.yml'), 'utf8')
failures.push(...ciWorkflowScriptFailures(workflow))
failures.push(...ciWorkflowConcurrencyFailures(workflow))
const projected = parseReadmeVerifyProjection(readFileSync(resolve('README.md'), 'utf8'))
if (projected === null) {
  failures.push('README.md 에 `pnpm verify` 단계를 투영한 행이 없다.')
} else if (chain.join(' → ') !== projected.join(' → ')) {
  failures.push(
    `verify 체인 불일치\n      package.json: ${chain.join(' → ')}\n      README.md   : ${projected.join(' → ')}`,
  )
}

const documents = collectDocumentFiles()
failures.push(...pnpmCommandFailures(documents, packageJson.scripts ?? {}))
failures.push(...readLocalLinkFailures(documents))
failures.push(...documentBudgetFailures(documents))

const agents = readFileSync(resolve('AGENTS.md'), 'utf8')
const claudeImport = claudeAgentsImportFailure(readFileSync(resolve('CLAUDE.md'), 'utf8'))
if (claudeImport !== null) failures.push(claudeImport)

// 런타임 포인터는 저장소가 실제로 쓰는 것만 검사한다. 없는 런타임의 파일을 요구하지 않는다.
const copilotPointerPath = resolve('.github/copilot-instructions.md')
const copilotChecked = existsSync(copilotPointerPath)
if (copilotChecked) {
  const copilotPointer = copilotAgentsPointerFailure(readFileSync(copilotPointerPath, 'utf8'))
  if (copilotPointer !== null) failures.push(copilotPointer)
}

/** 문서 밖에서 규범 이름·§번호를 인용하는 설정과 소스. */
function listSourceFiles(root) {
  if (!existsSync(resolve(root))) return []
  return readdirSync(resolve(root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx|mjs|js)$/.test(entry.name))
    .map((entry) => resolve(entry.parentPath, entry.name).slice(resolve('.').length + 1))
}
const citingFiles = [
  ...documents,
  'eslint.config.js',
  'vite.config.ts',
  'vitest.config.ts',
  '.gitignore',
  '.env.example',
  ...listSourceFiles('src'),
  ...listSourceFiles('scripts').filter((file) => !file.startsWith('scripts/contracts/')),
].filter((file) => existsSync(resolve(file)))
failures.push(...retiredDocumentNameFailures(citingFiles))
failures.push(...agentsSectionReferenceFailures(citingFiles, agents))
failures.push(...prohibitedAbstractionSourceFailures(readFileSync(resolve('eslint.config.js'), 'utf8')))
failures.push(...ledgerIndexFailures())

// 문서 안의 sentinel 은 어느 모드에서도 결정 미해소다.
failures.push(...transplantSentinelFailures(documents))

// 타입·테스트가 통과해도 런타임에만 죽는 두 실패. 실제로 겪어서 넣었다.
failures.push(...findUnregisteredPorts())
const declaredPaths = readDeclaredPaths()
failures.push(...findContractPathMismatches(declaredPaths))

let seedSummary = null
if (mode === 'source') {
  failures.push(...validateSeedBundles())
  failures.push(...validateTransplantManifest())
  const codeClosure = collectImportClosure(SEED_BUNDLES.flatMap((bundle) => bundle.code))
  const testClosure = collectTestImportClosure(SEED_BUNDLES.flatMap((bundle) => bundle.tests))
  const seedFiles = listSeedFiles()
  const manifestFiles = listTransplantManifestFiles()
  for (const file of findUnexpectedSeedTests(seedFiles)) {
    failures.push(`seed focused-test 이탈: 선언되지 않은 test가 closure에 포함됨: ${file}`)
  }
  for (const file of findForbiddenSeedFiles(seedFiles)) {
    failures.push(`seed 오염: feature·리허설·도메인 번역이 closure에 포함됨: ${file}`)
  }
  for (const file of findUndeclaredContractExports()) {
    failures.push(`seed 부수 반출: test closure로만 따라온 계약 파일 (bundle code root로 선언하거나 의존을 끊어야 한다): ${file}`)
  }
  for (const { bundle, from, to } of findBundleClosureLeaks()) {
    failures.push(`seed bundle ${bundle} 폐쇄 이탈: ${from} → ${to} (진입점을 좁히거나 의존을 끊어야 한다)`)
  }
  // 지어낸 값과 미확정 계약의 살아 있는 목록. seed 밖(feature)까지 훑어야 화면 작업의 발명이 다 잡힌다.
  const pending = transplantSentinelOccurrences(
    [...new Set([...seedFiles, ...manifestFiles, ...listSourceFiles('src')])]
      .filter((file) => !file.endsWith('.md') && !/\.test\.(ts|tsx|mjs)$/.test(file)),
  )
  if (pending.length > 0) {
    const byId = [...new Set(pending.map((item) => item.id))].sort()
    notes.push(`계약 미확정 자리 ${pending.length}곳 (source 모드에서는 허용, 대상에서 해소): ${byId.join(', ')}`)
  }
  seedSummary = `seed ${SEED_BUNDLES.length}개 4-part bundle의 code-root ${SEED_BUNDLES.flatMap((bundle) => bundle.code).length}개(closure ${codeClosure.length}) + focused-test-root ${new Set(SEED_BUNDLES.flatMap((bundle) => bundle.tests)).size}개(closure ${testClosure.length})가 ${seedFiles.length}파일 안에서 폐쇄, manifest ${manifestFiles.length}파일 실존`
} else {
  // 테스트 fixture 문자열과 레퍼런스 측 이관 도구는 결정이 아니다.
  const codeFiles = [...listSourceFiles('src'), ...listSourceFiles('scripts'), 'eslint.config.js', 'vite.config.ts', 'vitest.config.ts', 'package.json']
    .filter((file) => !/\.test\.(ts|tsx|mjs)$/.test(file) && !file.startsWith('scripts/transplant/'))
  failures.push(...transplantSentinelFailures(codeFiles.filter((file) => existsSync(resolve(file)))))
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log(`  ✓ verify 체인 ${chain.length}단계가 README 투영과 일치`)
console.log('  ✓ verify↔CI stage 소유가 누락·추가·중복 없이 일치')
console.log(`  ✓ 문서 ${documents.length}개의 pnpm 명령과 로컬 link 대상 실존`)
console.log(`  ✓ 에이전트 문서 ${documents.length}개의 줄 수 예산 ${DOCUMENT_LINE_BUDGET} 이내`)
console.log('  ✓ CLAUDE.md 가 AGENTS.md 를 첫 지시로 import')
if (copilotChecked) console.log('  ✓ Copilot 첫 본문 지시가 AGENTS.md 를 가리킴')
console.log(`  ✓ 삭제된 문서 이름·옛 AGENTS §번호·금지 추상화 근거 파일 drift 없음 (${citingFiles.length}파일)`)
console.log('  ✓ 시나리오 원장 색인과 카드가 서로를 덮음')
console.log(`  ✓ 문서 안 미해소 이관 sentinel 없음${mode === 'target' ? ' (target: 코드 포함)' : ''}`)
console.log(
  declaredPaths === null
    ? '  ✓ transport 포트 등록됨 (계약 snapshot 없음: 경로 대조 건너뜀)'
    : `  ✓ transport 포트 등록됨 · 손으로 쓴 요청 경로가 선언된 계약 경로 ${declaredPaths.length}개와 일치`,
)
if (seedSummary !== null) console.log(`  ✓ ${seedSummary}`)
for (const note of notes) console.log(`  · ${note}`)
