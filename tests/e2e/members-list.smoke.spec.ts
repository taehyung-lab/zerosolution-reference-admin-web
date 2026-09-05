import { expect, test } from '@playwright/test';

test('@smoke active member routes expose the confirmed no-API workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/members/active/all');

  await expect(page.getByRole('heading', { name: '전체회원' })).toBeVisible();
  await expect(page.getByText('검색해주세요.')).toBeVisible();
  await expect(page.getByRole('group', { name: '계정 상태' })).toBeVisible();
  await expect(page.getByRole('group', { name: '활동제한' })).toBeVisible();

  const help = page.getByRole('button', { name: '전체회원 안내' });
  await help.hover();
  await expect(page.getByRole('tooltip')).toHaveText('활성회원을 조회 및 관리합니다.');
  await help.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('heading', { name: '전체회원' }).click();
  await help.focus();
  await expect(page.getByRole('tooltip')).toHaveText('활성회원을 조회 및 관리합니다.');
  await help.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  await page.getByRole('form', { name: '검색' }).getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/periodType=joinedAt/);
  await expect(page.getByText('검색결과 : 0')).toBeVisible();
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  await expect(page.getByRole('combobox', { name: '보기' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '정렬' })).toBeVisible();

  const locale = page.getByRole('combobox', { name: '언어' });
  await expect(locale.locator('option')).toHaveText(['한국어', 'ENGLISH', '日本語']);

  await page.goto('/members/active/general');
  await expect(page.getByRole('heading', { name: '일반회원' })).toBeVisible();
  await expect(page.getByRole('group', { name: '계정 상태' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '활동제한' })).toHaveCount(0);

  await page.goto('/members/active/flagged');
  await expect(page.getByRole('heading', { name: '불량회원' })).toBeVisible();
  await expect(page.getByRole('group', { name: '계정 상태' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: '활동제한' })).toBeVisible();

  await page.getByRole('button', { name: '등록' }).click();
  await expect(page).toHaveURL(/\/members\/new$/);
  await expect(page.getByRole('heading', { name: '회원 등록은 후속 이슈에서 구현합니다.' })).toBeVisible();
});
