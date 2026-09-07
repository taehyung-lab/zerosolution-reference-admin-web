import { expect, test } from '@playwright/test';
test('@smoke 운영자 상세 Query와 수정 초기값이 같은 대상을 사용한다', async ({ page }) => {
  await page.goto('/managers/example-active');
  await expect(page.getByRole('heading', { name: '운영자 조회' })).toBeVisible();
  await expect(page.getByText('Example3', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '수정', exact: true }).click();
  await expect(page).toHaveURL(/example-active\/edit/);
  await expect(page.getByRole('textbox', { name: '이름', exact: true })).toHaveValue('Example3');
  await expect(page.getByRole('textbox', { name: '아이디', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: '비밀번호', exact: true })).toHaveCount(0);
});
