import { expect, test } from '@playwright/test';

test('@smoke 운영자 검색은 mock Query 결과·페이지·검색 초기화를 연결한다', async ({ page }) => {
  await page.goto('/managers');
  await expect(page.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeVisible();
  await page.getByRole('form', { name: '검색', exact: true }).getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/periodType=joinedAt/);
  await expect(page.getByText('검색결과 : 105', { exact: true })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(101);
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('row')).toHaveCount(6);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('@smoke 운영자 일괄변경은 선택·확인 후 요청 로그 한 번까지 도달한다', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', message => { if (message.type() === 'log') logs.push(message.text()); });
  await page.goto('/managers?periodType=joinedAt');
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('변경할 항목을 선택해주세요.');
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await page.getByRole('checkbox', { name: 'example-active 선택', exact: true }).check();
  await page.getByRole('combobox', { name: '변경 항목', exact: true }).click();
  await page.getByRole('option', { name: '비활성', exact: true }).click();
  await page.getByRole('button', { name: '변경', exact: true }).click();
  const before = logs.length;
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  expect(logs.slice(before)).toHaveLength(1);
  expect(logs.at(-1)).toContain('API');
  await expect(page.getByText('저장되었습니다.')).toHaveCount(0);
});
