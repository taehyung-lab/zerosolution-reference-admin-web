import { expect, test } from '@playwright/test';
test('@smoke 없는 상세 ID를 정상 빈 상세와 구분한다', async ({ page }) => {
  await page.goto('/managers/does-not-exist');
  await expect(page.getByText('운영자를 찾을 수 없습니다.')).toBeVisible();
  await page.goto('/members/does-not-exist');
  await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible();
  await page.goto('/definitely-not-a-route');
  await expect(page.getByText('페이지를 찾을 수 없습니다.')).toBeVisible();
});
