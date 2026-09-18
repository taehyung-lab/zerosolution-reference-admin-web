import { describe, expect, it } from 'vitest'
import * as score from './score.mjs'

const { compare, costFrom, parseRouting, parseVerify, shapeScore } = score

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
  it('구조화된 관측에서 확인·미확인·기대 차이를 센다', () => {
    const out = [
      JSON.stringify({ id: 'list/재표현', execution: 'observed', missingRequired: [], forbiddenRequired: [] }),
      JSON.stringify({ id: 'form/재표현', execution: 'observed', missingRequired: ['form-contract'], forbiddenRequired: [] }),
      JSON.stringify({ id: 'logic/재표현', execution: 'unconfirmed', missingRequired: ['logic'], forbiddenRequired: [] }),
      JSON.stringify({ summary: { observed: 2, unconfirmed: 1, total: 3 } }),
    ].join('\n')
    expect(parseRouting(out)).toEqual({ observed: 2, unconfirmed: 1, total: 3, missingRequired: 1, forbiddenRequired: 0 })
  })

  it('대조군 — 구조화된 summary가 없으면 0/0 통과가 아니라 미확인이다', () => {
    expect(parseRouting('runtime crashed')).toEqual({ observed: null, unconfirmed: null, total: null, missingRequired: null, forbiddenRequired: null })
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

describe('비교 — 판정하지 않고 관측을 보여준다', () => {
  const base = { verify: { pass: true }, routing: { observed: 45, unconfirmed: 0, missingRequired: 0, forbiddenRequired: 0 }, shape: { matched: 13 }, cost: { toolCalls: 90 } }

  it('좋아진 축과 나빠진 축을 함께 보여준다', () => {
    const next = { ...base, cost: { toolCalls: 70 } }
    const c = compare(base, next)
    expect(c.worse).toEqual([])
    expect(c.better).toEqual(['cost.toolCalls'])
  })

  it('대조군 — 한 군데 오르고 한 군데 내리면 버린다', () => {
    const next = { ...base, cost: { toolCalls: 70 }, shape: { matched: 11 } }
    const c = compare(base, next)
    expect(c.better).toContain('cost.toolCalls')
    expect(c.worse).toContain('shape.matched')
    expect(c.same).toBe(false)
  })

  it('대조군 — 금지 계약 선택이 늘면 나빠진 축으로 보여준다', () => {
    const next = { ...base, routing: { ...base.routing, forbiddenRequired: 1 } }
    expect(compare(base, next).worse).toContain('routing.forbiddenRequired')
  })

  it('대조군 — verify 가 깨지면 나빠진 축으로 보여준다', () => {
    expect(compare(base, { ...base, verify: { pass: false } }).worse).toContain('verify.pass')
  })

  it('한쪽에 없는 축은 비교하지 않는다 — 없는 것을 하락으로 읽지 않는다', () => {
    expect(compare(base, { verify: { pass: true } }).worse).toEqual([])
  })

  it('대조군 — 현재 verify 관측 자체가 없으면 실패로 만들지 않는다', () => {
    expect(compare(base, {}).worse).not.toContain('verify.pass')
  })

  it('대조군 — 비교 모듈은 자동 채택·거절 API를 내보내지 않는다', () => {
    expect(score.verdict).toBeUndefined()
  })
})
