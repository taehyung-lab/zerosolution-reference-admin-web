import { expect, test, type Page } from '@playwright/test';

function observeRequests(page: Page) {
  const logs: string[] = [];
  const writes: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'log' && message.text().startsWith('[시나리오]')) logs.push(message.text());
  });
  page.on('request', (request) => {
    if (request.url().includes('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
  });
  return { logs, writes };
}

async function expectRequests(observed: ReturnType<typeof observeRequests>, ...labels: string[]) {
  await expect.poll(() => observed.logs).toEqual(labels.map((label) => '[시나리오] ' + label + ': 요청 입력 확인 → API 연결 대기'));
  expect(observed.writes).toEqual([]);
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

for (const [status, action, confirm, label] of [
  ['awaiting', '승인', '가입 승인하기', '운영자 가입 승인'],
  ['rejected', '삭제', '확인', '운영자 삭제'],
  ['active', '비활성화', '확인', '운영자 비활성화'],
  ['inactive', '활성', '확인', '운영자 활성화'],
] as const) {
  test('@reference request boundary ' + label, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto('/managers/example-' + status);
    await page.getByRole('button', { name: action, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
    expect(observed.logs).toEqual([]);
    await page.getByRole('button', { name: action, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: confirm, exact: true }).click();
    await expectRequests(observed, label);
    await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible();
  });
}

for (const [status, action, kind, label] of [
  ['awaiting', '거절', 'reject', '운영자 가입 거절'],
  ['active', '비밀번호 변경', 'password', '운영자 비밀번호 변경'],
  ['locked', '잠금해제', 'password', '운영자 잠금해제'],
  ['active', '개인정보 전체보기', 'reveal', '운영자 개인정보 조회 재인증'],
  ['active', '탈퇴', 'withdraw', '운영자 탈퇴 재인증'],
] as const) {
  test('@reference request boundary ' + label, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto('/managers/example-' + status);
    await page.getByRole('button', { name: action, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: kind === 'reject' ? '가입 거절하기' : '확인', exact: true });
    await confirm.click();
    await expect(dialog.getByRole('alert').first()).toBeVisible();
    expect(observed.logs).toEqual([]);
    if (kind === 'reject') await dialog.getByRole('textbox', { name: '승인거절 사유' }).fill('처리 요청 사유');
    else {
      await dialog.getByLabel('비밀번호', { exact: false }).first().fill('Safe!729');
      if (kind === 'password') await dialog.getByLabel('비밀번호 확인', { exact: false }).fill('Safe!729');
      if (kind === 'withdraw') await dialog.getByRole('textbox', { name: '탈퇴 사유' }).fill('탈퇴 요청 사유');
    }
    await confirm.click();
    await expectRequests(observed, label);
    await expect(dialog).toBeVisible();
  });
}

for (const [action, label] of [
  ['비밀번호 변경', '회원 비밀번호 변경'],
  ['개인정보 전체보기', '회원 개인정보 조회 재인증'],
  ['회원 탈퇴', '회원 탈퇴 재인증'],
] as const) {
  test('@reference request boundary ' + label, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto('/members/example-general');
    await page.getByRole('button', { name: action, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: '확인', exact: true });
    await confirm.click();
    await expect(dialog.getByRole('alert').first()).toBeVisible();
    expect(observed.logs).toEqual([]);
    if (action === '비밀번호 변경') {
      await dialog.getByLabel('비밀번호*', { exact: true }).fill('Safe!729');
      await dialog.getByLabel('비밀번호 확인*', { exact: true }).fill('Safe!729');
    } else {
      await dialog.getByRole('textbox', { name: '운영자 비밀번호' }).fill('operator-secret');
      if (action === '회원 탈퇴') await dialog.getByRole('textbox', { name: '탈퇴 사유' }).fill('탈퇴 요청 사유');
    }
    await confirm.click();
    await expectRequests(observed, label);
    await expect(dialog).toBeVisible();
  });
}

for (const [path, selectRows] of [
  ['/members/active/all', true],
  ['/members/active/general', true],
  ['/members/active/flagged', true],
  ['/members/dormant', true],
  ['/members/appeals', true],
  ['/members/appeals/appeal-1', false],
  ['/members/example-general', false],
  ['/managers/example-active', false],
] as const) {
  for (const channel of ['SMS', '이메일'] as const) {
    test('@reference message request ' + path + ' ' + channel, async ({ page }) => {
      const observed = observeRequests(page);
      await page.goto(path);
      if (selectRows) {
        if (path !== '/members/appeals') await page.getByRole('form', { name: '검색', exact: true }).getByRole('button', { name: '검색', exact: true }).click();
        await page.getByRole('row').nth(1).getByRole('checkbox').check();
      }
      await page.getByRole('button', { name: path.startsWith('/managers') ? channel + ' 발송' : channel, exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: '보내기', exact: true }).click();
      await expect(dialog.getByRole('alert').first()).toBeVisible();
      expect(observed.logs).toEqual([]);
      const body = dialog.getByRole('textbox', { name: '메시지 내용' });
      await body.fill('콘솔에 노출하지 않을 메시지 본문');
      await dialog.getByRole('button', { name: '보내기', exact: true }).click();
      await expectRequests(observed, channel + ' 발송');
      if (channel === 'SMS') await expect(body).toHaveValue('콘솔에 노출하지 않을 메시지 본문');
      else await expect(body).toContainText('콘솔에 노출하지 않을 메시지 본문');
      await expect(dialog).toBeVisible();
    });
  }
}

for (const [path, target, label] of [
  ['/members/active/all', '일반회원', '회원 일괄변경'],
  ['/members/active/general', '일반회원', '회원 일괄변경'],
  ['/members/active/flagged', '일반회원', '회원 일괄변경'],
  ['/managers', '활성', '운영자 일괄변경'],
] as const) {
  test('@reference bulk request ' + path, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto(path);
    await page.getByRole('main').getByRole('button', { name: '검색', exact: true }).click();
    await choose(page, '변경 항목', target);
    await page.getByRole('button', { name: '변경', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('선택');
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    expect(observed.logs).toEqual([]);
    await page.getByRole('checkbox', { name: '현재 페이지 전체 선택', exact: true }).check();
    await page.getByRole('button', { name: '변경', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
    expect(observed.logs).toEqual([]);
    await page.getByRole('button', { name: '변경', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    await expectRequests(observed, label);
    await expect(page.getByRole('checkbox', { name: '현재 페이지 전체 선택', exact: true })).toBeChecked();
  });
}

for (const [path, label] of [['/members/access', '회원접속 다운로드'], ['/members/counsel', '회원상담 다운로드']] as const) {
  test('@reference download request ' + path, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto(path);
    if (path === '/members/access') await page.getByRole('main').getByRole('button', { name: '검색', exact: true }).click();
    await choose(page, '다운로드 범위', '선택한 항목');
    await page.getByRole('button', { name: '다운로드', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    expect(observed.logs).toEqual([]);
    await page.getByRole('row').nth(1).getByRole('checkbox').check();
    await page.getByRole('button', { name: '다운로드', exact: true }).click();
    await expectRequests(observed, label);
    await choose(page, '다운로드 범위', '검색결과 전체');
    await page.getByRole('button', { name: '다운로드', exact: true }).click();
    await expectRequests(observed, label, label);
  });
}

test('@reference withdrawn activity deletion keeps the member and rows', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/withdrawn/withdrawn-1');
  await page.getByRole('checkbox', { name: 'EXAMPLE-001 선택', exact: true }).check();
  await page.getByRole('button', { name: '선택삭제', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expectRequests(observed, '회원 활동정보 선택삭제');
  await expect(page.getByRole('cell', { name: 'EXAMPLE-001', exact: true })).toBeVisible();
});

for (const [path, label] of [
  ['/members/example-general/edit', '회원 수정'],
  ['/managers/example-active/edit', '운영자 수정'],
] as const) {
  test('@reference edit request ' + path, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto(path);
    await page.getByRole('textbox', { name: '이름', exact: true }).fill('수정회원');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
    expect(observed.logs).toEqual([]);
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    await expectRequests(observed, label);
    await expect(page.getByRole('textbox', { name: '이름', exact: true })).toHaveValue('수정회원');
  });
}

test('@reference manager create reaches its handler after confirmation', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/managers/new');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  expect(observed.logs).toEqual([]);
  await choose(page, '유형', 'Example type');
  await choose(page, '권한', 'Example permission');
  for (const [label, value] of [['아이디*','operator99'],['비밀번호*','Safe!729'],['비밀번호 확인*','Safe!729'],['이름*','김'],['휴대폰번호*','010-1234-5678'],['이메일*','operator@example.com']] as const)
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expectRequests(observed, '운영자 등록');
  await expect(page.getByLabel('비밀번호*', { exact: true })).toHaveValue('Safe!729');
});

for (const [path, prefix] of [
  ['/members/example-general', '회원 상세 상담'],
  ['/members/counsel', '회원상담'],
] as const) {
  test('@reference counsel create edit delete requests ' + path, async ({ page }) => {
    const observed = observeRequests(page);
    await page.goto(path);
    if (path === '/members/counsel') await page.getByRole('cell', { name: '시나리오 검증용 문의 내용', exact: true }).click();
    const create = page.getByRole('form', { name: '신규 상담 등록', exact: true });
    await create.getByRole('button', { name: '저장', exact: true }).click();
    await expect(create.getByRole('alert').first()).toBeVisible();
    expect(observed.logs).toEqual([]);
    await create.getByRole('combobox', { name: '문의유형', exact: true }).click();
    await page.getByRole('option', { name: '예매', exact: true }).click();
    await create.getByRole('textbox', { name: '상담내용 및 처리결과', exact: true }).fill('새 상담 내용');
    await create.getByRole('button', { name: '저장', exact: true }).click();
    await expectRequests(observed, prefix + ' 등록');
    await expect(create.getByRole('textbox', { name: '상담내용 및 처리결과', exact: true })).toHaveValue('새 상담 내용');
    // 상세 상단 수정과 상담 수정의 이름이 같으므로 상담 기록의 수정 버튼을 고른다.
    await page.getByRole('button', { name: '수정', exact: true }).last().click();
    const edit = page.getByRole('form', { name: '수정', exact: true });
    await edit.getByRole('textbox', { name: '상담내용 및 처리결과', exact: true }).fill('수정 상담 내용');
    await edit.getByRole('button', { name: '저장', exact: true }).click();
    await expectRequests(observed, prefix + ' 등록', prefix + ' 수정');
    await edit.getByRole('button', { name: '취소', exact: true }).click();
    await expect(edit).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: '알림', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('dialog', { name: '알림', exact: true }).getByRole('button', { name: '취소', exact: true }).click();
    await expectRequests(observed, prefix + ' 등록', prefix + ' 수정');
    await page.getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('dialog', { name: '알림', exact: true }).getByRole('button', { name: '확인', exact: true }).click();
    await expectRequests(observed, prefix + ' 등록', prefix + ' 수정', prefix + ' 삭제');
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeVisible();
  });
}

test('@reference ticket test and reissue requests require a printer', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/counsel');
  await page.getByRole('cell', { name: '시나리오 검증용 문의 내용', exact: true }).click();
  await page.getByRole('button', { name: '티켓재발권', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '티켓재발권', exact: true });
  await expect(dialog.getByRole('button', { name: '테스트 발권', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: '발권 시작하기', exact: true })).toBeDisabled();
  expect(observed.logs).toEqual([]);
  await choose(page, '스마트프린터 선택', '참고 프린터');
  await dialog.getByRole('button', { name: '테스트 발권', exact: true }).click();
  await expectRequests(observed, '티켓 테스트 발권');
  await dialog.getByRole('button', { name: '발권 시작하기', exact: true }).click();
  await expectRequests(observed, '티켓 테스트 발권', '티켓 재발권');
  await expect(dialog).toBeVisible();
});

test('@reference appeal save and notification use distinct confirmed inputs', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/appeals/appeal-1');
  await choose(page, '소명결과', '거절');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(observed.logs).toEqual([]);
  await choose(page, '소명결과', '완료');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expectRequests(observed, '소명 처리 저장');
  await page.getByRole('button', { name: '회원에게 결과 통보하기', exact: true }).click();
  const notice = page.getByRole('dialog', { name: '회원에게 결과 통보하기', exact: true });
  await notice.getByRole('button', { name: '보내기', exact: true }).click();
  await page.getByRole('dialog', { name: '알림', exact: true }).getByRole('button', { name: '취소', exact: true }).click();
  await expectRequests(observed, '소명 처리 저장');
  await notice.getByRole('button', { name: '보내기', exact: true }).click();
  await page.getByRole('dialog', { name: '알림', exact: true }).getByRole('button', { name: '확인', exact: true }).click();
  await expectRequests(observed, '소명 처리 저장', '소명 결과 통보');
  await expect(notice).toBeVisible();
});

test('@reference appeal bulk change validates selected members', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/appeals');
  await choose(page, '계정 상태', '일반회원');
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  expect(observed.logs).toEqual([]);
  await page.getByRole('row').nth(1).getByRole('checkbox').check();
  await page.getByRole('button', { name: '변경', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expectRequests(observed, '소명 회원 일괄변경');
});

test('@reference member create reaches its request without clearing private input', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/new');
  const save = page.getByRole('button', { name: '저장', exact: true });
  await save.click();
  await expect(page.getByRole('alert')).toHaveCount(5);
  expect(observed.logs).toEqual([]);
  await page.getByRole('textbox', { name: '이메일', exact: true }).fill('reference@example.com');
  await page.getByLabel('비밀번호*', { exact: true }).fill('Rt7!vK9@q');
  await page.getByRole('textbox', { name: '이름', exact: true }).fill('검증회원');
  await page.getByRole('textbox', { name: '휴대폰번호', exact: true }).fill('010-0000-0000');
  await page.getByRole('group', { name: '생년월일' }).locator('[data-today] button').click();
  await save.click();
  await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
  expect(observed.logs).toEqual([]);
  await save.click();
  await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
  await expectRequests(observed, '회원 등록');
  await expect(page.getByLabel('비밀번호*', { exact: true })).toHaveValue('Rt7!vK9@q');
});

test('@reference shell search and profile expose their unconnected destinations', async ({ page }) => {
  const observed = observeRequests(page);
  await page.goto('/members/active/all');
  const header = page.getByRole('banner');
  await header.getByRole('textbox', { name: '통합검색' }).fill('검색어를 콘솔에 출력하지 않음');
  await header.getByRole('button', { name: '검색', exact: true }).click();
  await expect.poll(() => observed.logs).toEqual(['[시나리오] 통합검색: 검색 입력 수신 → API·결과 화면 연결 대기']);
  await header.locator('summary').filter({ hasText: '내 정보' }).click();
  await header.getByRole('button', { name: '내 정보', exact: true }).click();
  await expect.poll(() => observed.logs).toEqual([
    '[시나리오] 통합검색: 검색 입력 수신 → API·결과 화면 연결 대기',
    '[시나리오] 내 정보 이동: 진입 요청 확인 → 대상 화면 연결 대기',
  ]);
  expect(observed.writes).toEqual([]);
  await expect(page).toHaveURL(/members\/active\/all$/);
  await expect(header.getByRole('textbox', { name: '통합검색' })).toHaveValue('검색어를 콘솔에 출력하지 않음');
});
