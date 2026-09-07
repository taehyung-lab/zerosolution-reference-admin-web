import { test, expect } from '@playwright/test';
for (const path of ['/members/active/all', '/managers']) {
  test(`@smoke repeated active header toggle ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('main').getByRole('button', { name: '검색', exact: true }).click();
    const header = page.getByRole('columnheader', { name: '가입일', exact: true });
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'descending', { timeout: 1500 });
  });
}
