import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export const DOCUMENT_LINE_BUDGET = 200
// A diagnostic threshold, not a failure: roughly the current expensive workflow reference.
export const DOCUMENT_BYTE_BUDGET = 24 * 1024

/** 문서가 `pnpm <cmd>` 로 부를 수 있는 내장 명령. script 가 아니어도 실재한다. */
const PNPM_BUILTINS = new Set([
  'install', 'add', 'remove', 'update', 'run', 'exec', 'dlx', 'why', 'list', 'outdated', 'audit',
  'publish', 'pack', 'link', 'unlink', 'store', 'import', 'prune', 'rebuild', 'setup', 'env',
])

/** 정합성 대조 대상 문서. 임시 작업물(.ai-work)은 저장소 산출물이 아니므로 제외한다. */
const DOCUMENT_ROOTS = ['.agents', 'docs', 'product']
const DOCUMENT_FILES = [
  'AGENTS.md',
  'README.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  'openapi/README.md',
  'scripts/contracts/README.md',
]

export function collectDocumentFiles() {
  const files = DOCUMENT_FILES.filter((file) => existsSync(resolve(file)))
  for (const root of DOCUMENT_ROOTS) {
    if (!existsSync(resolve(root))) continue
    for (const entry of readdirSync(resolve(root), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const absolute = resolve(entry.parentPath, entry.name)
      files.push(absolute.slice(resolve('.').length + 1))
    }
  }
  return files.sort()
}

/** `pnpm a && pnpm b` 형태의 verify 체인을 단계 이름 배열로 만든다. */
export function parseVerifyChain(script) {
  return script
    .split('&&')
    .map((step) => step.trim().replace(/^pnpm\s+(run\s+)?/, ''))
    .filter((step) => step !== '')
}

/** CI 는 verify의 각 단계를 정확히 한 job script가 소유하도록 나눈다. */
export const CI_VERIFY_SCRIPTS = ['ci:static', 'ci:unit', 'ci:e2e']

/** verify 단계와 CI 단계의 누락·추가·중복 소유를 확인한다. */
export function ciVerifyStageFailures(scripts) {
  const verifyStages = parseVerifyChain(scripts.verify ?? '')
  const verifyStageSet = new Set(verifyStages)
  const verifyStageCounts = new Map()
  const ciStageOwners = new Map()
  const failures = []

  for (const stage of verifyStages) {
    verifyStageCounts.set(stage, (verifyStageCounts.get(stage) ?? 0) + 1)
  }

  for (const scriptName of CI_VERIFY_SCRIPTS) {
    if (!Object.hasOwn(scripts, scriptName)) {
      failures.push(`CI script 누락: ${scriptName}`)
      continue
    }
    const script = scripts[scriptName]
    if (typeof script !== 'string' || script.trim() === '') {
      failures.push(`CI script 비어 있음: ${scriptName}`)
      continue
    }
    for (const stage of parseVerifyChain(script)) {
      const owners = ciStageOwners.get(stage) ?? []
      owners.push(scriptName)
      ciStageOwners.set(stage, owners)
    }
  }

  for (const [stage, count] of verifyStageCounts) {
    if (count > 1) failures.push(`verify에서 중복: ${stage}`)
  }
  for (const stage of verifyStages) {
    if (!ciStageOwners.has(stage)) failures.push(`verify에만 존재: ${stage}`)
  }
  for (const stage of ciStageOwners.keys()) {
    if (!verifyStageSet.has(stage)) failures.push(`CI에만 존재: ${stage}`)
  }
  for (const [stage, owners] of ciStageOwners) {
    if (owners.length > 1) failures.push(`CI에서 중복: ${stage} (${owners.join(', ')})`)
  }
  return failures
}

/** workflow가 각 CI stage script를 한 번 이상 호출하는지 텍스트로 확인한다. */
export function ciWorkflowScriptFailures(workflow) {
  return CI_VERIFY_SCRIPTS
    .filter((scriptName) => new RegExp(
      `^\\s*(?:-\\s+)?run:\\s*pnpm\\s+(?:run\\s+)?${scriptName}(?=\\s|$)`,
      'm',
    ).test(workflow) === false)
    .map((scriptName) => `CI workflow에서 호출하지 않음: ${scriptName}`)
}

/** PR supersession만 취소하고 main을 포함한 비-PR 실행은 서로 다른 그룹에 둔다. */
export function ciWorkflowConcurrencyFailures(workflow) {
  const concurrency = /^concurrency:\r?\n {2}group:\s*(.+)\r?\n {2}cancel-in-progress:\s*(.+)(?:\r?\n|$)/m.exec(workflow)
  const group = concurrency?.[1].trim()
  const cancelInProgress = concurrency?.[2].trim()
  const failures = []

  if (group !== "${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}") {
    failures.push('CI workflow concurrency group은 PR ref와 비-PR run_id를 분리해야 한다.')
  }
  if (cancelInProgress !== "${{ github.event_name == 'pull_request' }}") {
    failures.push('CI workflow cancel-in-progress는 pull_request에서만 true여야 한다.')
  }
  return failures
}

/** README 의 `pnpm verify` 투영 행에서 `a → b → c` 단계 목록을 뽑는다. */
export function parseReadmeVerifyProjection(readme) {
  const row = readme.split('\n').find((line) => line.includes('`pnpm verify`') && line.includes('→'))
  if (row === undefined) return null
  const arrowSpan = /([A-Za-z0-9:_-]+(?:\s*→\s*[A-Za-z0-9:_-]+)+)/.exec(row)
  if (arrowSpan === null) return null
  return arrowSpan[1].split('→').map((step) => step.trim())
}

/** 문서 안 `pnpm <cmd>` 언급이 실제 script 또는 pnpm 내장 명령인지 확인한다. */
export function pnpmCommandFailures(files, scripts) {
  const failures = []
  for (const file of files) {
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const [, command] of line.matchAll(/\bpnpm\s+([a-z][a-z0-9:_-]*)/g)) {
        if (command in scripts || PNPM_BUILTINS.has(command)) continue
        failures.push(`${file}:${index + 1}: \`pnpm ${command}\` 는 script 도 pnpm 내장 명령도 아니다.`)
      }
    })
  }
  return failures
}

