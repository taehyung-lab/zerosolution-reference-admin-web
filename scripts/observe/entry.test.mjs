import { describe, expect, it } from 'vitest'
import { observationCeiling, respondingPorts } from './entry.mjs'

describe('진입점 관찰', () => {
  it('응답한 포트만 돌려주고, 거부된 포트는 결과에서 빠진다', async () => {
    const fetchImpl = async (url) => {
      if (url.includes('5174')) return { status: 200 }
      throw new Error('ECONNREFUSED')
    }
    expect(await respondingPorts([5173, 5174], fetchImpl)).toEqual([
      { port: 5174, url: 'http://localhost:5174/', status: 200 },
    ])
  })

  it('하나도 응답하지 않으면 빈 목록이다 — 부재가 아니라 "지금 안 떠 있다"', async () => {
    const fetchImpl = async () => { throw new Error('ECONNREFUSED') }
    expect(await respondingPorts([5173], fetchImpl)).toEqual([])
  })
})

describe('실측 상한', () => {
  /** 파일 시스템을 주입한다 — 판정이 **실제 파일의 유무**에서 나오는지 보기 위해서다. */
  const world = (files, env) => ({
    read: () => env,
    exists: (file) => files.includes(file),
    list: () => files.filter((file) => file.startsWith('src/features/')).map((file) => file.split('/')[2]),
  })

  it('fixture·시나리오 요청·빈 API base 가 있으면 경계까지 확인됨이다', () => {
    const { read, exists, list } = world(
      ['.env.example', 'src/api/scenario.ts', 'src/features', 'src/features/orders', 'src/features/orders/fixtures'],
      'VITE_API_BASE_URL=""\n',
    )
    const { ceiling, reasons } = observationCeiling('/fake', read, exists, list)
    expect(ceiling).toBe('경계까지 확인됨')
    expect(reasons).toHaveLength(3)
    expect(reasons.join('\n')).toContain('VITE_API_BASE_URL')
  })

  it('실 origin 이어도 시나리오 요청 하나가 남아 있으면 완료를 주장할 수 없다', () => {
    const { read, exists, list } = world(
      ['.env.example', 'src/api/scenario.ts'],
      'VITE_API_BASE_URL="https://api.example.com"\n',
    )
    const { ceiling, reasons } = observationCeiling('/fake', read, exists, list)
    expect(ceiling).toBe('경계까지 확인됨')
    expect(reasons).toHaveLength(1)
  })

  it('대조군 — 실 origin 이고 fixture·시나리오 요청이 없으면 완료를 주장할 수 있다', () => {
    const { read, exists, list } = world(['.env.example'], 'VITE_API_BASE_URL="https://api.example.com"\n')
    const { ceiling, reasons } = observationCeiling('/fake', read, exists, list)
    expect(ceiling).toBe('완료')
    expect(reasons).toEqual([])
  })

  it('이 저장소 자신은 경계까지 확인됨이다 — 선언이 아니라 실제 파일이 그렇게 말한다', () => {
    const { ceiling, reasons } = observationCeiling()
    expect(ceiling).toBe('경계까지 확인됨')
    expect(reasons.length).toBeGreaterThan(1)
  })
})
