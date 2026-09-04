import { expect, test } from '@playwright/test'

function envelope(data: unknown) {
  return { contentType: 'application/json', body: JSON.stringify({ header: { resultCode: 200 }, data }) }
}

test('@smoke manager detail renders field-level update history lines without exposing raw values', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/api/v1/options/**', (route) => route.fulfill(envelope([])))
  await page.route('**/api/v1/managers/history-e2e', (route) =>
    route.fulfill(
      envelope({
        id: 'history-e2e',
        name: '김영영',
        type: { id: 'INTERNAL', name: '내부담당자' },
        status: { id: 'ACTIVE', name: '승인' },
        createdAt: '2026-06-01T12:00:00Z',
        changeLogs: [
          {
            id: 2,
            type: 'U',
            createdAt: '2026-08-28T01:00:00Z',
            manager: { name: '관리자' },
            changes: [
              { field: 'password', before: 'old-secret', after: 'new-secret' },
              { field: 'name', before: '김체로', after: '김영영' },
              { field: 'permission', before: { raw: 'json' }, after: 'x' },
            ],
          },
          { id: 1, type: 'C', createdAt: '2026-06-01T12:00:00Z', manager: { name: '관리자' } },
        ],
      }),
    ),
  )

  await page.goto('/managers/history-e2e')
  await expect(page.getByRole('heading', { name: '운영자 조회' })).toBeVisible()
  const history = page.getByRole('table')
  await expect(history.getByRole('columnheader')).toHaveText(['업데이트일', '업데이트 사항', '담당자'])
  await expect(history.getByRole('listitem')).toHaveText(['수정', '비밀번호', '이름: 김체로 > 김영영', '권한: 표시할 수 없는 값', '등록'])
  await expect(history.getByRole('cell', { name: '관리자' })).toHaveCount(2)
  await expect(page.getByText('old-secret')).toHaveCount(0)
  await expect(page.getByText('json')).toHaveCount(0)
})
