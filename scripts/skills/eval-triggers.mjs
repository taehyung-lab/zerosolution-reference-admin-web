#!/usr/bin/env node
/**
 * skill description 라우팅을 런타임별로 **관측**한다.
 *
 *   pnpm eval:routing -- --runtime claude --suite smoke
 *   pnpm eval:routing -- --runtime all --suite full
 *
 * 모델이 읽어야 한다고 판단한 계약과 런타임 로그에서 실제로 로드된 skill은 다른 사실이다.
 * 두 필드를 분리하고, 로드 telemetry를 볼 수 없으면 빈 목록이 아니라 `null`로 남긴다.
 * 이 스크립트는 채택·거절을 판정하지 않고 기대와의 차이만 출력한다.
 */
import { spawn } from 'node:child_process'
import { CASES } from './fixtures.mjs'

const RUNTIMES = ['claude', 'codex', 'copilot']
const NUDGE = [
  '구현하지 말고 이 요청을 처리할 때 읽어야 하는 프로젝트 skill 계약의 name만 고르세요.',
  '마지막에 반드시 다음 형태를 한 줄로 쓰세요:',
  'ROUTING_RESULT {"requiredContracts":["skill-name"]}',
].join(' ')

export function claudeLoadedSkills(streamJson) {
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

export function claudeLoadObservation(streamJson) {
  const events = streamJson.split('\n').flatMap((line) => {
    if (!line.startsWith('{')) return []
    try { return [JSON.parse(line)] } catch { return [] }
  })
  const hasStart = events.some((event) => event.type === 'system' && event.subtype === 'init')
  const hasEnd = events.some((event) => event.type === 'result')
  if (!hasStart || !hasEnd) return { actuallyLoadedSkills: null, loadObservation: 'unavailable' }
  return { actuallyLoadedSkills: claudeLoadedSkills(streamJson), loadObservation: 'observed' }
}

function stringsIn(value, found = []) {
  if (typeof value === 'string') found.push(value)
  else if (Array.isArray(value)) value.forEach((item) => stringsIn(item, found))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => stringsIn(item, found))
  return found
}

export function requiredContractsFrom(output) {
  const candidates = [output]
  for (const line of output.split('\n')) {
    if (!line.startsWith('{')) continue
    try { candidates.push(...stringsIn(JSON.parse(line))) } catch { /* 로그 잡음은 무시한다. */ }
  }
  for (const text of candidates.reverse()) {
    const match = /ROUTING_RESULT\s+(\{[^\n]*"requiredContracts"[^\n]*\})/.exec(text)
    if (!match) continue
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed.requiredContracts) && parsed.requiredContracts.every((item) => typeof item === 'string')) {
        return [...new Set(parsed.requiredContracts)]
      }
    } catch { /* 다른 candidate를 계속 본다. */ }
  }
  return null
}

export function observeCase(testCase, observation) {
  const requiredContracts = observation.requiredContracts
  const expected = testCase.expect ?? []
  const rejected = testCase.reject ?? []
  return {
    id: testCase.id,
    expected,
    rejected,
    requiredContracts,
    actuallyLoadedSkills: observation.actuallyLoadedSkills,
    loadObservation: observation.loadObservation,
    missingRequired: requiredContracts === null ? expected : expected.filter((name) => !requiredContracts.includes(name)),
    forbiddenRequired: requiredContracts === null ? [] : rejected.filter((name) => requiredContracts.includes(name)),
  }
}

export function selectCases(cases, suite) {
  if (suite === 'smoke') return cases.filter((item) => item.id.endsWith('/재표현'))
  if (suite === 'full') return [...cases]
  throw new Error(`--suite 는 smoke | full 이어야 한다: ${suite}`)
}

export function validateRunSelection(cases, jobs) {
  if (cases.length === 0) throw new Error('평가할 case가 없다 — --only와 --suite를 확인한다')
  if (!Number.isInteger(jobs) || jobs <= 0) throw new Error(`--jobs 는 양의 정수여야 한다: ${jobs}`)
}

function commandFor(runtime, prompt) {
  if (runtime === 'claude') {
    return { command: 'claude', args: ['-p', prompt, '--setting-sources', 'project', '--strict-mcp-config', '--output-format', 'stream-json', '--verbose'], isolation: 'project-settings' }
  }
  if (runtime === 'codex') {
    return { command: 'codex', args: ['exec', '--ignore-user-config', '--ephemeral', '--sandbox', 'read-only', '--json', prompt], isolation: 'ignore-user-config' }
  }
  return { command: 'copilot', args: ['-p', prompt, '--output-format', 'json'], isolation: 'unconfirmed' }
}

function run(testCase, runtime) {
  return new Promise((resolve) => {
    const spec = commandFor(runtime, `${testCase.request} ${NUDGE}`)
    const child = spawn(spec.command, spec.args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let errorOut = ''
    child.stdout.on('data', (chunk) => { out += chunk })
    child.stderr.on('data', (chunk) => { errorOut += chunk })
    child.on('close', (code) => {
      const requiredContracts = code === 0 ? requiredContractsFrom(out) : null
      const load = runtime === 'claude' && code === 0
        ? claudeLoadObservation(out)
        : { actuallyLoadedSkills: null, loadObservation: 'unavailable' }
      resolve({
        runtime,
        model: null,
        isolation: spec.isolation,
        execution: code === 0 && requiredContracts !== null ? 'observed' : 'unconfirmed',
        error: code === 0 ? null : errorOut.trim() || `exit ${code}`,
        ...observeCase(testCase, {
          requiredContracts,
          ...load,
        }),
      })
    })
    child.on('error', (error) => resolve({
      runtime,
      model: null,
      isolation: spec.isolation,
      execution: 'unconfirmed',
      error: error.message,
      ...observeCase(testCase, { requiredContracts: null, actuallyLoadedSkills: null, loadObservation: 'unavailable' }),
    }))
  })
}

if (process.argv[1]?.endsWith('eval-triggers.mjs')) {
  const args = process.argv.slice(2)
  const readArg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
  const runtimeArg = readArg('--runtime', 'all')
  const suite = readArg('--suite', 'smoke')
  const only = readArg('--only', null)
  const jobs = Number(readArg('--jobs', '2'))
  const runtimes = runtimeArg === 'all' ? RUNTIMES : [runtimeArg]
  if (runtimes.some((runtime) => !RUNTIMES.includes(runtime))) throw new Error(`--runtime 은 all | ${RUNTIMES.join(' | ')} 이어야 한다`)
  const cases = selectCases(CASES, suite).filter((item) => !only || item.id.includes(only))
  validateRunSelection(cases, jobs)
  const queue = runtimes.flatMap((runtime) => cases.map((testCase) => ({ runtime, testCase })))
  const results = []
  let next = 0
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    while (next < queue.length) {
      const { runtime, testCase } = queue[next++]
      const result = await run(testCase, runtime)
      results.push(result)
      console.log(JSON.stringify(result))
    }
  }))
  const unconfirmed = results.filter((item) => item.execution === 'unconfirmed').length
  console.log(JSON.stringify({ summary: { suite, runtimes, observed: results.length - unconfirmed, unconfirmed, total: results.length } }))
  process.exit(unconfirmed > 0 ? 2 : 0)
}
