import { expect, test } from '@playwright/test';
test('제품 화면의 mock Query와 생성 API HTTP mock의 책임을 구분한다', async ({ page }) => {
  await page.goto('/managers?periodType=joinedAt');
  await expect(page.getByText('검색결과 : 105', { exact: true })).toBeVisible();
  // 생성 API HTTP handler는 제품의 미확정 상태 계약과 별개로 테스트한다.
  const outcome = await page.evaluate(async () => {
    const read = await fetch('/api/v1/managers');
    const write = await fetch('/api/v1/managers', { method: 'POST' });
    return { readStatus: read.status, read: await read.text(), writeStatus: write.status };
  });
  expect(outcome.readStatus).toBe(200);
  expect(outcome.read).toContain('"totalCount":2');
  expect(outcome.writeStatus).toBe(501);
});
