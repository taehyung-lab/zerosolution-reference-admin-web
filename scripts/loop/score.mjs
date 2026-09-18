#!/usr/bin/env node
/**
 * 한 바퀴의 관측값을 같은 축으로 비교한다.
 *
 * 수치는 변화와 대가를 보이게 할 뿐 채택·거절을 결정하지 않는다. 판정은 실제 diff와 관찰을 함께
 * 읽는 사람이 소유한다.
 *
 * 점수는 **계약과 독립인 신호**만 쓴다. 계약을 계약에서 뽑은 체크리스트로 채점하면 순환이라,
 * 문서를 고칠수록 점수가 오르는 자기충족이 된다. 그래서 여기 들어오는 것은 넷뿐이다:
 *
 *   verify   기계가 소유한다. 계약 문장이 못 건드린다
 *   routing  기준이 요청 문장이지 계약 본문이 아니다
 *   shape    기존 구현이 기준선이다
 *   product  fact 가 정본이다. 계약이 아니라
 *
 * 그리고 **비용**(도달까지 쓴 tool call)을 함께 적는다.
 */
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

/** eval:routing의 JSON lines에서 실행 상태와 기대 차이를 집계한다. summary가 없으면 미확인이다. */
export function parseRouting(output) {
  const events = output.split('\n').flatMap((line) => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
  const summary = events.find((event) => event.summary)?.summary
  if (!summary) {
    return { observed: null, unconfirmed: null, total: null, missingRequired: null, forbiddenRequired: null }
  }
  const observedCases = events.filter((event) => event.id && event.execution === 'observed')
  return {
    observed: summary.observed,
    unconfirmed: summary.unconfirmed,
    total: summary.total,
    missingRequired: observedCases.reduce((total, event) => total + (event.missingRequired?.length ?? 0), 0),
    forbiddenRequired: observedCases.reduce((total, event) => total + (event.forbiddenRequired?.length ?? 0), 0),
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
 * 이전 판과 비교해 좋아진 축과 나빠진 축을 모두 보인다. 축을 종합한 판정은 내리지 않는다.
 * @returns `{ better, worse, same }`
 */
export function compare(previous, current) {
  const axes = [
    ['verify.pass', (s) => (s.verify?.pass === undefined ? null : Number(s.verify.pass))],
    ['routing.observed', (s) => s.routing?.observed ?? null],
    ['routing.unconfirmed', (s) => (s.routing?.unconfirmed === undefined ? null : -s.routing.unconfirmed)],
    ['routing.missingRequired', (s) => (s.routing?.missingRequired === undefined ? null : -s.routing.missingRequired)],
    ['routing.forbiddenRequired', (s) => (s.routing?.forbiddenRequired === undefined ? null : -s.routing.forbiddenRequired)],
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
