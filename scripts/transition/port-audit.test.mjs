import { describe, expect, it } from 'vitest'
import { blocksOf, bestOverlap, portAudit } from './port-audit.mjs'

const judgement = '읽는 사람의 추적 비용을 실제로 줄일 때만 계층을 둔다. 한 소비자용 추상화는 만들지 않는다.'
const other = '기간 기준은 등록일과 최근업데이트일 둘이고 기본값은 등록일이다. 보기 기본값은 백이다.'

describe('이사 뒤 판단이 따라왔는지 대조한다', () => {
  it('옮기지 않은 판단을 찾아낸다', () => {
    // 대조군: 새 문서가 그 판단을 담지 않으면 반드시 보고돼야 한다. 빈 결과면 도구가 죽은 것이다.
    expect(portAudit([{ file: 'old.md', content: judgement }], other)).toEqual([
      expect.objectContaining({ file: 'old.md', total: 1, missing: 1 }),
    ])
  })

  it('문장을 다듬어 옮겨도 따라온 것으로 본다', () => {
    const reworded = '계층·wrapper 는 읽는 사람의 추적 비용을 실제로 줄일 때만 둔다. 한 소비자용 추상화는 만들지 않는다.'
    expect(portAudit([{ file: 'old.md', content: judgement }], reworded)).toEqual([])
  })

  it('제목과 표 구분자처럼 짧은 줄은 비교하지 않는다', () => {
    expect(blocksOf('# 제목\n\n| --- | --- |')).toEqual([])
  })

  it('겹침 비율은 0 과 1 사이다', () => {
    const overlap = bestOverlap(judgement, [new Set(['추적', '비용', '계층'])])
    expect(overlap).toBeGreaterThan(0)
    expect(overlap).toBeLessThan(1)
  })
})
