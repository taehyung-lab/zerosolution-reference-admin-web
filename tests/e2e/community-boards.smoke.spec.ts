import { expect, test } from '@playwright/test';

test('@smoke LNB 커뮤니티를 누르면 게시판 목록으로 이동한다', async ({ page }) => {
  await page.goto('/managers');

  await page
    .getByRole('navigation')
    .getByRole('link', { name: '커뮤니티', exact: true })
    .click();

  await expect(page).toHaveURL(/\/community\/boards$/);
  await expect(page.getByRole('heading', { name: '게시판', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('@smoke 게시판 목록은 진입 즉시 조회하고 초기화 뒤에도 결과를 유지한다', async ({ page }) => {
  await page.goto('/community/boards');

  await expect(page.getByRole('heading', { name: '게시판', exact: true })).toBeVisible();
  await expect(page.getByText('검색결과 : 7')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(8);

  const criterion = page.getByRole('combobox', { name: '기간 기준' });
  await criterion.click();
  await expect(page.getByRole('option')).toHaveText(['등록일', '최근업데이트일']);
  await page.keyboard.press('Escape');

  await page.getByRole('textbox', { name: '검색어', exact: true }).fill('Board 5');
  await page
    .getByRole('form', { name: '검색 조건', exact: true })
    .getByRole('button', { name: '검색', exact: true })
    .click();
  await expect(page).toHaveURL(/keywords/);
  await expect(page.getByText('검색결과 : 1')).toBeVisible();

  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page).toHaveURL(/\/community\/boards$/);
  await expect(page.getByText('검색결과 : 7')).toBeVisible();
  await expect(page.getByRole('textbox', { name: '검색어', exact: true })).toHaveValue('');
});

test('@smoke 게시판 목록의 활성 정렬 헤더만 방향을 바꾼다', async ({ page }) => {
  await page.goto('/community/boards');

  const header = page.getByRole('columnheader', { name: '등록일', exact: true });
  await expect(header).not.toHaveAttribute('aria-sort', /.*/);

  await header.getByRole('button').click();
  await expect(page).toHaveURL(/sortDirection=asc/);
  await expect(header).toHaveAttribute('aria-sort', 'ascending');

  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');

  const other = page.getByRole('columnheader', { name: '게시물수', exact: true });
  await other.getByRole('button').click();
  await expect(other).toHaveAttribute('aria-sort', 'ascending');
  await expect(header).not.toHaveAttribute('aria-sort', /.*/);
});

test('@smoke 일치하는 결과가 없으면 원문 안내 문구를 보여 준다', async ({ page }) => {
  await page.goto('/community/boards');

  await page.getByRole('textbox', { name: '검색어', exact: true }).fill('No Such Board');
  await page
    .getByRole('form', { name: '검색 조건', exact: true })
    .getByRole('button', { name: '검색', exact: true })
    .click();

  await expect(page.getByText('일치하는 검색결과가 없습니다.')).toBeVisible();
  await expect(page.getByText('검색결과 : 0')).toBeVisible();
});
