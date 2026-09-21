import { expect, test } from '@playwright/test';

/**
 * 실측한 것 중 되돌아올 전이 하나를 남기는 회귀 그물이다. 단언은 제품 동작(진입점 → URL → 확인 →
 * 완료 → 목적지)만 걸고 fixture 의 값·ID 에는 걸지 않는다.
 */
test('@smoke GNB 내 정보로 들어가 수정 저장까지 가면 조회로 돌아온다', async ({ page }) => {
  await page.goto('/managers');

  await page.getByRole('banner').getByText('내 정보', { exact: true }).first().click();
  await page.getByRole('banner').getByRole('link', { name: '내 정보' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: '내정보 조회' })).toBeVisible();

  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page).toHaveURL(/\/profile\/edit$/);
  await expect(page.getByRole('heading', { name: '내정보 수정' })).toBeVisible();

  // 비밀번호는 `수정` 을 켜기 전까지 입력할 수 없다.
  await expect(page.getByRole('textbox', { name: '비밀번호', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: '수정', exact: true }).check();
  await expect(page.getByRole('textbox', { name: '비밀번호', exact: true })).toBeEnabled();

  // 켠 뒤에는 비밀번호가 필수가 된다 — 비워 두면 확인창이 열리지 않는다.
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill('Qw9!zXr2');
  await page.getByRole('textbox', { name: '비밀번호 확인', exact: true }).fill('Qw9!zXr2');
  await page.getByRole('textbox', { name: '이름', exact: true }).fill('E2E');
  await page.getByRole('button', { name: '저장', exact: true }).click();

  const confirm = page.getByRole('dialog');
  await expect(confirm).toContainText('저장하시겠습니까?');
  await confirm.getByRole('button', { name: '확인' }).click();

  const saved = page.getByRole('dialog');
  await expect(saved).toContainText('저장되었습니다.');
  await saved.getByRole('button', { name: '확인' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: '내정보 조회' })).toBeVisible();
});

test('@smoke 탈퇴는 비밀번호를 받고 완료 확인이 로그인 화면으로 보낸다', async ({ page }) => {
  await page.goto('/profile');

  await page.getByRole('button', { name: '탈퇴', exact: true }).click();
  const ask = page.getByRole('dialog');
  await expect(ask).toContainText('탈퇴를 진행하시겠습니까?');

  await ask.getByRole('button', { name: '확인' }).click();
  await expect(ask).toContainText('필수 항목을 입력해주세요.');

  await ask.getByRole('textbox', { name: '비밀번호', exact: true }).fill('e2e-current-password');
  await ask.getByRole('button', { name: '확인' }).click();

  const done = page.getByRole('dialog');
  await expect(done).toContainText('탈퇴가 완료되었습니다.');
  await done.getByRole('button', { name: '확인' }).click();

  await expect(page).toHaveURL(/\/login/);
});
