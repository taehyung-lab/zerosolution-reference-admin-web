#!/usr/bin/env node
/**
 * product/facts/*.md 의 frontmatter 에서 product/generated-index.md 를 만든다.
 *
 * 색인은 생성물이다. 손으로 고치면 다음 생성에서 사라진다. 이름·역할·상태의 단일 소유자는
 * 각 fact 파일이고, 이 스크립트는 그것을 모아 보여 줄 뿐 새 사실을 만들지 않는다.
 *
 * `--check` 는 생성 결과가 디스크와 같은지만 보고 쓰지 않는다(CI 용).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.cwd())
const factsDir = join(root, 'product/facts')
const indexPath = join(root, 'product/generated-index.md')
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

const rendered = `<!-- 생성물이다. scripts/product/build-index.mjs 가 만든다. 손으로 고치지 않는다. -->
# 제품 사실 색인

요청이 제품 값에 의존하면 여기서 대상 ID 를 찾고 **그 fact 만** 연다. 관례로 여러 개를 열지 않는다.
여기 없으면 \`미확인\`이지 부재가 아니다 — 무엇을 누구에게 물어야 하는지 적고 그 부분만 보류한다.

이 표의 이름·역할·상태는 각 fact 파일의 frontmatter 가 소유한다. 이 파일을 고치지 말고 fact 를 고친 뒤
\`pnpm product:index\` 를 다시 돌린다.

| ID | 제목 | 역할 | 상태 | fact |
| --- | --- | --- | --- | --- |
${rows}

총 ${facts.length}개.
`

if (checkOnly) {
  const current = readFileSync(indexPath, 'utf8')
  if (current !== rendered) {
    console.error('  ✗ product/generated-index.md 가 fact 와 어긋난다. `pnpm product:index` 를 돌린다')
    process.exit(1)
  }
  console.log(`  ✓ 제품 사실 색인 ${facts.length}개가 fact 와 일치`)
} else {
  writeFileSync(indexPath, rendered)
  console.log(`  ✓ product/generated-index.md 생성 — fact ${facts.length}개`)
}
