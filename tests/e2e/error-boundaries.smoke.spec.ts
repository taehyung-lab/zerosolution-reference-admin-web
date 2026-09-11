import { expect, test } from '@playwright/test';
// 상세 route 는 loader 에서 레코드를 기다린다(router.md 형태). 없는 ID 는 route 404 페이지(레코드 없음 문구),
// 없는 URL 은 같은 페이지의 route 없음 문구다. 화면 헤더는 만들어지지 않는다.
test('@smoke 없는 상세 ID 와 없는 URL 을 404 페이지의 문구로 구분한다', async ({ page }) => {
  await page.goto('/managers/does-not-exist');
  await expect(page.getByRole('heading', { name: '찾을 수 없습니다' })).toBeVisible();
  await expect(page.getByText('요청한 정보를 찾을 수 없습니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '운영자 조회' })).toHaveCount(0);
  await page.goto('/members/does-not-exist');
  await expect(page.getByText('요청한 정보를 찾을 수 없습니다.')).toBeVisible();
  await page.goto('/definitely-not-a-route');
  await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible();
});
