import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as entry from './entry.mjs'
const { observationCeiling } = entry

describe('자신이 시작한 관측 서버', () => {
  it('지정한 root를 제공하고, 자기 서버를 닫아도 다른 서버는 살아 있다', async () => {
    const roots = ['first', 'second'].map((name) => {
      const root = mkdtempSync(join(tmpdir(), 'observe-test-'))
      writeFileSync(join(root, 'index.html'), `<h1>${name}</h1>`)
      return root
    })
    const servers = []
    try {
      for (const root of roots) servers.push(await entry.startObservation({ root, port: 0 }))
      expect(servers[0].root).toBe(realpathSync(roots[0]))
      expect(await (await fetch(servers[0].url)).text()).toContain('<h1>first</h1>')
      expect(await (await fetch(servers[1].url)).text()).toContain('<h1>second</h1>')
      await servers[0].close()
      await expect(fetch(servers[0].url)).rejects.toThrow()
      expect((await fetch(servers[1].url)).status).toBe(200)
    } finally {
      await Promise.all(servers.map((server) => server.close()))
      roots.forEach((root) => rmSync(root, { recursive: true, force: true }))
    }
  })

  it('포트 충돌이면 다른 서버 재사용이나 포트 변경 없이 실패한다', async () => {
    const root = mkdtempSync(join(tmpdir(), 'observe-test-'))
    writeFileSync(join(root, 'index.html'), '<h1>existing</h1>')
    let existing
    let unexpected
    try {
      existing = await entry.startObservation({ root, port: 0 })
      const port = Number(new URL(existing.url).port)
      await expect(
        entry.startObservation({ root, port }).then((server) => {
          unexpected = server
        }),
      ).rejects.toThrow(/already in use/)
      expect(await (await fetch(existing.url)).text()).toContain('<h1>existing</h1>')
    } finally {
      await unexpected?.close()
      await existing?.close()
      rmSync(root, { recursive: true, force: true })
    }
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
