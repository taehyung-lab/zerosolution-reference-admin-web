import { describe, expect, it } from 'vitest'
import { claudeLoadObservation, claudeLoadedSkills, observeCase, requiredContractsFrom, selectCases, validateRunSelection } from './eval-triggers.mjs'
import { CASES } from './fixtures.mjs'

const event = (skill) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill } }] } })

describe('무엇이 열렸는지 센다', () => {
  it('Skill 호출만 세고 중복은 한 번으로 본다', () => {
    const stream = [event('list-contract'), JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: {} }] } }), event('list-contract')].join('\n')
    expect(claudeLoadedSkills(stream)).toEqual(['list-contract'])
  })

  it('관측할 수 없는 런타임은 빈 목록이 아니라 미확인으로 남긴다', () => {
    const observed = observeCase(
      { id: 'x', expect: ['list-contract'] },
      { requiredContracts: ['list-contract'], actuallyLoadedSkills: null, loadObservation: 'unavailable' },
    )
    expect(observed.actuallyLoadedSkills).toBeNull()
    expect(observed.loadObservation).toBe('unavailable')
    expect(observed.unexpectedContracts).toEqual([])
  })

  it('필수 계약도 미확인이면 과잉·금지 계약을 확정하지 않는다', () => {
    const observed = observeCase(
      { id: 'x', expect: ['list-contract'], reject: ['api-wire'] },
      { requiredContracts: null, actuallyLoadedSkills: null, loadObservation: 'unavailable' },
    )
    expect(observed.forbiddenRequired).toEqual([])
    expect(observed.unexpectedContracts).toEqual([])
  })

  it('대조군 — Claude가 성공 종료해도 완결된 telemetry envelope가 없으면 빈 로드로 확정하지 않는다', () => {
    const incomplete = event('list-contract')
    expect(claudeLoadObservation(incomplete)).toEqual({
      actuallyLoadedSkills: null,
      loadObservation: 'unavailable',
    })
  })

  it('완결된 Claude telemetry에서 Skill 호출이 없으면 빈 로드를 관측값으로 남긴다', () => {
    const complete = [
      JSON.stringify({ type: 'system', subtype: 'init' }),
      JSON.stringify({ type: 'result', subtype: 'success' }),
    ].join('\n')
    expect(claudeLoadObservation(complete)).toEqual({
      actuallyLoadedSkills: [],
      loadObservation: 'observed',
    })
  })
})

describe('구조화된 관측', () => {
  it('런타임 JSON event 안의 최종 구조화 응답을 읽는다', () => {
    const output = JSON.stringify({ type: 'item.completed', item: { text: 'ROUTING_RESULT {"requiredContracts":["list-contract"]}' } })
    expect(requiredContractsFrom(output)).toEqual(['list-contract'])
  })

  it('대조군 — 구조화 응답이 없으면 빈 선택이 아니라 미확인이다', () => {
    expect(requiredContractsFrom('{"message":"done"}')).toBeNull()
  })

  it('읽어야 한다고 판단한 계약과 실제 로드를 다른 필드로 보존한다', () => {
    const result = observeCase(
      { id: 'x', expect: ['list-contract'] },
      { requiredContracts: ['list-contract'], actuallyLoadedSkills: ['product-evidence'], loadObservation: 'observed' },
    )
    expect(result.requiredContracts).toEqual(['list-contract'])
    expect(result.actuallyLoadedSkills).toEqual(['product-evidence'])
  })

  it('기대·허용 범위 밖의 필수 계약을 reject와 별개로 드러낸다', () => {
    const result = observeCase(
      { id: 'x', expect: ['list-contract'], allowed: ['route-composition'], reject: ['api-wire'] },
      { requiredContracts: ['list-contract', 'route-composition', 'api-wire', 'shared-ui'], actuallyLoadedSkills: null, loadObservation: 'unavailable' },
    )
    expect(result.unexpectedContracts).toEqual(['api-wire', 'shared-ui'])
    expect(result.forbiddenRequired).toEqual(['api-wire'])
    expect(result.allowed).toEqual(['route-composition'])
    expect(result.loadObservation).toBe('unavailable')
  })

  it('대조군 — 기대와 어긋난 것을 보여주지만 자동 verdict를 내리지 않는다', () => {
    const result = observeCase(
      { id: 'x', expect: ['list-contract'], reject: ['api-wire'] },
      { requiredContracts: ['api-wire'], actuallyLoadedSkills: null, loadObservation: 'unavailable' },
    )
    expect(result.missingRequired).toEqual(['list-contract'])
    expect(result.forbiddenRequired).toEqual(['api-wire'])
    expect(result).not.toHaveProperty('ok')
    expect(result).not.toHaveProperty('verdict')
  })
})

describe('fixture', () => {
  it('skill 마다 명백·재표현·비발동 셋이 있다', () => {
    const kinds = new Map()
    for (const item of CASES) {
      const [group, kind] = item.id.split('/')
      kinds.set(group, [...(kinds.get(group) ?? []), kind])
    }
    expect(kinds.size).toBe(15)
    for (const [group, list] of kinds) expect([group, [...list].sort()]).toEqual([group, ['명백', '비발동', '재표현']])
  })

  it('smoke는 skill당 실제적인 재표현 하나만 고른다', () => {
    const smoke = selectCases(CASES, 'smoke')
    expect(smoke).toHaveLength(15)
    expect(smoke.every((item) => item.id.endsWith('/재표현'))).toBe(true)
    expect(smoke.every((item) => item.reject?.length)).toBe(true)
  })

  it('full은 명백·재표현·비발동 45개를 유지한다', () => {
    expect(selectCases(CASES, 'full')).toHaveLength(45)
  })

  it('대조군 — 필터 뒤 0건이면 성공 관측으로 실행하지 않는다', () => {
    expect(() => validateRunSelection([], 2)).toThrow('평가할 case가 없다')
  })

  it.each([0, -1, 1.5, Number.NaN])('대조군 — jobs=%s 는 실행하지 않는다', (jobs) => {
    expect(() => validateRunSelection([CASES[0]], jobs)).toThrow('양의 정수')
  })
})
