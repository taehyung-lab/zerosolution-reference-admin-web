#!/usr/bin/env node
/**
 * 원격 스펙을 내려받아 스냅샷을 갱신하고 변화 요약을 남긴다.
 * `pnpm verify`에 포함되지 않는다. 신규 clone과 CI가 서버 가용성에 묶이면 안 된다.
 */
import { writeFileSync } from 'node:fs'
import { readSnapshot, SNAPSHOT, SNAPSHOT_META, summarizeSpec } from './_shared.mjs'

// 기본값을 두지 않는다. 신규 URL 확정 후 실수로 리허설 스펙을 다시 덮어쓰는 사고를 막는다.
const url = process.env.ADMIN_OPENAPI_URL
if (!url) {
  console.error(`
  ✗ ADMIN_OPENAPI_URL 이 설정되지 않았다.

  이 스냅샷은 신규 제품 계약이 아니라 격리된 리허설 계약이다
  (docs/decisions/0001-rehearsal-api-contract.md).
  덮어쓸 대상을 반드시 명시하라.

    ADMIN_OPENAPI_URL=<url> pnpm api:pull
`)
  process.exit(1)
}
console.log(`  GET ${url}`)

const res = await fetch(url)
if (!res.ok) { console.error(`  ✗ HTTP ${res.status}`); process.exit(1) }
const next = await res.json()

let prev = null
try { prev = readSnapshot() } catch { /* 최초 pull */ }

console.log('  이전:', JSON.stringify(prev === null ? null : summarizeSpec(prev)))
console.log('  이후:', JSON.stringify(summarizeSpec(next)))

if (prev) {
  const keys = (s) => new Set(Object.keys(s.paths ?? {}))
  const a = keys(prev), b = keys(next)
  const added = [...b].filter((k) => !a.has(k))
  const gone = [...a].filter((k) => !b.has(k))
  console.log(`  추가된 path ${added.length}, 사라진 path ${gone.length}`)
  if (added.length) console.log('    +', added.slice(0, 5).join(', '))
  if (gone.length) console.log('    -', gone.slice(0, 5).join(', '))
}

writeFileSync(SNAPSHOT, JSON.stringify(next, null, 2), 'utf8')
writeFileSync(
  SNAPSHOT_META,
  `${JSON.stringify(
    {
      source: url,
      pulledAt: new Date().toISOString(),
      infoVersion: next.info?.version ?? null,
      counts: summarizeSpec(next),
    },
    null,
    2,
  )}\n`,
  'utf8',
)
console.log(`\n  ✓ snapshot과 meta 갱신. api:validate로 결함 규모를 다시 확인하라.`)