/**
 * Markdown heading 의 GitHub 식 anchor. 소문자, 백틱 제거, 글자·숫자·공백·하이픈 외 문자 제거, 공백 → 하이픈,
 * 같은 slug 가 반복되면 `-1`, `-2`. 코드 fence 안의 `#` 줄은 heading 이 아니다.
 */
export function headingAnchors(markdown) {
  const seen = new Map()
  const anchors = new Set()
  let fence = null
  for (const line of markdown.split('\n')) {
    const opening = /^\s*(```|~~~)/.exec(line)
    if (opening && fence === null) { fence = opening[1]; continue }
    if (opening && opening[1] === fence) { fence = null; continue }
    if (fence !== null) continue
    const heading = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)
    if (!heading) continue
    // GitHub slugs the rendered text: an inline link or image contributes its text, never its URL.
    const rendered = heading[1].replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    const base = rendered.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').trim().replace(/\s/g, '-')
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    anchors.add(count === 0 ? base : `${base}-${count}`)
  }
  return anchors
}

function decodedAnchor(anchor) {
  try { return decodeURIComponent(anchor).toLowerCase() } catch { return anchor.toLowerCase() }
}

/**
 * 로컬 Markdown link 의 대상 파일과 `#앵커` 가 실재하는지 확인한다. 외부 URL 은 대상이 아니다.
 * 2026-09-10 까지 앵커를 보지 않아 루트가 깊은 절을 11곳 가리키면서도 절 제목 변경을 잡을 수 없었다.
 */
/**
 * 현재 정본 계약·제품 경로를 가리키는 문장이 실존 파일을 가리키는지 본다.
 *
 * markdown link 검사는 `[label](path)` 만 본다. 라우팅 표는 경로를 `` `.agents/skills/list-contract/SKILL.md` ``
 * 처럼 코드 표기로 쓰는 일이 많고, 그 자리가 끊겨도 아무도 잡지 못했다 — 새 문서 체계 첫 드릴에서
 * 워커가 없는 계약 3개를 만나 직접 보고했다. 존재가 아니라 **가리킨 대상이 실재하는가**를 본다.
 */
export function citedContractPathFailures(files, exists) {
  const failures = []
  const pattern = /(?<![A-Za-z0-9._/-])(?:`)?((?:\.agents\/skills|contracts|product)\/[A-Za-z0-9._/-]+\.md)(?:`)?(?=$|[^A-Za-z0-9._/-])/g
  for (const { file, content } of files) {
    for (const [, cited] of content.matchAll(pattern)) {
      if (!exists(cited)) failures.push(`${file}: 가리킨 계약·제품 문서가 없다 → ${cited}`)
    }
  }
  return [...new Set(failures)].sort()
}

export function readLocalLinkFailures(files) {
  const failures = []
  const anchorCache = new Map()
  const anchorsOf = (absolute) => {
    if (!anchorCache.has(absolute)) anchorCache.set(absolute, headingAnchors(readFileSync(absolute, 'utf8')))
    return anchorCache.get(absolute)
  }
  for (const file of files) {
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const [, target] of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:)/.test(target)) continue
        const [path, anchor] = target.split('#')
        const absolute = path === ''
          ? resolve(file)
          : path.startsWith('/') ? resolve(`.${path}`) : resolve(dirname(resolve(file)), path)
        if (!existsSync(absolute)) {
          failures.push(`${file}:${index + 1}: link 대상 없음 → ${target}`)
          continue
        }
        if (anchor === undefined || !absolute.endsWith('.md')) continue
        if (!anchorsOf(absolute).has(decodedAnchor(anchor))) {
          failures.push(`${file}:${index + 1}: link 앵커 없음 → ${target}`)
        }
      }
    })
  }
  return failures
}

