import { expect, test, type Page } from '@playwright/test';
async function choose(page: Page, fieldName: RegExp, optionName: string) {
  await page.getByRole('combobox', { name: fieldName }).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}
// 제품 route는 확인된 입력과 로그까지 검증한다. 생성 API의 mutation 성공/실패는 form integration test가 검증한다.
test('@smoke manager create revalidates native input and Radix Select errors after reopening a closed section', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  const selectControlWarnings: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('changing from uncontrolled to controlled')) {
      selectControlWarnings.push(message.text())
    }
  })
  const writes: string[] = [];
  page.on("request", request => { if (request.method() === "POST") writes.push(request.url()); });
  await page.goto('/managers/new')

  await expect(page.getByRole('heading', { name: '운영자 등록' })).toBeVisible()
  await choose(page, /^유형/, 'Example type')
  await choose(page, /^권한/, 'Example permission')

  await page.getByRole('button', { name: '운영자정보' }).click()
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByText('아이디는 영문과 숫자 조합 6~20자입니다.')).toBeVisible()
  await expect(page.getByLabel('아이디*')).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.goto('/managers/new')
  const type = page.getByRole('combobox', { name: /^유형/ })
  await expect(type).toBeVisible()

  // 섹션을 닫으면 필드가 사라진다.
  await page.getByRole('button', { name: '운영자정보' }).click()
  await expect(type).toBeHidden()

  await page.getByRole('button', { name: '저장' }).click()

  // Radix Select 오류도 조용히 사라지지 않는다.
  await expect(page.getByRole('button', { name: '운영자정보' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('유형을 선택하세요.')).toBeVisible()
  await expect(type).toBeFocused()
  // 확인 대화상자조차 열리지 않는다.
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes).toHaveLength(0)
  expect(selectControlWarnings).toEqual([])
})

test('@smoke login renders the preserved sign-in field and action contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  await expect(page.getByLabel('아이디*')).toBeVisible()
  await expect(page.getByLabel('비밀번호*')).toHaveAttribute('type', 'password')
  await expect(page.getByRole('button', { name: '로그인' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '회원가입' })).toBeDisabled()
  await expect(page.getByText('ZERO PLUS+')).toBeVisible()
})

test.describe('unauthenticated entry', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('@smoke an app route without a stored credential lands on login with the attempted location', async ({ page }) => {
    await page.goto('/managers?pageSize=200')

    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
    const url = new URL(page.url())
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('redirect')).toBe('/managers?pageSize=200')
  })
})

test('@smoke manager form leaves without asking while clean, then confirms cancel and browser back with their own sentences', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await page.goto('/managers')
  await page.getByRole('button', { name: '등록' }).click()
  await expect(page.getByRole('heading', { name: '운영자 등록' })).toBeVisible()

  // 깨끗한 폼: 취소는 확인 없이 목록으로 돌아간다.
  await page.getByRole('button', { name: '취소' }).click()
  await expect(page).toHaveURL(/\/managers$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('button', { name: '등록' }).click()
  await page.getByLabel('이름*').fill('김맹맹')

  // 입력 뒤 취소: 취소 문장으로 묻고, "취소"는 입력을 유지한다.
  await page.getByRole('button', { name: '취소' }).click()
  const cancelDialog = page.getByRole('dialog')
  await expect(cancelDialog).toContainText('입력을 취소하시겠습니까?')
  await cancelDialog.getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/managers\/new$/)
  await expect(page.getByLabel('이름*')).toHaveValue('김맹맹')

  // 폼 밖 이동(뒤로가기): 화면 이동 문장으로 묻는다. 직전의 취소 사유가 남아 있지 않다.
  await page.goBack()
  const leaveDialog = page.getByRole('dialog')
  await expect(leaveDialog).toContainText('화면으로 이동하시겠습니까?')
  await leaveDialog.getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/managers\/new$/)

  // 취소 확인: blocker 를 지나 목록으로 이동한다.
  await page.getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('dialog')).toContainText('입력을 취소하시겠습니까?')
  await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/managers$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('@smoke 운영자 등록 확인은 로그까지 도달하고 저장 완료 뒤 목록으로 이동한다', async ({ page }) => {
  const logs: string[] = [];
  const writes: string[] = [];
  page.on('console', message => { if (message.type() === 'log') logs.push(message.text()); });
  page.on('request', request => { if (request.method() === 'POST') writes.push(request.url()); });
  await page.goto('/managers/new');
  await choose(page, /^유형/, 'Example type');
  await choose(page, /^권한/, 'Example permission');
  await page.getByLabel('아이디*').fill('operator01');
  await page.getByLabel('비밀번호*').fill('Passw0rd!');
  await page.getByLabel('비밀번호 확인*').fill('Passw0rd!');
  await page.getByLabel('이름*').fill('김맹맹');
  await page.getByLabel('휴대폰번호*').fill('010-1234-1234');
  await page.getByLabel('이메일*').fill('operator@example.com');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
  expect(logs).toHaveLength(0);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expect.poll(() => logs.length).toBe(1);
  expect(logs[0]).toContain('API');
  expect(logs[0]).not.toContain('Passw0rd!');
  expect(writes).toEqual([]);
  // 미연결 저장도 실서버와 같은 성공 경로를 돈다: 저장 완료 alert → 이동. 기준선이 갱신되어 이탈 질문이 없다.
  await expect(page.getByText('저장되었습니다.')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expect(page).toHaveURL(/\/managers$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
