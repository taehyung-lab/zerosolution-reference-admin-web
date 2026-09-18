import { describe, expect, it } from 'vitest'
import { contactMaskingFailures } from './contact-masking.mjs'

const file = (content, name = 'src/features/x/screens/x-list/ui/x-columns.tsx') => [{ file: name, content }]

describe('연락처 마스킹 — fact 가 말한 것을 코드에서 본다', () => {
  it('마스킹을 지나면 통과한다', () => {
    expect(contactMaskingFailures(file("sortable('email', (row) => maskEmail(row.email)),"))).toEqual([])
  })

  it('대조군 — 셀이 원값을 내보내면 실패한다', () => {
    const failures = contactMaskingFailures(file("sortable('email', (row) => row.email),"))
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('CONTACT-MASKING')
  })

  it('대조군 — 셀은 마스킹해도 접근성 이름이 원값이면 실패한다', () => {
    // 실제로 목록 5개가 이 상태였다. 셀은 가려지는데 스크린리더에는 그대로 읽혔다.
    const content = [
      "rowLabel: (row) => t('result.selectRow', { name: row.email }),",
      "sortable('email', (row) => maskEmail(row.email)),",
    ].join('\n\n')
    expect(contactMaskingFailures(file(content))).toHaveLength(1)
  })

  it('폼은 대상이 아니다 — 사용자가 그 값을 고치는 자리라고 fact 가 적었다', () => {
    expect(contactMaskingFailures(file('value={record.phone}', 'src/features/x/screens/x-form/ui/XForm.tsx'))).toEqual([])
  })

  it('표현식이 두 줄에 걸쳐도 마스킹을 본다', () => {
    const content = "sortable('phone', (row) =>\n  maskPhone(row.phone),\n),"
    expect(contactMaskingFailures(file(content))).toEqual([])
  })

  it('이 저장소의 실제 코드가 통과한다', () => {
    expect(contactMaskingFailures()).toEqual([])
  })
})