/**
 * 이관 대상 저장소는 source 의 잠정 선택을 그대로 물려받으면 안 된다. 결정이 필요한 자리에
 * `TRANSPLANT_PENDING_<ID>` 를 남기고, 하나라도 남아 있으면 bootstrap 을 완료로 보지 않는다.
 * 이 검사는 결정이 **기록됐는지**만 증명한다. 기록된 값이 옳은지는 증명하지 않는다.
 */
export const TRANSPLANT_SENTINEL = /TRANSPLANT_PENDING_([A-Z][A-Z0-9_]*)/g

export function transplantSentinelOccurrences(files) {
  const occurrences = []
  for (const file of files) {
    if (!existsSync(resolve(file))) continue
    // manifest 는 파일뿐 아니라 어댑터 링크도 옮긴다. sentinel 은 파일 안에만 있다.
    if (!statSync(resolve(file)).isFile()) continue
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const [, id] of line.matchAll(TRANSPLANT_SENTINEL)) {
        occurrences.push({ file, line: index + 1, id })
      }
    })
  }
  return occurrences
}

export function transplantSentinelFailures(files) {
  return transplantSentinelOccurrences(files).map(
    ({ file, line, id }) => `${file}:${line}: 이관 결정 미해소 → ${id}`,
  )
}

/**
 * 삭제된 규범 문서의 이름은 어디에도 남으면 안 된다. link 검사는 Markdown link만 보므로
 * 주석·표·근거 문자열 속 이름은 이 목록으로 잡는다. 이름을 지울 때 여기서도 지운다.
 */
/** AGENTS.md 와 skill description은 모든 작업이 시작할 때 함께 내는 고정 비용이다. */
export const ALWAYS_LOADED_CHARACTER_BUDGET = 5_400

