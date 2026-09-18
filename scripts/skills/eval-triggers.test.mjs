import { describe, expect, it } from 'vitest'
import { invokedSkills, judge } from './eval-triggers.mjs'
import { CASES } from './fixtures.mjs'

const event = (skill) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill } }] } })

describe('무엇이 열렸는지 센다', () => {
  it('Skill 호출만 세고 중복은 한 번으로 본다', () => {
    const stream = [event('list-contract'), JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: {} }] } }), event('list-contract')].join('\n')
    expect(invokedSkills(stream)).toEqual(['list-contract'])
  })

  it('아무것도 안 열리면 빈 목록이다 — 통과가 아니라 관측 결과다', () => {
    expect(invokedSkills('not json\n{"type":"system"}')).toEqual([])
  })
})

describe('판정', () => {
  it('기대한 것이 안 열리면 실패다', () => {
    const result = judge({ id: 'x', expect: ['list-contract'] }, [])
    expect(result.ok).toBe(false)
    expect(result.missing).toEqual(['list-contract'])
  })

  it('열리면 안 되는 것이 열리면 실패다 — 대조군', () => {
    const result = judge({ id: 'x', reject: ['list-contract'] }, ['list-contract', 'api-wire'])
    expect(result.ok).toBe(false)
    expect(result.forbidden).toEqual(['list-contract'])
  })

  it('기대한 것이 열리고 금지한 것이 안 열리면 통과다', () => {
    expect(judge({ id: 'x', expect: ['api-wire'], reject: ['list-contract'] }, ['api-wire']).ok).toBe(true)
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
})
