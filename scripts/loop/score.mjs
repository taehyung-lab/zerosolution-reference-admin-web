#!/usr/bin/env node
/**
 * 한 바퀴의 점수를 **숫자 한 줄**로 낸다.
 *
 * 이 저장소는 문서를 여러 번 바꿨고, 매번 "나아졌는지"를 사람이 산문으로 판정했다. 산문은 기계가
 * 못 읽는다. 못 읽으면 **자동으로 합칠 수도 되돌릴 수도 없고**, 그러면 루프가 아니라 수동 작업이다.
 *
 * 점수는 **계약과 독립인 신호**만 쓴다. 계약을 계약에서 뽑은 체크리스트로 채점하면 순환이라,
 * 문서를 고칠수록 점수가 오르는 자기충족이 된다. 그래서 여기 들어오는 것은 넷뿐이다:
 *
 *   verify   기계가 소유한다. 계약 문장이 못 건드린다
 *   routing  기준이 요청 문장이지 계약 본문이 아니다
 *   shape    기존 구현이 기준선이다
 *   product  fact 가 정본이다. 계약이 아니라
 *
 * 그리고 **비용**(도달까지 쓴 tool call)을 함께 적는다 — 같은 점수면 싸게 도달한 쪽이 낫다.
 *
 *   node scripts/loop/score.mjs --rev <문서 판> --task <시험 이름> [--append]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * 판마다 한 줄. **git 이 추적한다** — 이 기록이 루프의 기억이고, 세션과 기계를 넘어야
 * "지난 판보다 나아졌나"를 물을 수 있다. 무시되는 자리에 두면 매번 기준선이 사라진다.
 */
export const SCORE_LOG = 'scripts/loop/scores.jsonl'

/** `Test Files  151 passed (151)` · `Tests  939 passed (939)` · `120 passed (1.1m)` */
export function parseVerify(output) {
  const files = /Test Files\s+(\d+) passed/.exec(output)
  const unit = /Tests\s+(\d+) passed/.exec(output)
  const e2e = /^\s*(\d+) passed \(/m.exec(output)
  const failed = /(\d+) failed/.test(output)
  return {
    pass: !failed && unit !== null,
    files: files ? Number(files[1]) : null,
    unit: unit ? Number(unit[1]) : null,
    e2e: e2e ? Number(e2e[1]) : null,
  }
}

/** `  45/45 통과` 와 `  ✗ id — …` 줄. 비발동 실패는 따로 센다 — 그것만이 채택을 막는다. */
export function parseRouting(output) {
  const total = /(\d+)\/(\d+) 통과/.exec(output)
  const lines = output.split('\n')
  const failed = lines.filter((line) => /^\s*✗ /.test(line))
  return {
    pass: total ? Number(total[1]) : null,
    total: total ? Number(total[2]) : null,
    rejectFailures: failed.filter((line) => line.includes('열리면 안 되는데 열림')).length,
  }
}

/**
 * 드릴이 만든 파일 집합이 기준선과 같은가. **이름·자리까지** 같아야 한다 —
 * 계약의 `형태` 절이 실제로 형태를 재현시키는지가 여기서만 보인다.
 */
export function shapeScore(expected, produced) {
  const want = new Set(expected)
  const got = new Set(produced)
  const matched = [...want].filter((file) => got.has(file))
  return {
    expected: want.size,
    matched: matched.length,
    missing: [...want].filter((file) => !got.has(file)).sort(),
    extra: [...got].filter((file) => !want.has(file)).sort(),
  }
}

/**
 * 워커가 답에 도달하기까지 쓴 비용. stream-json 에서 tool_use 를 센다.
 * 문서가 좋아지면 **탐색이 줄어든다** — 그 줄어듦이 여기 보인다.
 */
export function costFrom(streamJson) {
  const calls = []
  for (const line of streamJson.split('\n')) {
    if (!line.startsWith('{')) continue
    let event
    try { event = JSON.parse(line) } catch { continue }
    for (const part of event.message?.content ?? []) {
      if (part?.type === 'tool_use') calls.push(part.name)
    }
  }
  return {
    toolCalls: calls.length,
    skillOpens: calls.filter((name) => name === 'Skill').length,
    searches: calls.filter((name) => name === 'Grep' || name === 'Glob').length,
  }
}

/**
 * 이전 판보다 나아졌는가. **하나라도 나빠지면 나아진 것이 아니다** —
 * 한 군데 좋아지고 세 군데 나빠진 변경을 채택하지 않기 위해서다.
 *
 * @returns `{ better, worse, same }` — `worse` 가 비어 있고 `better` 가 있어야 채택이다
 */
export function compare(previous, current) {
  const axes = [
    ['verify.pass', (s) => (s.verify?.pass ? 1 : 0)],
    ['routing.pass', (s) => s.routing?.pass ?? null],
    ['routing.rejectFailures', (s) => (s.routing?.rejectFailures === undefined ? null : -s.routing.rejectFailures)],
    ['shape.matched', (s) => s.shape?.matched ?? null],
    ['product.pass', (s) => s.product?.pass ?? null],
    ['cost.toolCalls', (s) => (s.cost?.toolCalls === undefined ? null : -s.cost.toolCalls)],
  ]
  const better = []
  const worse = []
  for (const [name, read] of axes) {
    const before = read(previous)
    const after = read(current)
    if (before === null || after === null || before === undefined || after === undefined) continue
    if (after > before) better.push(name)
    else if (after < before) worse.push(name)
  }
  return { better, worse, same: better.length === 0 && worse.length === 0 }
}

/** 판정은 하나다: **나빠진 축이 하나라도 있으면 버린다.** */
export function verdict(comparison) {
  if (comparison.worse.length > 0) return 'reject'
  if (comparison.better.length > 0) return 'adopt'
  return 'no-change'
}

export function appendScore(score, path = SCORE_LOG) {
  mkdirSync(dirname(resolve(path)), { recursive: true })
  appendFileSync(resolve(path), `${JSON.stringify(score)}\n`)
}

export function readScores(path = SCORE_LOG) {
  if (!existsSync(resolve(path))) return []
  return readFileSync(resolve(path), 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
}
