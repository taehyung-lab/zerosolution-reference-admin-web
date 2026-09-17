#!/usr/bin/env node
/**
 * `description` 이 실제로 무엇을 여는지 잰다.
 *
 * description 은 문서가 아니라 **매칭 대상**이다. 잘 쓴 것처럼 보이는 것과 실제로 맞는 것은 다르고,
 * 그 차이는 읽어서 알 수 없다. 그래서 요청 문장을 진짜로 던지고 **어떤 skill 이 열렸는지**만 센다.
 *
 *   node scripts/skills/eval-triggers.mjs [--only <id 조각>] [--jobs 4]
 *
 * 각 요청은 새 세션에서 돌고 구현하지 않는다. 판정은 하나다 —
 * `expect` 는 전부 열려야 하고, `reject` 는 하나도 열리면 안 된다.
 * **비발동 실패는 오탐이 아니라 잘못된 문서를 읽고 구현한다는 뜻**이라 채택을 막는다.
 */
import { spawn } from 'node:child_process'
import { CASES } from './fixtures.mjs'

const NUDGE = ' 구현하지 말고, 무엇을 읽고 어떻게 접근할지만 짧게 답하세요.'

/** 한 요청이 연 skill 이름들. 세션이 죽으면 `null`(측정 실패 — 통과로 읽지 않는다). */
export function invokedSkills(streamJson) {
  const names = []
  for (const line of streamJson.split('\n')) {
    if (!line.startsWith('{')) continue
    let event
    try { event = JSON.parse(line) } catch { continue }
    for (const part of event.message?.content ?? []) {
      if (part?.type === 'tool_use' && part.name === 'Skill' && part.input?.skill) names.push(part.input.skill)
    }
  }
  return [...new Set(names)]
}

/** @returns `{ id, opened, missing, forbidden, ok }` */
export function judge(testCase, opened) {
  const missing = (testCase.expect ?? []).filter((name) => !opened.includes(name))
  const forbidden = (testCase.reject ?? []).filter((name) => opened.includes(name))
  return { id: testCase.id, opened, missing, forbidden, ok: missing.length === 0 && forbidden.length === 0 }
}

function run(testCase) {
  return new Promise((resolve) => {
    const child = spawn('claude', ['-p', testCase.request + NUDGE, '--output-format', 'stream-json', '--verbose'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    let out = ''
    child.stdout.on('data', (chunk) => { out += chunk })
    child.on('close', () => resolve(judge(testCase, invokedSkills(out))))
    child.on('error', () => resolve({ ...judge(testCase, []), error: true }))
  })
}

if (process.argv[1]?.endsWith('eval-triggers.mjs')) {
  const args = process.argv.slice(2)
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
  const jobs = args.includes('--jobs') ? Number(args[args.indexOf('--jobs') + 1]) : 4
  const queue = CASES.filter((item) => !only || item.id.includes(only))
  const results = []
  let next = 0
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    while (next < queue.length) {
      const item = queue[next++]
      const result = await run(item)
      results.push(result)
      console.log(`  ${result.ok ? '✓' : '✗'} ${result.id}  [${result.opened.join(' ') || '없음'}]`)
    }
  }))
  const failed = results.filter((item) => !item.ok)
  const rejectFailed = failed.filter((item) => item.forbidden.length > 0)
  console.log(`\n  ${results.length - failed.length}/${results.length} 통과`)
  for (const item of failed.sort((a, b) => a.id.localeCompare(b.id))) {
    const parts = []
    if (item.missing.length) parts.push(`안 열림: ${item.missing.join(' ')}`)
    if (item.forbidden.length) parts.push(`열리면 안 되는데 열림: ${item.forbidden.join(' ')}`)
    console.log(`  ✗ ${item.id} — ${parts.join(' / ')}`)
  }
  if (rejectFailed.length > 0) {
    console.log(`\n  🛑 비발동 ${rejectFailed.length}건 실패. 이것은 오탐이 아니라 **잘못된 문서를 읽는다**는 뜻이다.`)
  }
  process.exit(failed.length === 0 ? 0 : 1)
}
