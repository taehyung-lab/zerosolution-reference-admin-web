import { describe, expect, it, vi } from 'vitest'
import { runFactChecks } from './run-checks.mjs'

const fact = (file, ...checkers) => ({
  file,
  text: checkers.map((checker) => `    verify: ${checker}`).join('\n'),
})

describe('fact 선언 검사 실행', () => {
  it('중복 checker를 제거하고 경로 순으로 실행한다', () => {
    const runChecker = vi.fn(() => 0)
    const result = runFactChecks({
      root: '/repo',
      readFacts: () => [
        fact('B.md', 'scripts/z.mjs', 'scripts/a.mjs'),
        fact('A.md', 'scripts/a.mjs'),
      ],
      runChecker,
    })

    expect(runChecker.mock.calls.map(([checker]) => checker.path)).toEqual([
      'scripts/a.mjs',
      'scripts/z.mjs',
    ])
    expect(result.checkers).toEqual([
      { path: 'scripts/a.mjs', facts: ['A.md', 'B.md'] },
      { path: 'scripts/z.mjs', facts: ['B.md'] },
    ])
  })

  it('선언 오류와 checker 종료 오류를 분리해 반환한다', () => {
    const result = runFactChecks({
      root: '/repo',
      readFacts: () => [fact('BROKEN.md', '../outside.mjs'), fact('VALUE.md', 'scripts/value.mjs')],
      runChecker: () => 7,
    })

    expect(result.declarationFailures).toEqual([
      { fact: 'BROKEN.md', checker: '../outside.mjs', reason: '저장소 상대 경로가 아니다' },
    ])
    expect(result.executionFailures).toEqual([
      { facts: ['VALUE.md'], checker: 'scripts/value.mjs', exitCode: 7 },
    ])
  })

  it('선언한 checker 하나라도 실패하면 통과하지 않는다', () => {
    const result = runFactChecks({
      root: '/repo',
      readFacts: () => [fact('VALUE.md', 'scripts/value.mjs')],
      runChecker: () => 1,
    })
    expect(result.ok).toBe(false)
  })

  it('선언한 checker가 없으면 통과한다', () => {
    const result = runFactChecks({
      root: '/repo',
      readFacts: () => [fact('EMPTY.md')],
      runChecker: vi.fn(),
    })
    expect(result).toMatchObject({ ok: true, checkers: [], declarationFailures: [], executionFailures: [] })
  })
})
