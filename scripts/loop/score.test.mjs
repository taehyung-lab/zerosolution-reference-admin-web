import { describe, expect, it } from 'vitest'
import { compare, costFrom, parseRouting, parseVerify, shapeScore, verdict } from './score.mjs'

describe('verify 출력 판독', () => {
  it('통과한 출력에서 숫자를 뽑는다', () => {
    const out = ' Test Files  151 passed (151)\n      Tests  939 passed (939)\n  120 passed (1.1m)\n'
    expect(parseVerify(out)).toEqual({ pass: true, files: 151, unit: 939, e2e: 120 })
  })

  it('대조군 — 하나라도 실패하면 통과가 아니다', () => {
    const out = ' Test Files  1 failed | 150 passed (151)\n      Tests  2 failed | 937 passed (939)\n'
    expect(parseVerify(out).pass).toBe(false)
  })

  it('대조군 — 아무것도 못 읽으면 통과로 읽지 않는다', () => {
    expect(parseVerify('설치 중 죽음').pass).toBe(false)
  })
})

describe('라우팅 평가 판독', () => {
  it('비발동 실패를 따로 센다 — 그것만이 채택을 막는다', () => {
    const out = [
      '  ✗ list/비발동 — 열리면 안 되는데 열림: list-contract',
      '  ✗ form/재표현 — 안 열림: form-contract',
      '',
      '  43/45 통과',
    ].join('\n')
    expect(parseRouting(out)).toEqual({ pass: 43, total: 45, rejectFailures: 1 })
  })
})

describe('형태 재현율', () => {
  it('이름과 자리가 같아야 맞은 것이다', () => {
    expect(shapeScore(['a/x.ts', 'a/y.ts'], ['a/x.ts', 'b/y.ts'])).toEqual({
      expected: 2, matched: 1, missing: ['a/y.ts'], extra: ['b/y.ts'],
    })
  })

  it('대조군 — 하나도 안 맞으면 0이다', () => {
    expect(shapeScore(['a.ts'], []).matched).toBe(0)
  })
})

describe('도달 비용', () => {
  const event = (name) => JSON.stringify({ message: { content: [{ type: 'tool_use', name }] } })

  it('tool call 을 세고 탐색과 skill 열기를 구분한다', () => {
    const stream = [event('Skill'), event('Grep'), event('Bash'), event('Glob'), 'noise'].join('\n')
    expect(costFrom(stream)).toEqual({ toolCalls: 4, skillOpens: 1, searches: 2 })
  })
})

describe('판정 — 하나라도 나빠지면 버린다', () => {
  const base = { verify: { pass: true }, routing: { pass: 45, rejectFailures: 0 }, shape: { matched: 13 }, cost: { toolCalls: 90 } }

  it('전부 같거나 오르면 채택이다', () => {
    const next = { ...base, cost: { toolCalls: 70 } }
    const c = compare(base, next)
    expect(c.worse).toEqual([])
    expect(verdict(c)).toBe('adopt')
  })

  it('대조군 — 한 군데 오르고 한 군데 내리면 버린다', () => {
    const next = { ...base, cost: { toolCalls: 70 }, shape: { matched: 11 } }
    const c = compare(base, next)
    expect(c.better).toContain('cost.toolCalls')
    expect(c.worse).toContain('shape.matched')
    expect(verdict(c)).toBe('reject')
  })

  it('대조군 — 비발동 실패가 늘면 버린다', () => {
    const next = { ...base, routing: { pass: 45, rejectFailures: 1 } }
    expect(verdict(compare(base, next))).toBe('reject')
  })

  it('대조군 — verify 가 깨지면 버린다', () => {
    expect(verdict(compare(base, { ...base, verify: { pass: false } }))).toBe('reject')
  })

  it('한쪽에 없는 축은 비교하지 않는다 — 없는 것을 하락으로 읽지 않는다', () => {
    expect(compare(base, { verify: { pass: true } }).worse).toEqual([])
  })

  it('아무것도 안 변하면 no-change 다', () => {
    expect(verdict(compare(base, { ...base }))).toBe('no-change')
  })
})
