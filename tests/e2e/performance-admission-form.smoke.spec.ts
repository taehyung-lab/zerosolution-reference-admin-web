import { expect, test } from '@playwright/test';

/**
 * 2026-09-17 브라우저 실측에서 되돌아올 전이 하나: 5.2 조회의 `수정` → 5.2.3 공연 수정 →
 * 저장 확인 → 저장 완료 → 그 공연의 조회 복귀. 단언은 문구·전이·URL 같은 제품 동작에만 걸고
 * 예시 공연의 id·게이트 이름·구역 값에는 걸지 않는다.
 */
test('@smoke performance admission edit confirms, completes and returns to the detail', async ({
  page,
}) => {
  await page.goto('/performances');
  const table = page.getByRole('table');
  await table.getByRole('row').nth(1).press('Enter');
  await expect(page.getByRole('heading', { name: '공연 조회', exact: true })).toBeVisible();
  const detailUrl = page.url();

  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page).toHaveURL(`${detailUrl}/edit`);
  await expect(page.getByRole('heading', { name: '공연 수정', exact: true })).toBeVisible();

  // 빈 행을 더하면 저장이 거절되고 확인창은 열리지 않는다.
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('필수 항목을 입력해주세요.').first()).toBeVisible();

  // 삭제한 행의 오류는 남은 행으로 옮겨가지 않는다.
  await page.getByRole('button', { name: '2번째 게이트 삭제' }).click();
  await expect(page.getByRole('combobox', { name: '게이트 2' })).toHaveCount(0);

  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'admission.png', mimeType: 'image/png', buffer: Buffer.from('e2e') });
  await page.getByRole('combobox', { name: '게이트 1' }).click();
  await page.getByRole('option').first().click();
  await page.getByLabel('구역 1*').fill('E2E zone');

  await page.getByRole('button', { name: '저장', exact: true }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm).toContainText('저장하시겠습니까?');
  await confirm.getByRole('button', { name: '확인', exact: true }).click();

  const saved = page.getByRole('dialog');
  await expect(saved).toContainText('저장되었습니다.');
  await saved.getByRole('button', { name: '확인', exact: true }).click();

  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByRole('heading', { name: '공연 조회', exact: true })).toBeVisible();
});
