import { describe, expect, it } from 'vitest'
import { evidencePreservationFailures } from './evidence-preservation.mjs'

const HEADER = '| 화면 | surface | Figma 관찰 | Notion 동작·정책 | 미확인 | 현재 코드 |'
const SEP = '| --- | --- | --- | --- | --- | --- |'
const row = (code) => `| 5.1 | table | checkbox + 컬럼 | (대기) | 정렬 키 | ${code} |`
const before = [HEADER, SEP, row('`DataTable`. **미구현**: 헤더 없음(2026-09-11 실측)')].join('\n')

/** inventory 를 실제로 읽지 않고 한 파일만 주입한다. 게이트가 보는 것은 HEAD 와 작업 트리의 차이뿐이다. */
const run = (after, headText = before) =>
  evidencePreservationFailures(process.cwd(), 'docs/reference/zero-sol', (file) => (file.endsWith('05-performances.md') ? after : ''), (file) => (file.endsWith('05-performances.md') ? headText : null))

describe('원장 근거 보존', () => {
  it('구현 포인터로 날짜 실측 기록을 덮으면 실패한다', () => {
    const after = [HEADER, SEP, row('`content-list-columns.tsx` + `DataTable`')].join('\n')
    // 대조군: 일부러 어긴 입력이 **빈 배열이 아닌** 실패를 내야 한다. 빈 배열이면 검사가 죽은 것이다.
    expect(run(after)).toEqual(expect.arrayContaining([expect.stringContaining('2026-09-11')]))
  })

  it('기존 기록을 남기고 포인터를 더하면 통과한다', () => {
    const after = [HEADER, SEP, row('`DataTable`. **미구현**: 헤더 없음(2026-09-11 실측). 현재 `content-list-columns.tsx`')].join('\n')
    expect(run(after)).toEqual([])
  })

  it('비어 있지 않던 미확인을 비우면 실패한다', () => {
    const after = [HEADER, SEP, '| 5.1 | table | checkbox + 컬럼 | (대기) | — | `DataTable`. **미구현**: 헤더 없음(2026-09-11 실측) |'].join('\n')
    expect(run(after).some((failure) => failure.includes('미확인'))).toBe(true)
  })

  it('보호 열의 관찰 표식을 지우면 실패한다', () => {
    const head = [HEADER, SEP, '| 5.1 | toolbar | `선택▾` + `변경`만. **등록 없음** | (대기) | 진입 위치 | — |'].join('\n')
    const after = [HEADER, SEP, '| 5.1 | toolbar | `선택▾` + `변경`만 | (대기) | 진입 위치 | `ContentListActions` |'].join('\n')
    expect(run(after, head).some((failure) => failure.includes('등록 없음'))).toBe(true)
  })

  it('HEAD 에 없던 파일은 대조하지 않는다', () => {
    expect(run('| 화면 |\n| --- |\n| 새 파일 |', null)).toEqual([])
  })
})

describe('fact 절 보존', () => {
  const fact = [
    '# 스마트프린터 목록',
    '',
    '## 관찰',
    '',
    '검색 조건은 기간 · 검색어 · 상태. 다중 선택 셋은 **default 가 전체**다.',
    '',
    '## 정책',
    '',
    '절 제목이 리스트 조회이므로 **진입 즉시 조회**다.',
    '',
    '## 미확인',
    '',
    '1. 정렬 default 가 마지막 설정값인지.',
    '',
  ].join('\n')
  const runFact = (after, headText = fact) =>
    evidencePreservationFailures(process.cwd(), 'product/facts', (file) => (file.endsWith('PRINTER-LIST.md') ? after : ''), (file) => (file.endsWith('PRINTER-LIST.md') ? headText : null))

  it('비어 있지 않던 미확인 절을 비우면 실패한다', () => {
    const after = fact.replace('1. 정렬 default 가 마지막 설정값인지.', '')
    expect(runFact(after).some((failure) => failure.includes('미확인'))).toBe(true)
  })

  it('관찰 절을 통째로 지우면 실패한다', () => {
    const after = fact.replace(/## 관찰[\s\S]*?(?=## 정책)/, '')
    expect(runFact(after).some((failure) => failure.includes('관찰'))).toBe(true)
  })

  it('구현 설명으로 관찰 표식을 지우면 실패한다', () => {
    const after = fact.replace('**진입 즉시 조회**', '`useListView` 가 진입 시 조회한다')
    expect(runFact(after).some((failure) => failure.includes('진입 즉시 조회'))).toBe(true)
  })

  it('관찰을 남기고 문장을 더하면 통과한다', () => {
    const after = fact.replace('1. 정렬 default 가 마지막 설정값인지.', '1. 정렬 default 가 마지막 설정값인지. (2026-09-17 재관찰: 원문 그대로)')
    expect(runFact(after)).toEqual([])
  })

  it('fact의 제품 근거를 보존한 채 현재 코드 이력만 제거하면 통과한다', () => {
    const beforeWithImplementation = `${fact}\n## 현재 코드\n\n2026-09-18 구현 상태 기록.\n`

    expect(runFact(fact, beforeWithImplementation)).toEqual([])
  })
})
