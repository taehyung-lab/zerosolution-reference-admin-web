import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export const DOCUMENT_LINE_BUDGET = 200
export const AGENTS_LINE_BUDGET = DOCUMENT_LINE_BUDGET

/** 문서가 `pnpm <cmd>` 로 부를 수 있는 내장 명령. script 가 아니어도 실재한다. */
const PNPM_BUILTINS = new Set([
  'install', 'add', 'remove', 'update', 'run', 'exec', 'dlx', 'why', 'list', 'outdated', 'audit',
  'publish', 'pack', 'link', 'unlink', 'store', 'import', 'prune', 'rebuild', 'setup', 'env',
])

/** 정합성 대조 대상 문서. 임시 작업물(.ai-work)은 저장소 산출물이 아니므로 제외한다. */
const DOCUMENT_ROOTS = ['docs', '.agents']
const DOCUMENT_FILES = [
  'AGENTS.md',
  'README.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  'openapi/README.md',
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

/** 로컬 Markdown link 의 대상 파일이 실재하는지 확인한다. 외부 URL 과 앵커는 대상이 아니다. */
export function readLocalLinkFailures(files) {
  const failures = []
  for (const file of files) {
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const [, target] of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue
        const path = target.split('#')[0]
        if (path === '') continue
        const absolute = path.startsWith('/')
          ? resolve(`.${path}`)
          : resolve(dirname(resolve(file)), path)
        if (existsSync(absolute)) continue
        failures.push(`${file}:${index + 1}: link 대상 없음 → ${target}`)
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
export const RETIRED_DOCUMENT_NAMES = [
  'list-detail.md',
  'screen-anatomy.md',
  'form-actions.md',
  'field-and-select',
  'dialog-and-status',
]

export function retiredDocumentNameFailures(files, names = RETIRED_DOCUMENT_NAMES) {
  const failures = []
  for (const file of files) {
    if (!existsSync(resolve(file))) continue
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const name of names) {
        if (line.includes(name)) failures.push(`${file}:${index + 1}: 삭제된 문서 이름 → ${name}`)
      }
    })
  }
  return failures
}

/** `AGENTS.md §N` 참조는 실제 heading 번호(`## N.`)와 일치해야 한다. */
export function agentsSectionNumbers(agents) {
  return new Set(
    [...agents.matchAll(/^##\s+(\d+)\./gm)].map((match) => Number(match[1])),
  )
}

export function agentsSectionReferenceFailures(files, agents) {
  const numbers = agentsSectionNumbers(agents)
  const failures = []
  for (const file of files) {
    if (!existsSync(resolve(file))) continue
    const lines = readFileSync(resolve(file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const [, section] of line.matchAll(/AGENTS\.md[^§\n]{0,12}§\s?(\d+)/g)) {
        if (!numbers.has(Number(section))) {
          failures.push(`${file}:${index + 1}: AGENTS.md §${section} 절이 없다`)
        }
      }
    })
  }
  return failures
}

/**
 * `local/no-prohibited-abstraction`의 근거 문자열이 가리키는 규범 파일은 실존해야 한다.
 * 근거는 `<skill> SKILL.md`, `<reference>.md`, `ADR NNNN` 형태만 인정한다.
 */
export function prohibitedAbstractionSourceFailures(eslintConfig, exists = (path) => existsSync(resolve(path))) {
  const block = /PROHIBITED_ABSTRACTION_BINDINGS\s*=\s*new Map\(\[([\s\S]*?)\]\)/.exec(eslintConfig)
  if (block === null) return ['eslint.config.js: PROHIBITED_ABSTRACTION_BINDINGS 를 찾을 수 없다']
  const failures = []
  for (const [, name, source] of block[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) {
    for (const token of source.split(',').map((part) => part.trim()).filter(Boolean)) {
      const skill = /^([a-z-]+) SKILL\.md$/.exec(token)
      const adr = /^ADR (\d{4})$/.exec(token)
      const reference = /^([a-z0-9-]+\.md)$/.exec(token)
      const found = skill
        ? exists(`.agents/skills/${skill[1]}/SKILL.md`)
        : adr
          ? readdirSync(resolve('docs/decisions')).some((file) => file.startsWith(`${adr[1]}-`))
          : reference
            ? ['api-contract', 'feature-contract', 'shared-ui-contract']
              .some((skillName) => exists(`.agents/skills/${skillName}/references/${reference[1]}`))
            : false
      if (!found) failures.push(`eslint.config.js: '${name}' 근거 '${token}' 가 실존 규범 파일이 아니다`)
    }
  }
  return failures
}

export function agentsBudgetFailure(agents) {
  const lineCount = countDocumentLines(agents)
  return lineCount > AGENTS_LINE_BUDGET
    ? `AGENTS.md 가 ${lineCount}줄이다. 예산은 ${AGENTS_LINE_BUDGET}줄이다.`
    : null
}

function countDocumentLines(document) {
  return document.split('\n').filter((line, index, all) => index < all.length - 1 || line !== '').length
}

export function documentBudgetFailures(files, budget = DOCUMENT_LINE_BUDGET) {
  const failures = []
  for (const file of files) {
    const lineCount = countDocumentLines(readFileSync(resolve(file), 'utf8'))
    if (lineCount <= budget) continue
    failures.push(`${file} 가 ${lineCount}줄이다. 문서 예산은 ${budget}줄이다.`)
  }
  return failures
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
