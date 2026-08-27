import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import {
  getList3,
  getList10,
  getManagers,
  getMenus,
  ping,
  reissue,
  signIn,
  signOut,
  signOut1,
} from '@/api/generated/endpoints'

/**
 * Orval 함수명은 도메인 경로를 보장하지 않는다. 이 스냅샷의 실측 함정:
 *
 *   getManagers -> /api/v1/options/managers   (옵션 조회. 운영자 목록이 아니다)
 *   getMenus    -> /api/v1/options/menus      (옵션 조회. 접근 메뉴가 아니다)
 *   signOut     -> /api/v1/auth/app/sign-out  (**앱** 로그아웃. 웹 로그아웃이 아니다)
 *
 * feature adapter 는 이름이 아니라 **경로**로 고른다. 실제 호출을 가로채 URL 을 확인해
 * 그 계약을 고정한다. 스냅샷이 바뀌어 대응이 달라지면 여기서 실패해야 한다.
 */

const ORIGIN = 'http://localhost:3000'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

/** 어떤 요청이든 받아 경로만 기록하고 성공 봉투를 돌려준다. */
async function pathOf(call: () => Promise<unknown>): Promise<string> {
  let seen = ''
  server.use(
    http.all(`${ORIGIN}/*`, ({ request }) => {
      seen = new URL(request.url).pathname
      return HttpResponse.json({ header: { resultCode: 200, resultMessage: 'SUCCESS' }, data: null })
    }),
  )
  await call()
  return seen
}

describe('생성물 이름-경로 계약 — 첫 slice 가 쓸 operation', () => {
  it('signIn -> /api/v1/auth/sign-in', async () => {
    expect(await pathOf(() => signIn({ id: 'x', password: 'y' }))).toBe('/api/v1/auth/sign-in')
  })
  it('reissue -> /api/v1/auth/reissue', async () => {
    expect(await pathOf(() => reissue({ id: 'x' }))).toBe('/api/v1/auth/reissue')
  })
  it('ping -> /api/v1/auth/ping', async () => {
    expect(await pathOf(() => ping())).toBe('/api/v1/auth/ping')
  })
  it('웹 로그아웃은 signOut1 -> /api/v1/auth/sign-out', async () => {
    expect(await pathOf(() => signOut1())).toBe('/api/v1/auth/sign-out')
  })
  it('운영자 목록은 getList3 -> /api/v1/managers', async () => {
    expect(await pathOf(() => getList3())).toBe('/api/v1/managers')
  })
  it('접근 가능 메뉴는 getList10 -> /api/v1/menus', async () => {
    expect(await pathOf(() => getList10())).toBe('/api/v1/menus')
  })
})

describe('생성물 이름 함정 — 이름만 보고 집으면 다른 리소스를 친다', () => {
  it('getManagers 는 운영자 목록이 아니라 옵션 조회다', async () => {
    const path = await pathOf(() => getManagers())
    expect(path).not.toBe('/api/v1/managers')
    expect(path).toBe('/api/v1/options/managers')
  })
  it('getMenus 는 접근 메뉴가 아니라 옵션 조회다', async () => {
    const path = await pathOf(() => getMenus())
    expect(path).not.toBe('/api/v1/menus')
    expect(path).toBe('/api/v1/options/menus')
  })
  it('signOut 은 웹이 아니라 앱 로그아웃이다 (deviceId 를 요구하는 것이 신호)', async () => {
    const path = await pathOf(() => signOut({ deviceId: 'device-1' }))
    expect(path).not.toBe('/api/v1/auth/sign-out')
    expect(path).toBe('/api/v1/auth/app/sign-out')
  })
})