export function skillDescription(document) {
  const frontmatter = /^---\s*\n([\s\S]*?)\n---/m.exec(document)?.[1] ?? ''
  const lines = frontmatter.split('\n')
  const index = lines.findIndex((line) => /^description\s*:/.test(line))
  if (index === -1) return null

  const first = lines[index].replace(/^description\s*:\s*/, '')
  const blockHeader = /^[>|](?:(?:[+-][1-9]?)|(?:[1-9][+-]?))?\s*(?:#.*)?$/
  if (!blockHeader.test(first)) return first.trim() || null

  const block = []
  for (const line of lines.slice(index + 1)) {
    if (line.length > 0 && !/^\s/.test(line)) break
    block.push(line.trim())
  }
  return block.filter(Boolean).join(' ') || null
}

export function alwaysLoadedBudgetFailures(rootDocument, skillDocuments, budget = ALWAYS_LOADED_CHARACTER_BUDGET) {
  const rootCharacters = rootDocument.length
  const descriptions = skillDocuments.map(skillDescription)
  const missing = descriptions.filter((description) => description === null).length
  if (missing > 0) return [`skill description ${missing}개를 읽지 못했다 — 0자로 계산하지 않고 frontmatter를 고친다.`]
  const descriptionCharacters = descriptions.reduce((total, description) => total + description.length, 0)
  const total = rootCharacters + descriptionCharacters
  if (total <= budget) return []
  return [`항상 로드되는 지시가 ${total}자다(루트 ${rootCharacters}자 + description ${descriptionCharacters}자, 상한 ${budget}자). 상한을 늘리지 말고 조건부 정보를 소유자로 옮긴다.`]
}

export function baselineEntryFailures(rootDocument, skillDocuments, baselineDocument, budget = ALWAYS_LOADED_CHARACTER_BUDGET) {
  const descriptions = skillDocuments.map(skillDescription)
  if (descriptions.some((description) => description === null)) return ['현재 baseline을 계산할 skill description을 읽지 못했다.']
  let baseline
  try { baseline = JSON.parse(baselineDocument) } catch { return ['scripts/loop/baseline.json 이 유효한 JSON이 아니다.'] }
  const lineageFailures = []
  if (typeof baseline.supersedes?.revision !== 'string' || baseline.supersedes.revision.trim() === '') {
    lineageFailures.push('baseline supersedes.revision이 없다.')
  }
  if (baseline.supersedes?.comparable !== false) {
    lineageFailures.push('baseline supersedes.comparable은 false여야 한다.')
  }
  if (typeof baseline.supersedes?.reason !== 'string' || baseline.supersedes.reason.trim() === '') {
    lineageFailures.push('직접 비교할 수 없는 이유가 없다.')
  }
  if (typeof baseline.supersedes?.note !== 'string' || baseline.supersedes.note.trim() === '') {
    lineageFailures.push('이전 원시 값 보존 위치가 없다.')
  }
  if (baseline.transplant !== undefined) {
    const transplant = baseline.transplant
    if (typeof transplant.observedAt !== 'string' || transplant.observedAt.trim() === '') {
      lineageFailures.push('transplant.observedAt이 없다.')
    }
    if (typeof transplant.sourceRevision !== 'string' || transplant.sourceRevision.trim() === '') {
      lineageFailures.push('transplant.sourceRevision이 없다.')
    }
    if (!Array.isArray(transplant.defaultBundleIds)
      || transplant.defaultBundleIds.length === 0
      || transplant.defaultBundleIds.some((id) => typeof id !== 'string' || id.trim() === '')) {
      lineageFailures.push('transplant.defaultBundleIds는 비어 있지 않은 문자열 배열이어야 한다.')
    }
    if (typeof transplant.verificationCeiling !== 'string' || transplant.verificationCeiling.trim() === '') {
      lineageFailures.push('transplant.verificationCeiling이 없다.')
    }
    if (typeof transplant.targetRuntime !== 'string' || transplant.targetRuntime.trim() === '') {
      lineageFailures.push('transplant.targetRuntime이 없다.')
    }
    if (typeof transplant.reason !== 'string' || transplant.reason.trim() === '') {
      lineageFailures.push('transplant.reason이 없다.')
    }
    if (transplant.targetRuntime === 'passed' && transplant.targetEvidence === undefined) {
      lineageFailures.push('transplant.targetRuntime passed에는 targetEvidence가 필요하다.')
    }
  }
  const current = {
    rootCharacters: rootDocument.length,
    descriptionCharacters: descriptions.reduce((total, description) => total + description.length, 0),
    budgetCharacters: budget,
  }
  current.alwaysLoadedCharacters = current.rootCharacters + current.descriptionCharacters
  const drift = Object.entries(current).filter(([key, value]) => baseline.entry?.[key] !== value)
  if (drift.length === 0) return lineageFailures
  return [...lineageFailures, `현재 문서와 baseline이 다르다: ${drift.map(([key, value]) => `${key}=${value}(기록 ${baseline.entry?.[key] ?? '없음'})`).join(', ')}`]
}

/**
 * `.claude/skills` 는 `.agents/skills` 를 가리키는 **링크여야 한다.**
 *
 * 복사본이면 정본과 어긋나고, 그 어긋남은 아무도 보지 않는다. 실제로 이관이 한 번 링크를 따라가
 * 22파일을 복제했다 — `stat` 이 심링크를 따라가기 때문이었고, 그때 아무 검사도 울리지 않았다.
 * 존재가 아니라 **무엇인지**를 본다(ADR 0016).
 */
export function skillAdapterFailures(
  adapter = '.claude/skills',
  canonical = '.agents/skills',
  link = (path) => (existsSync(resolve(path)) && lstatSync(resolve(path)).isSymbolicLink() ? readlinkSync(resolve(path)) : null),
  exists = (path) => existsSync(resolve(path)),
) {
  if (!exists(canonical)) return [`${canonical} 이 없다 — 계약의 정본이 사라졌다`]
  const target = link(adapter)
  if (target === null) {
    return [`${adapter} 가 링크가 아니다. 복사본은 정본과 어긋난다 — \`ln -s ../${canonical} ${adapter}\``]
  }
  const resolved = posixResolve(dirname(adapter), target)
  if (resolved !== canonical) {
    return [`${adapter} 가 ${resolved} 를 가리킨다. ${canonical} 이어야 한다`]
  }
  return []
}

/** 링크 대상은 POSIX 경로다. 파일 시스템을 건드리지 않고 문자열로 정규화한다. */
function posixResolve(from, target) {
  const parts = []
  for (const segment of `${from}/${target}`.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') parts.pop()
    else parts.push(segment)
  }
  return parts.join('/')
}

export const RETIRED_DOCUMENT_NAMES = [
  // 2026-09-17 새 문서 체계: screen-loop 가 두 질문 라우팅과 역할 계약으로 갈렸다.
  // 그 전환을 결정한 ADR 과 당시를 기록한 문서는 이 이름을 불러야 하므로 예외를 준다.
  { name: 'screen-loop', allowIn: ['docs/decisions/', 'docs/reference/zero-sol-figma-analysis.md'] },
  // 2026-09-17 skill 라우팅: 계약이 `contracts/` 에서 `.agents/skills/*/SKILL.md` 로 돌아갔다.
  { name: 'contracts/direct', allowIn: ['docs/decisions/'] },
  { name: 'contracts/contract', allowIn: ['docs/decisions/'] },
  // 같은 전환에서 skill 이름 자체도 은퇴했다. 경로만 고치고 링크 라벨에 옛 이름을 남기면
  // 읽는 사람은 없는 문서를 찾는다 — 실제로 9곳이 그렇게 남아 있었다.
  { name: 'feature-contract', allowIn: ['docs/decisions/'] },
  { name: 'api-contract', allowIn: ['docs/decisions/'] },
  { name: 'shared-ui-contract', allowIn: ['docs/decisions/'] },
  { name: 'folder-structure-contract', allowIn: ['docs/decisions/'] },

  '2026-09-14-reference-document-loop-redesign.md',
  'list-detail.md',
  'screen-anatomy.md',
  'form-actions.md',
  'field-and-select',
  'dialog-and-status',
  // 2026-09-16 단일 화면 형태(ADR 0014): feature-contract 7 → list·detail·form, shared-ui-contract 22 → catalog, ADR 0009~0012 → 0014
  'list-workflow.md',
  'list-search-contract.md',
  'detail-workflow.md',
  'form-workflow.md',
  'bulk-actions.md',
  'mutation-actions.md',
  'table-composition.md',
  'logic-promotion.md',
  'shared-values.md',
  'selection-confirmation.md',
  'filter-fields.md',
  'form-fields.md',
  'data-table.md',
  'dialogs.md',
  'disclosure-sections.md',
  'page-and-detail-surfaces.md',
  'list-result.md',
  'pagination.md',
  'blocking-progress.md',
  'incidents.md',
  'badge.md',
  'notifications.md',
  'checkbox-group.md',
  'combobox.md',
  'multiselect.md',
  'radio-group.md',
  'date-file-fields.md',
  'react-performance.md',
  '0009-shared-boundaries.md',
  '0010-form-boundaries.md',
  '0011-detail-data-and-update-history-boundaries.md',
  '0012-list-filter-draft-composition.md',
  'BulkActionDialogs',
  'use-confirmation.ts',
]

/**
 * 폐기 이름은 문자열이거나 `{ name, allowIn }` 이다.
 *
 * `allowIn` 은 **그 이름을 적는 것이 정당한 파일**이다 — 그 체계를 결정한 ADR 과 무슨 일이 있었는지
 * 적은 기록은 폐기된 이름을 불러야 한다. 예외가 없으면 검사를 통과시키려고 역사를 지우게 된다.
 * 예외는 "과거를 말하는 문서"에만 주고, 살아 있는 소유자를 지목하는 문장에는 주지 않는다.
 */
export function retiredDocumentNameFailures(files, names = RETIRED_DOCUMENT_NAMES) {
  // 폐기 이름이 더 긴 이름의 조각일 때 잡으면 안 된다 — `0001-rehearsal-api-contract.md` 는
  // 살아 있는 ADR 파일 이름이지 `api-contract` 를 부르는 것이 아니다.
  const entries = names.map((item) => (typeof item === 'string' ? { name: item, allowIn: [] } : item))
    .map((entry) => ({ ...entry, pattern: new RegExp(`(?<![\\w-])${entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`) }))
  const failures = []
  for (const file of files) {
    if (!existsSync(resolve(file))) continue
    // manifest 는 파일뿐 아니라 어댑터 링크도 옮긴다. sentinel 은 파일 안에만 있다.
    if (!statSync(resolve(file)).isFile()) continue
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const { name, allowIn, pattern } of entries) {
        if (!pattern.test(line)) continue
        if (allowIn.some((prefix) => file.startsWith(prefix))) continue
        failures.push(`${file}:${index + 1}: 삭제된 문서 이름 → ${name}`)
      }
    })
  }
  return failures
}

