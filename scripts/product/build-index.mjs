#!/usr/bin/env node
/**
 * product/facts/*.md 의 frontmatter 에서 product/generated-index.md 를 만든다.
 *
 * 색인은 생성물이다. 손으로 고치면 다음 생성에서 사라진다. 이름·역할·상태의 단일 소유자는
 * 각 fact 파일이고, 이 스크립트는 그것을 모아 보여 줄 뿐 새 사실을 만들지 않는다.
 *
 * `--check` 는 생성 결과가 디스크와 같은지만 보고 쓰지 않는다(CI 용).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd())
const factsDir = join(root, 'product/facts')
const indexPath = join(root, 'product/generated-index.md')
/**
 * 아직 fact 로 옮기지 않은 화면의 원장. 색인은 이것도 함께 보여 준다 — 옮기지 않았다는 사실과
 * 어디를 읽어야 하는지를 말하지 않으면, 에이전트가 "색인에 없음 = 미확인"으로 읽고 존재하는
 * 관찰을 보류한다. 그 거짓말이 이관이 끝날 때까지의 가장 큰 위험이다.
 * 마지막 화면을 옮기면 이 경로와 아래 분기를 함께 지운다.
 */
const legacyIndexPath = join(root, 'docs/reference/zero-sol/context.json')
const checkOnly = process.argv.includes('--check')

const REQUIRED = ['id', 'title', 'role', 'status']
const ROLES = new Set(['list', 'detail', 'form', 'collection', 'shared-ui', 'api', 'policy'])
const STATUSES = new Set(['관찰됨', '확정됨', '미확인'])

function parseFrontmatter(text, file) {
  if (!text.startsWith('---\n')) throw new Error(`${file}: frontmatter 가 없다`)
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) throw new Error(`${file}: frontmatter 가 닫히지 않았다`)
  const body = text.slice(4, end)
  const out = {}
  let currentKey = null
  for (const raw of body.split('\n')) {
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue
    const top = /^([a-zA-Z_]+):\s*(.*)$/.exec(raw)
    if (top) {
      currentKey = top[1]
      const value = top[2].trim()
      out[currentKey] = value === '' ? [] : value
      continue
    }
    if (/^\s+-\s/.test(raw) && currentKey) {
      if (!Array.isArray(out[currentKey])) out[currentKey] = []
      out[currentKey].push(raw.replace(/^\s+-\s/, '').trim())
      continue
    }
    if (/^\s{4}/.test(raw)) continue // 중첩 필드는 색인이 쓰지 않는다
  }
  return out
}

function stripBrackets(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  const inner = value.replace(/^\[|\]$/g, '').trim()
  return inner === '' ? [] : inner.split(',').map((item) => item.trim()).filter(Boolean)
}

const files = readdirSync(factsDir).filter((name) => name.endsWith('.md')).sort()
const facts = []
const errors = []

for (const file of files) {
  const text = readFileSync(join(factsDir, file), 'utf8')
  let meta
  try {
    meta = parseFrontmatter(text, file)
  } catch (error) {
    errors.push(error.message)
    continue
  }
  for (const key of REQUIRED) {
    if (!meta[key] || (Array.isArray(meta[key]) && meta[key].length === 0)) {
      errors.push(`${file}: frontmatter 에 ${key} 가 없다`)
    }
  }
  if (meta.id && file !== `${meta.id}.md`) {
    errors.push(`${file}: 파일 이름이 id(${meta.id}) 와 다르다. id 는 불변이며 파일 이름이 그것을 따른다`)
  }
  if (meta.role && !ROLES.has(meta.role)) errors.push(`${file}: 모르는 role "${meta.role}"`)
  if (meta.status && !STATUSES.has(meta.status)) errors.push(`${file}: 모르는 status "${meta.status}"`)
  facts.push({ ...meta, file, related: stripBrackets(meta.related) })
}

const ids = new Set(facts.map((fact) => fact.id))
for (const fact of facts) {
  for (const related of fact.related) {
    if (!ids.has(related)) errors.push(`${fact.file}: related 의 ${related} 를 가진 fact 가 없다`)
  }
}

if (errors.length > 0) {
  for (const message of errors) console.error(`  ✗ ${message}`)
  process.exit(1)
}

const rows = facts
  .map((fact) => `| \`${fact.id}\` | ${fact.title} | ${fact.role} | ${fact.status} | [${fact.file}](facts/${fact.file}) |`)
  .join('\n')

/** 아직 fact 가 없는 화면. 옛 원장 경로를 그대로 가리킨다. */
const legacy = existsSync(legacyIndexPath)
  ? JSON.parse(readFileSync(legacyIndexPath, 'utf8')).surfaces
      .filter((surface) => !facts.some((fact) => fact.legacyId === surface.id))
      .map((surface) => ({ id: surface.id, title: surface.title, inventory: surface.inventory }))
  : []

const legacyRows = legacy
  .map((surface) => `| \`${surface.id}\` | ${surface.title} | — | **미이관** | [${surface.inventory}](../${surface.inventory}) |`)
  .join('\n')

const legacySection = legacy.length === 0 ? '' : `
## 아직 fact 로 옮기지 않은 화면

여기 있는 surface 는 **관찰이 존재한다.** 형식만 옛 원장이다. 대상이 이 표에 있으면 \`미확인\` 이라고
쓰지 말고 그 원장을 읽는다 — 다만 원장은 한 파일이 여러 화면을 담으므로 **그 화면의 행만** 읽고,
다른 화면의 값을 근거로 쓰지 않는다. 그 화면을 실제로 구현하거나 고치는 작업에서 fact 로 옮긴다.

| 옛 ID | 제목 | 역할 | 상태 | 원장 |
| --- | --- | --- | --- | --- |
${legacyRows}

총 ${legacy.length}개.
`

const rendered = `<!-- 생성물이다. scripts/product/build-index.mjs 가 만든다. 손으로 고치지 않는다. -->
# 제품 사실 색인

요청이 제품 값에 의존하면 여기서 대상을 찾고 **그 하나만** 연다. 관례로 여러 개를 열지 않는다.
아래 **두 표를 모두** 본 뒤에도 없으면 그때가 \`미확인\`이다 — 무엇을 누구에게 물어야 하는지 적고
그 부분만 보류한다. 첫 표에 없다는 것만으로 부재라고 쓰지 않는다.

이 표의 이름·역할·상태는 각 fact 파일의 frontmatter 가 소유한다. 이 파일을 고치지 말고 fact 를 고친 뒤
\`pnpm product:index\` 를 다시 돌린다.

| ID | 제목 | 역할 | 상태 | fact |
| --- | --- | --- | --- | --- |
${rows}

총 ${facts.length}개.
${legacySection}`

if (checkOnly) {
  const current = readFileSync(indexPath, 'utf8')
  if (current !== rendered) {
    console.error('  ✗ product/generated-index.md 가 fact 와 어긋난다. `pnpm product:index` 를 돌린다')
    process.exit(1)
  }
  console.log(`  ✓ 제품 사실 색인 ${facts.length}개가 fact 와 일치 (미이관 ${legacy.length}개 포함)`)
} else {
  writeFileSync(indexPath, rendered)
  console.log(`  ✓ product/generated-index.md 생성 — fact ${facts.length}개, 미이관 ${legacy.length}개`)
}
