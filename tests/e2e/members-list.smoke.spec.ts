import { expect, test } from '@playwright/test';

test('@smoke active member routes expose the confirmed no-API workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/members/active/all');

  await expect(page.getByRole('heading', { name: '전체회원' })).toBeVisible();
  await expect(page.getByText('검색해주세요.')).toBeVisible();
  await expect(page.getByRole('group', { name: '계정 상태' })).toBeVisible();
  await expect(page.getByRole('group', { name: '활동제한' })).toBeVisible();

  const help = page.getByRole('button', { name: '전체회원 안내' });
  await expect(page.locator('header').filter({ has: page.getByRole('heading', { name: '전체회원', exact: true }) }).getByRole('navigation', { name: '현재 위치' })).toContainText('!');
  await expect(page.getByRole('navigation', { name: '현재 위치' }).getByRole('listitem')).toHaveText(['회원', '›활성회원', '›전체회원']);
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
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('combobox', { name: '보기' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '정렬' })).toBeVisible();

  const bulkTarget = page.getByRole('combobox', { name: '변경 항목' });
  await expect(bulkTarget).toContainText('선택');
  await bulkTarget.click();
  await expect(page.getByRole('option')).toHaveText(['일반회원', '불량회원']);
  await page.getByRole('option', { name: '불량회원', exact: true }).click();
  await expect(bulkTarget).toContainText('불량회원');
  await expect(page.getByRole('group', { name: '활동제한', exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveText(/변경할 항목을 선택해주세요/);
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

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
  await expect(page.getByRole('heading', { name: '회원 등록' })).toBeVisible();
});

test('@smoke member create validates, confirms without fake success, and protects unsaved input', async ({ page }) => {
  await page.goto('/members/new');
  const email = page.getByRole('textbox', { name: '이메일' });
  const save = page.getByRole('button', { name: '저장', exact: true });
  await save.click();
  await expect(page.getByRole('alert')).toHaveCount(5);
  await expect(email).toBeFocused();
  await email.fill('reference@example.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('Rt7!vK9@q');
  await page.getByRole('textbox', { name: '이름' }).fill('검증회원');
  await page.getByRole('textbox', { name: '휴대폰번호' }).fill('010-0000-0000');
  await page.getByRole('group', { name: '생년월일' }).locator('[data-today] button').click();
  await save.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('저장하시겠습니까?');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(email).toHaveValue('reference@example.com');
  await expect(save).toBeFocused();
  await save.click();
  await dialog.getByRole('button', { name: '확인' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/members\/new$/);
  await expect(email).toHaveValue('reference@example.com');
  await expect(page.getByText('저장되었습니다.')).toHaveCount(0);
  const cancel = page.getByRole('button', { name: '취소', exact: true });
  await cancel.click();
  await expect(dialog).toContainText('입력을 취소하시겠습니까?');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(email).toHaveValue('reference@example.com');
  await expect(cancel).toBeFocused();
  await cancel.click();
  await dialog.getByRole('button', { name: '확인' }).click();
  await expect(page).toHaveURL(/\/members\/active\/all$/);
  await page.getByRole('button', { name: '등록' }).click();
  await email.fill('a');
  await email.fill('');
  await cancel.click();
  await expect(page).toHaveURL(/\/members\/active\/all$/);
  await expect(dialog).toHaveCount(0);
});
