import { test, expect } from '@playwright/test';
// 활성 정렬 컬럼은 첫 렌더부터 방향(desc)을 표시하고, 헤더 클릭이 방향을 뒤집는다(list-workflow.md#sorting).
const lists = [
  { path: '/members/active/all', header: '가입일', searchFirst: true },
  { path: '/managers', header: '가입일', searchFirst: true },
  { path: '/community/boards', header: '등록일', searchFirst: false },
];
for (const { path, header: name, searchFirst } of lists) {
  test(`@smoke repeated active header toggle ${path}`, async ({ page }) => {
    await page.goto(path);
    if (searchFirst) await page.getByRole('main').getByRole('button', { name: '검색', exact: true }).click();
    const header = page.getByRole('columnheader', { name, exact: true });
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'descending', { timeout: 1500 });
  });
}