/** `.agents/skills` 아래 skill 디렉터리 이름. 없으면 빈 목록이다(이식 대상의 초기 상태). */
function skillDirectories(root = '.agents/skills') {
  if (!existsSync(resolve(root))) return []
  return readdirSync(resolve(root), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

/**
 * `local/no-prohibited-abstraction`의 근거 문자열이 가리키는 규범 파일은 실존해야 한다.
 * 근거는 `<skill> SKILL.md`, `<reference>.md`, `ADR NNNN` 형태만 인정한다.
 */
export function prohibitedAbstractionSourceFailures(
  eslintConfig,
  exists = (path) => existsSync(resolve(path)),
  readContent = (path) => readFileSync(resolve(path), 'utf8'),
) {
  const block = /PROHIBITED_ABSTRACTION_BINDINGS\s*=\s*new Map\(\[([\s\S]*?)\]\)/.exec(eslintConfig)
  if (block === null) return ['eslint.config.js: PROHIBITED_ABSTRACTION_BINDINGS 를 찾을 수 없다']
  const failures = []
  for (const [, name, source] of block[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) {
    for (const token of source.split(',').map((part) => part.trim()).filter(Boolean)) {
      const adr = /^ADR (\d{4})$/.exec(token)
      const reference = /^([a-z0-9-]+\.md)$/.exec(token)
      if (adr) {
        if (!readdirSync(resolve('docs/decisions')).some((file) => file.startsWith(`${adr[1]}-`))) {
          failures.push(`eslint.config.js: '${name}' 근거 '${token}' 가 실존 규범 파일이 아니다`)
        }
        continue
      }
      if (!reference) {
        failures.push(`eslint.config.js: '${name}' 근거 '${token}' 가 실존 규범 파일이 아니다`)
        continue
      }
      // 파일이 있는지가 아니라 **그 파일이 이 금지를 실제로 말하는지**를 본다.
      // 존재만 보면 근거를 옮기다 내용을 빠뜨려도 통과한다 — 실제로 한 번 그렇게 빠졌다.
      // 근거는 skill 이름(`source-structure.md` → 그 skill 의 SKILL.md)이거나 그 skill 의
      // reference, 또는 판독 정책이다. 이름 하나로 세 자리를 다 본다.
      const stem = reference[1].replace(/\.md$/, '')
      const candidates = [
        `.agents/skills/${stem}/SKILL.md`,
        ...skillDirectories().map((dir) => `.agents/skills/${dir}/references/${reference[1]}`),
        `product/policies/${reference[1]}`,
      ]
      const hosting = candidates.filter((path) => exists(path))
      if (hosting.length === 0) {
        failures.push(`eslint.config.js: '${name}' 근거 '${token}' 가 실존 규범 파일이 아니다`)
      } else if (!hosting.some((path) => readContent(path).includes(name))) {
        failures.push(`eslint.config.js: '${name}' 근거 '${token}' 에 그 이름이 없다 — 근거 문서가 이 금지를 말하지 않는다`)
      }
    }
  }
  return failures
}

function countDocumentLines(document) {
  return document.split('\n').filter((line, index, all) => index < all.length - 1 || line !== '').length
}

/**
 * 권고이지 실패가 아니다. 길이를 맞추려고 내용을 눌러 담으면 판단이 표 칸 안으로 숨는다.
 * 넘긴 문서는 줄 수를 줄일 게 아니라 중복·소유자·분할을 먼저 보게 한다.
 */
export function documentBudgetNotices(files, budget = DOCUMENT_LINE_BUDGET, byteBudget = DOCUMENT_BYTE_BUDGET) {
  const notices = []
  for (const file of files) {
    const content = readFileSync(resolve(file), 'utf8')
    const lineCount = countDocumentLines(content)
    const bytes = Buffer.byteLength(content)
    if (lineCount <= budget && bytes <= byteBudget) continue
    notices.push(`${file} 가 ${lineCount}줄, ${bytes} bytes다(권고 ${budget}줄 / ${byteBudget} bytes). 줄이기 전에 보라 — 중복이 있는지, 이 파일이 소유자가 맞는지, 나눌 수 있는지.`)
  }
  return notices
}

/**
 * 이 저장소 제품의 도메인 명사와 식별자 접두. 규칙 문장에 이 낱말이 있으면 규칙이 한 화면의 인스턴스로
 * 읽힌다(2026-09-10 게시판 드릴이 형제 값을 복사한 원인, 2026-09-11 판정 오류). 이관 시 대상 제품 값으로 바꾼다.
 * `src/features` 디렉터리명은 실행 시 읽어 `<dir>/` 꼴만 잡는다(`auth` 같은 일반어를 낱말로 잡지 않기 위해).
 */
export const PRODUCT_DOMAIN_TERMS = {
  nouns: ['회원', '운영자', '공연', '게시판', '게시물', '소명', '상담', '발권', '전시', '프로모션', '커뮤니티', '리허설', '메시지'],
  /** 대문자 시작 식별자 조각. camelCase 안(`usePerformanceDetail`)도 잡도록 낱말 경계를 두지 않는다. */
  identifiers: ['Manager', 'Member', 'Performance', 'Board', 'Counsel', 'Appeal', 'Dormant', 'Withdrawn'],
  /** 영어 산문 속 도메인 낱말(대소문자 무관, 복수형 포함). `performance` 는 React 성능 문서와 겹쳐 뺀다. */
  english: ['member', 'manager', 'board', 'rehearsal', 'venue', 'appeal', 'counsel', 'dormant', 'withdrawn'],
  /** 제품 도메인이 아니라 모든 어드민이 갖는 관심사인 디렉터리. `auth/reissue` 같은 transport 경로가 여기 걸린다. */
  ignoreDirectories: ['auth'],
  /**
   * 도메인 낱말을 부분 문자열로 품었지만 제품 사실이 아닌 토큰. 정규식으로는 `useManagerDetail` 과
   * 구별되지 않아(둘 다 소문자 뒤의 `Manager`) 이름으로 적는다. 추가할 때는 왜 제품 사실이 아닌지 적는다.
   */
  allow: ['packageManager'],
}

function readFeatureDirectories(root = 'src/features', ignore = PRODUCT_DOMAIN_TERMS.ignoreDirectories) {
  if (!existsSync(resolve(root))) return []
  return readdirSync(resolve(root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ignore.includes(entry.name))
    .map((entry) => entry.name)
}

/** 한 줄에서 찍힌 제품 이름들. 코드 fence 안도 본다 — 예시도 인스턴스다. */
export function productTermsInLine(line, terms = PRODUCT_DOMAIN_TERMS, featureDirs = []) {
  const found = new Set()
  // 허용 토큰은 그 자리를 비워 두고 본다. 그래야 `packageManager` 안의 `Manager` 가 잡히지 않는다.
  for (const token of terms.allow ?? []) line = line.split(token).join(' ')
  for (const noun of terms.nouns) if (line.includes(noun)) found.add(noun)
  const identifier = new RegExp(`(?:${terms.identifiers.join('|')})\\w*`, 'g')
  for (const [match] of line.matchAll(identifier)) found.add(match)
  if (terms.english?.length) {
    const word = new RegExp(`\\b(?:${terms.english.join('|')})s?\\b`, 'gi')
    for (const [match] of line.matchAll(word)) found.add(match)
  }
  if (featureDirs.length) {
    const dir = new RegExp(`\\b(?:${featureDirs.join('|')})\\/`, 'g')
    for (const [match] of line.matchAll(dir)) found.add(match)
  }
  return [...found]
}

/**
 * 스킬 Markdown 어디에든 남은 제품 이름을 notice 로 낸다. 예시와 fence도 이관 시 복사되는 지시이므로 함께 본다.
 * 실패가 아닌 이유: 어휘가 부분 문자열·일반어(`운영자`, `전시`)와 겹쳐 오탐이 있고, 그 판단은 리뷰 몫이다.
 * 원시 개수 0은 목표가 아니다. 각 항목이 누가 처리할지 분류되고, 미분류가 0이어야 한다.
 */
export function productNameNotices(files, { terms = PRODUCT_DOMAIN_TERMS, featureDirs = readFeatureDirectories(), read = (file) => readFileSync(resolve(file), 'utf8') } = {}) {
  const notices = []
  for (const file of files) {
    const hits = []
    read(file).split('\n').forEach((line, index) => {
      const found = productTermsInLine(line, terms, featureDirs)
      if (found.length) hits.push(`${index + 1}: ${found.join('·')}`)
    })
    if (hits.length) notices.push(`이관 대상에 제품 이름 ${hits.length}줄: ${file} — ${hits.join(' / ')}. 제품 사실은 product reference·ADR 근거·consumer 코드와 테스트로 옮긴다.`)
  }
  return notices
}

/** 이관본에 남은 제품 어휘가 어느 경계에서 닫히는지 분류한다. */
export function productTermDisposition(hit, { group, action }) {
  if (action === 'exclude' || group === 'source-evidence' || group === 'ledger') return 'source-only'
  if (action === 'rewrite') return 'generic-rewrite'
  if (action === 'template' || action === 'conditional' || group === 'app' || group === 'selected-adapter') return 'target-decision'
  if (hit.allowedReason) return 'allowed-generic'
  return 'unclassified'
}

/** 원시 어휘 수가 아니라 소유자가 정해지지 않은 항목만 게이트로 막는다. */
export function unclassifiedProductTermFailures(hits) {
  return hits
    .filter((hit) => hit.disposition === 'unclassified')
    .map((hit) => `${hit.file}:${hit.line}: 제품 어휘 소유자 미분류 → ${hit.terms.join('·')}`)
}

export function claudeAgentsImportFailure(claude) {
  const firstInstruction = claude.split('\n').find((line) => line.trim() !== '')
  return firstInstruction?.trim() === '@AGENTS.md'
    ? null
    : 'CLAUDE.md 의 첫 번째 지시는 `@AGENTS.md` import 여야 한다.'
}

export function copilotAgentsPointerFailure(copilot) {
  const firstBodyInstruction = copilot
    .split('\n')
    .find((line) => line.trim() !== '' && !line.trimStart().startsWith('#'))
  return firstBodyInstruction !== undefined && /\]\(\.\.\/AGENTS\.md\)/.test(firstBodyInstruction)
    ? null
    : 'Copilot 의 첫 번째 본문 지시는 `../AGENTS.md` 를 가리켜야 한다.'
}

/**
 * 원장은 색인과 카드가 서로를 덮어야 한다. 카드를 쓰고 표에 안 올리면 그 카드는 라우팅에서 사라지고,
 * 표에만 있고 파일이 없으면 링크가 죽는다. 실제로 카드를 하나 쓰고 표에 안 올린 적이 있어서 넣었다.
 */
export function ledgerIndexFailures(
  directory = 'docs/reference/scenarios',
  indexFile = 'README.md',
  list = readdirSync,
  read = (file) => readFileSync(resolve(file), 'utf8'),
) {
  if (!existsSync(resolve(directory))) return []
  const cards = list(resolve(directory))
    .filter((name) => name.endsWith('.md') && name !== indexFile)
    .sort()
  const index = read(`${directory}/${indexFile}`)
  const linked = new Set(
    [...index.matchAll(/\]\(([^)\s]+\.md)\)/g)]
      .map((match) => match[1].split('/').pop())
      .filter((name) => name !== undefined),
  )
  const failures = []
  for (const card of cards) {
    if (!linked.has(card)) failures.push(`${directory}/${indexFile}: 카드 \`${card}\` 가 색인에 없다 (라우팅에서 도달 불가)`)
  }
  for (const name of [...linked].sort()) {
    if (!cards.includes(name) && existsSync(resolve(directory, name)) === false) {
      failures.push(`${directory}/${indexFile}: 색인이 가리키는 \`${name}\` 가 없다`)
    }
  }
  return failures
}
