import { expect, test } from '@playwright/test';

test('@smoke performance list follows Notion periods and reset without a fake API', async ({ page }) => {
  await page.goto('/performances');
  await expect(page.getByRole('heading', { name: '공연 목록', exact: true })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(3);
  const criterion = page.getByRole('combobox', { name: '기간 기준' });
  await criterion.click();
  await expect(page.getByRole('option')).toHaveText(['공연일', '등록일', '최근업데이트일']);
  await page.getByRole('option', { name: '등록일', exact: true }).click();
  await page.getByRole('textbox', { name: '검색어', exact: true }).fill('공연');
  await expect(page).toHaveURL(/\/performances$/);
  await page.getByRole('form', { name: '검색', exact: true }).getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/periodType=registeredAt/);
  await expect(page).toHaveURL(/keywords=/);
  // 이 목록의 진입 계약은 즉시 조회다. 초기화는 그 진입 화면을 다시 적용하므로 결과가 남는다.
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page).toHaveURL(/\/performances$/);
  await expect(page.getByRole('textbox', { name: '검색어', exact: true })).toHaveValue('');
  await expect(page.getByRole('row')).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole('row')).toHaveCount(3);
});
