import { expect, test, type Page } from '@playwright/test'

/** The select is a Radix listbox, so a choice is trigger click + option click, not `selectOption`. */
async function choose(page: Page, fieldName: RegExp, optionName: string) {
  await page.getByRole('combobox', { name: fieldName }).click()
  await page.getByRole('option', { name: optionName }).click()
}

/** 저장 → 확인 대화상자 → 완료 알림. */
async function saveAndAcknowledge(page: Page) {
  await page.getByRole('button', { name: '저장' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()
  await expect(page.getByRole('status')).toContainText('등록 중입니다')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('status')).toBeVisible()
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.closest('[inert]') === null)).toBe(true)
  await expect(page.getByRole('status')).toHaveCount(0)
  await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()
}

function envelope(data: unknown) {
  return { contentType: 'application/json', body: JSON.stringify({ header: { resultCode: 200 }, data }) }
}

async function installRehearsalApi(page: Page) {
  const writes: { method: string; body: unknown }[] = []

  await page.route('**/api/v1/options/manager-types**', async (route) => {
    await route.fulfill(
      envelope([
        { id: 'INTERNAL', name: '내부담당자' },
        { id: 'AGENCY', name: '기획사' },
      ]),
    )
  })
  await page.route('**/api/v1/options/permissions**', async (route) => {
    await route.fulfill(envelope([{ id: 3, name: '일반관리자' }]))
  })
  await page.route('**/api/v1/options/agencies**', async (route) => {
    await route.fulfill(envelope([{ id: 7, name: '부스터랩' }]))
  })
  await page.route('**/api/v1/managers/*/edit**', async (route) => {
    await route.fulfill(
      envelope({
        id: 'ididi1234',
        name: '김맹맹',
        organization: '부스터랩/제로플러스',
        phone: '010-1234-1234',
        email: 'your@email.com',
        type: { id: 'AGENCY', name: '기획사' },
        agency: { id: 7, name: '부스터랩' },
        permission: { id: 3, name: '일반관리자' },
        status: { id: 'ACTIVE', name: '활성' },
        createdAt: '2026-06-01T12:00:00Z',
      }),
    )
  })
  await page.route('**/api/v1/managers', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    writes.push({ method: 'POST', body: route.request().postDataJSON() })
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill(envelope(null))
  })
  await page.route('**/api/v1/managers/*', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback()
    writes.push({ method: 'PUT', body: route.request().postDataJSON() })
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill(envelope(null))
  })
  await page.route('**/api/v1/managers?**', async (route) => {
    await route.fulfill(envelope({ pageNo: 1, pageSize: 100, totalCount: 0, list: [] }))
  })

  return writes
}

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
  const writes = await installRehearsalApi(page)
  await page.goto('/managers/new')

  await expect(page.getByRole('heading', { name: '운영자 등록' })).toBeVisible()
  await choose(page, /^유형/, '내부담당자')
  await choose(page, /^권한/, '일반관리자')

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

test('@smoke manager create submits a body without the UI-only password confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  const writes = await installRehearsalApi(page)
  await page.goto('/managers/new')

  await choose(page, /^유형/, '내부담당자')
  await choose(page, /^권한/, '일반관리자')
  await page.getByLabel('아이디*').fill('operator01')
  await page.getByLabel('비밀번호*').fill('Passw0rd!')
  await page.getByLabel('비밀번호 확인*').fill('Passw0rd!')
  await page.getByLabel('이름*').fill('김맹맹')
  await page.getByLabel('휴대폰번호*').fill('010-1234-1234')
  await page.getByLabel('이메일*').fill('operator@example.com')
  await saveAndAcknowledge(page)

  await expect.poll(() => writes.length).toBe(1)
  const body = writes[0]?.body as Record<string, unknown>
  expect(Object.keys(body)).not.toContain('passwordConfirm')
  expect(body).toMatchObject({ id: 'operator01', permissionId: 3, type: 'INTERNAL' })
  await expect(page).toHaveURL(/\/managers\/?$/)
})

