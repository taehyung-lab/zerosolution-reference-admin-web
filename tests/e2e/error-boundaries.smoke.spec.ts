import { expect, test, type Page, type Route } from '@playwright/test'

function envelope(data: unknown) {
  return { contentType: 'application/json', body: JSON.stringify({ header: { resultCode: 200 }, data }) }
}

async function fulfillDetail(route: Route, data: unknown) {
  await route.fulfill(envelope(data))
}

async function installOptionRoutes(page: Page) {
  await page.route('**/api/v1/options/**', (route) => route.fulfill(envelope([])))
}

test('@smoke detail, root, and access error boundaries render their owned outcomes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installOptionRoutes(page)

  let releasePending!: () => void
  const pendingGate = new Promise<void>((resolve) => { releasePending = resolve })
  await page.route('**/api/v1/managers/pending', async (route) => {
    await pendingGate
    await fulfillDetail(route, { id: 'pending', name: 'Pending', status: { id: 'ACTIVE' } })
  })
  await page.goto('/managers/pending')
  await expect(page.getByRole('status')).toContainText('데이터를 불러오는 중입니다')
  await expect(page.getByText('운영자를 찾을 수 없습니다.')).toHaveCount(0)
  releasePending()
  await expect(page.getByRole('heading', { name: '운영자 조회' })).toBeVisible()
  await expect(page.getByText('Pending', { exact: true })).toBeVisible()

  await page.route('**/api/v1/managers/missing', (route) => route.fulfill({
    status: 404,
    headers: { 'content-type': 'application/json', 'x-request-id': 'req-missing', 'access-control-expose-headers': 'x-request-id' },
    body: JSON.stringify({ header: { resultCode: 404, resultMessage: 'private missing' }, data: null }),
  }))
  await page.goto('/managers/missing')
  await expect(page.getByText('운영자를 찾을 수 없습니다.')).toBeVisible()
  await expect(page.getByText('private missing')).toHaveCount(0)

  await page.route('**/api/v1/managers/empty', (route) => fulfillDetail(route, undefined))
  await page.goto('/managers/empty')
  await expect(page.getByRole('alert')).toContainText('운영자 정보를 불러오지 못했습니다.')
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  await expect(page.getByText('운영자를 찾을 수 없습니다.')).toHaveCount(0)

  let recoverableCalls = 0
  await page.route('**/api/v1/managers/recoverable', async (route) => {
    recoverableCalls += 1
    if (recoverableCalls <= 2) {
      await route.fulfill({
        status: 503,
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-recoverable', 'access-control-expose-headers': 'x-request-id' },
        body: JSON.stringify({ header: { resultCode: 503, resultMessage: 'private outage' }, data: null }),
      })
      return
    }
    await fulfillDetail(route, { id: 'recoverable', name: 'Recovered', status: { id: 'ACTIVE' } })
  })
  await page.goto('/managers/recoverable')
  await expect(page.getByRole('alert')).toContainText('req-recoverable')
  await expect(page.getByText('private outage')).toHaveCount(0)
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.getByText('Recovered')).toBeVisible()

  await page.route('**/api/v1/managers/fatal', (route) => fulfillDetail(route, {
    id: 'fatal', name: 'Fatal', status: { id: 'ACTIVE' }, changeLogs: 'malformed',
  }))
  await page.goto('/managers/fatal')
  await expect(page.getByRole('alert')).toContainText('문제가 발생했습니다')
  await expect(page.getByRole('alert')).not.toContainText('map is not a function')

  await page.route('**/api/v1/managers/forbidden', (route) => route.fulfill({
    status: 403,
    headers: { 'content-type': 'application/json', 'x-request-id': 'req-forbidden', 'access-control-expose-headers': 'x-request-id' },
    body: JSON.stringify({ header: { resultCode: 403, resultMessage: 'private forbidden' }, data: null }),
  }))
  await page.goto('/')
  await page.goto('/managers/forbidden')
  await expect(page.getByRole('dialog')).toContainText('접근권한이 없습니다. 이전 화면으로 이동하세요.')
  await expect(page.getByText('private forbidden')).toHaveCount(0)
  await page.getByRole('dialog').getByRole('button', { name: '이전 화면으로 이동' }).click()
  await expect(page).toHaveURL(/\/$/)
})
