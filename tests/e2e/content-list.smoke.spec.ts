import { expect, test } from '@playwright/test';

/**
 * 2026-09-17 브라우저 실측에서 되돌아올 전이 하나: 5.1 콘텐츠 목록의 일괄변경 3단계
 * (미선택 거절 → 변경 확인 → 변경 완료)와 그 뒤의 선택 해제. 단언은 문구·전이·선택 상태 같은 제품
 * 동작에만 걸고 예시 행의 id·값에는 걸지 않는다.
 */
test('@smoke content list bulk change refuses, confirms and completes', async ({ page }) => {
  await page.goto('/performances/contents');
  await expect(page.getByRole('heading', { name: '콘텐츠', exact: true })).toBeVisible();
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  await page.getByRole('button', { name: '변경', exact: true }).click();
  await expect(page.getByText('변경할 항목을 선택해주세요.')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();

  const firstRow = table.getByRole('checkbox').nth(1);
  await firstRow.check();
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await expect(page.getByText('변경할 사용 상태를 선택해주세요.')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();

  await page.getByRole('combobox', { name: '사용 상태', exact: true }).click();
  await page.getByRole('option', { name: '사용안함', exact: true }).click();
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await expect(page.getByText('선택 항목을 변경하시겠습니까?')).toBeVisible();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(firstRow).toBeChecked();

  await page.getByRole('button', { name: '변경', exact: true }).click();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('변경되었습니다.')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(firstRow).not.toBeChecked();
});