test('@smoke manager create reveals and preserves server field errors in a closed section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await installRehearsalApi(page)
  await page.route('**/api/v1/managers', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        header: { resultCode: 400, resultMessage: 'private validation detail' },
        data: [
          { field: 'name', validCode: 'rejected' },
          { field: 'id', validCode: 'duplicate' },
        ],
      }),
    })
  })
  await page.goto('/managers/new')

  await choose(page, /^유형/, '내부담당자')
  await choose(page, /^권한/, '일반관리자')
  await page.getByLabel('아이디*').fill('operator01')
  await page.getByLabel('비밀번호*').fill('Passw0rd!')
  await page.getByLabel('비밀번호 확인*').fill('Passw0rd!')
  await page.getByLabel('이름*').fill('김맹맹')
  await page.getByLabel('휴대폰번호*').fill('010-1234-1234')
  await page.getByLabel('이메일*').fill('operator@example.com')
  await page.getByRole('button', { name: '운영자정보' }).click()
  await page.getByRole('button', { name: '저장' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('button', { name: '운영자정보' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('서버에서 사용할 수 없는 값입니다.')).toHaveCount(2)
  await expect(page.getByLabel('아이디*')).toBeFocused()
  await expect(page.getByText('private validation detail')).toHaveCount(0)
})

test('@smoke manager edit shows the ID as read-only text and no password fields', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  const writes = await installRehearsalApi(page)
  await page.goto('/managers/ididi1234/edit')

  await expect(page.getByRole('heading', { name: '운영자 수정' })).toBeVisible()
  await expect(page.getByLabel('이름*')).toHaveValue('김맹맹')
  await expect(page.getByRole('combobox', { name: /^유형/ })).toContainText('기획사')
  await expect(page.getByRole('combobox', { name: /^기획사/ })).toContainText('부스터랩')
  // 아이디는 편집 컨트롤이 아니라 표시값이다.
  await expect(page.getByRole('textbox', { name: '아이디' })).toHaveCount(0)
  const displayId = page.getByText('ididi1234')
  const labelId = await displayId.getAttribute('aria-labelledby')
  expect(labelId).toBeTruthy()
  await expect(page.locator(`[id="${labelId}"]`)).toHaveText('아이디')
  await expect(page.getByLabel('비밀번호*')).toHaveCount(0)

  await page.getByLabel('이름*').fill('김수정')
  await saveAndAcknowledge(page)

  await expect.poll(() => writes.length).toBe(1)
  const body = writes[0]?.body as Record<string, unknown>
  expect(body).toMatchObject({ name: '김수정', agencyId: 7, permissionId: 3, type: 'AGENCY' })
  expect(Object.keys(body)).not.toContain('id')
  expect(Object.keys(body)).not.toContain('password')
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

test.describe('manager list result states', () => {
  test.use({ timezoneId: 'Asia/Seoul' })

  test('@smoke renders all four list states, an empty date, and a browser-zone date', async ({
    page,
  }) => {
    type Mode = 'ready' | 'empty' | 'error'
    let mode: Mode = 'ready'
    let listRequests = 0

    await page.route('**/api/v1/options/manager-types**', async (route) => {
      await route.fulfill(envelope([]))
    })
    await page.route('**/api/v1/managers?**', async (route) => {
      listRequests += 1
      if (mode === 'error') {
        await route.fulfill({ status: 503, ...envelope(null) })
        return
      }
      await route.fulfill(
        envelope({
          pageNo: 1,
          pageSize: 100,
          totalCount: mode === 'ready' ? 1 : 0,
          list:
            mode === 'ready'
              ? [
                  {
                    id: 'empty-date-manager',
                    type: { name: '기획사' },
                    organization: 'Zero',
                    name: 'Kim',
                    phone: '010',
                    permission: { name: 'Admin' },
                    registrationRoute: { name: 'WEB' },
                    status: { id: 'ACTIVE' },
                    createdAt: '',
                    updatedAt: '2026-09-01T16:00:00Z',
                  },
                ]
              : [],
        }),
      )
    })

    await page.goto('/managers')
    await expect(page.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeVisible()
    expect(listRequests).toBe(0)

    await page.goto('/managers?periodType=CREATED_AT')
    const readyRow = page.getByRole('row').filter({ hasText: 'empty-date-manager' })
    await expect(readyRow).toBeVisible()
    const headers = await page.getByRole('columnheader').allTextContents()
    const cells = readyRow.getByRole('cell')
    const createdAtIndex = headers.findIndex((header) => header.includes('가입일'))
    const updatedAtIndex = headers.findIndex((header) => header.includes('최근접속일'))
    await expect(cells.nth(createdAtIndex)).toHaveText('')
    await expect(cells.nth(updatedAtIndex)).toHaveText('2026-09-02')
    expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe(
      'Asia/Seoul',
    )

    mode = 'empty'
    await page.goto('/managers?periodType=CREATED_AT&sortType=UPDATED_AT')
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible()

    mode = 'error'
    await page.goto('/managers?periodType=CREATED_AT&sortType=NAME')
    await expect(page.getByRole('alert')).toContainText(
      '서버에서 요청을 처리하지 못했습니다. 다시 시도해 주세요.',
    )
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })
})

test('@smoke manager form leaves without asking while clean, then confirms cancel and browser back with their own sentences', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await installRehearsalApi(page)
  await page.goto('/managers')
  await page.getByRole('link', { name: '등록' }).click()
  await expect(page.getByRole('heading', { name: '운영자 등록' })).toBeVisible()

  // 깨끗한 폼: 취소는 확인 없이 목록으로 돌아간다.
  await page.getByRole('button', { name: '취소' }).click()
  await expect(page).toHaveURL(/\/managers$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.getByRole('link', { name: '등록' }).click()
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

test('@smoke manager create keeps guarding while the save is pending, then leaves once acknowledged', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await installRehearsalApi(page)
  // Later routes win: hold the POST long enough to navigate away mid-save.
  await page.route('**/api/v1/managers', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.fulfill(envelope(null))
  })
  await page.goto('/managers')
  await page.getByRole('link', { name: '등록' }).click()

  await choose(page, /^유형/, '내부담당자')
  await choose(page, /^권한/, '일반관리자')
  await page.getByLabel('아이디*').fill('operator01')
  await page.getByLabel('비밀번호*').fill('Passw0rd!')
  await page.getByLabel('비밀번호 확인*').fill('Passw0rd!')
  await page.getByLabel('이름*').fill('김맹맹')
  await page.getByLabel('휴대폰번호*').fill('010-1234-1234')
  await page.getByLabel('이메일*').fill('operator@example.com')
  await page.getByRole('button', { name: '저장' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '확인' }).click()
  await expect(page.getByRole('status')).toContainText('등록 중입니다')

  // 저장 중 뒤로가기: 진행 overlay 가 이미 기다리라고 말하므로 묻지 않고 거부한다. 화면은 그대로다.
  await page.goBack()
  await expect(page.getByRole('status')).toContainText('등록 중입니다')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/managers\/new$/)

  // 저장 완료 → 확인: 저장값이 새 기준선이라 묻지 않고 목록으로 이동한다.
  const saved = page.getByRole('dialog')
  await expect(saved).toContainText('저장되었습니다.')
  await saved.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/managers$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
