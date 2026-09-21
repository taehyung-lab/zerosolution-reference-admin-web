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
    .getByRole('form', { name: '검색', exact: true })
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

  // 기본 정렬(등록일 desc)은 첫 렌더부터 방향을 표시한다(2026-09-11 사용자 확정, 목록 공통).
  const header = page.getByRole('columnheader', { name: '등록일', exact: true });
  await expect(header).toHaveAttribute('aria-sort', 'descending');

  await header.getByRole('button').click();
  await expect(page).toHaveURL(/sortDirection=asc/);
  await expect(header).toHaveAttribute('aria-sort', 'ascending');

  await header.getByRole('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await expect(page).not.toHaveURL(/sortDirection=/);

  // 다른 컬럼을 고르면 정렬 키만 바뀌고 방향은 유지된다(활성 헤더 클릭만 방향을 뒤집는다).
  const other = page.getByRole('columnheader', { name: '게시물수', exact: true });
  await other.getByRole('button').click();
  await expect(other).toHaveAttribute('aria-sort', 'descending');
  await expect(page).toHaveURL(/sortType=postCount/);
  await expect(header).not.toHaveAttribute('aria-sort', /.*/);
});

test('@smoke 행 → 조회 → 수정 이동 뒤 저장이 요청 로그까지 간다', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (message) => logs.push(message.text()));
  await page.goto('/community/boards');

  await page.getByRole('cell', { name: 'Reference Board 1', exact: true }).click();

  await expect(page).toHaveURL(/\/community\/boards\/reference-board-1$/);
  await expect(page.getByRole('heading', { name: '게시판 조회' })).toBeVisible();
  await expect(page.getByText('기본정보')).toBeVisible();
  await expect(page.getByText('업데이트 내역')).toBeVisible();
  // Figma 9.1.2: 카테고리 옆 `카테고리 설정` 버튼이 팝업을 연다.
  await expect(page.getByRole('button', { name: '카테고리 설정' })).toBeVisible();

  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page).toHaveURL(/\/community\/boards\/reference-board-1\/edit$/);
  await expect(page.getByRole('heading', { name: '게시판 수정' })).toBeVisible();
  await expect(page.getByLabel('게시판명*')).toHaveValue('Reference Board 1');

  await page.getByLabel('게시판명*').fill('Reference Board 1 수정');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장하시겠습니까?')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect
    .poll(() => logs.filter((line) => line.includes('[시나리오] 게시판 수정')).length)
    .toBe(1);
  // 미연결 저장도 실서버와 같은 성공 경로를 돈다: 저장 완료 alert → 조회로 이동.
  await expect(page.getByText('저장되었습니다.')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page).toHaveURL(/\/community\/boards\/reference-board-1$/);
});

test('@smoke 카테고리 설정은 키보드 드래그로 순서를 바꾸고 dirty 닫기를 보호한다', async ({ page }) => {
  await page.goto('/community/boards/reference-board-1');
  await page.getByRole('button', { name: '카테고리 설정' }).click();

  const dialog = page.getByRole('dialog', { name: '카테고리 설정' });
  const firstName = dialog.getByRole('textbox', { name: '1번 카테고리명' });
  const secondName = dialog.getByRole('textbox', { name: '2번 카테고리명' });
  await expect(firstName).toHaveValue('회원가입');
  await expect(secondName).toHaveValue('티켓인증');

  const handle = dialog.getByRole('button', { name: '1번 순서 이동' });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toContainText('회원가입 항목을 들었습니다.');
  await expect(page.getByRole('status')).not.toContainText('reference-board-1-category-1');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(dialog.getByRole('textbox', { name: '1번 카테고리명' })).toHaveValue('티켓인증');
  await expect(dialog.getByRole('textbox', { name: '2번 카테고리명' })).toHaveValue('회원가입');

  await dialog.getByRole('button', { name: '닫기' }).click();
  const alert = page.getByRole('dialog', { name: '알림' });
  await expect(alert).toContainText('취소할 경우 입력된 정보는 모두 삭제됩니다.');
  await alert.getByRole('button', { name: '취소' }).click();
  await expect(dialog).toBeVisible();
});

test('@smoke 조회의 삭제는 확인 alert 를 거쳐 요청 로그까지 간다', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (message) => logs.push(message.text()));
  await page.goto('/community/boards/reference-board-1');

  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByText('삭제하시겠습니까?')).toBeVisible();
  expect(logs.filter((line) => line.includes('게시판 삭제'))).toHaveLength(0);

  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect
    .poll(() => logs.filter((line) => line.includes('[시나리오] 게시판 삭제')).length)
    .toBe(1);
});

test('@smoke 등록은 검증·저장 확인을 거쳐 요청 로그까지 간다', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (message) => logs.push(message.text()));
  await page.goto('/community/boards');

  await page.getByRole('button', { name: '등록', exact: true }).click();
  await expect(page).toHaveURL(/\/community\/boards\/new$/);
  await expect(page.getByRole('heading', { name: '게시판 등록' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '구분' })).toContainText('일반');

  // 미입력 저장은 확인창을 열지 않는다.
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByText('저장하시겠습니까?')).toBeHidden();

  // Figma 9.1.3: 하위 항목은 상위가 켤 때까지 비활성이다.
  await expect(page.getByLabel('파일첨부 용량제한*')).toBeDisabled();
  await expect(page.getByRole('combobox', { name: '팝업' })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: '비밀댓글' })).toBeDisabled();

  await page.getByLabel('게시판명*').fill('스모크 게시판');
  await page.getByRole('combobox', { name: '쓰기', exact: true }).click();
  await page.getByRole('option', { name: '운영자' }).click();
  await page.getByRole('combobox', { name: '읽기', exact: true }).click();
  await page.getByRole('option', { name: '전체회원' }).click();
  await page.getByRole('combobox', { name: '게시글 제목 지정' }).click();
  await page.getByRole('option', { name: '작성자가 직접입력' }).click();
  await page.getByRole('button', { name: '저장', exact: true }).click();

  await expect(page.getByText('저장하시겠습니까?')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect
    .poll(() => logs.filter((line) => line.includes('[시나리오] 게시판 등록')).length)
    .toBe(1);
  await expect(page.getByText('저장되었습니다.')).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page).toHaveURL(/\/community\/boards$/);
});

test('@smoke 등록 중 취소는 이탈 확인을 거치고 유지하면 입력이 남는다', async ({ page }) => {
  await page.goto('/community/boards/new');
  await page.getByLabel('게시판명*').fill('취소 확인용');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  // 99-cross-screen 21행(커뮤니티 > 게시판 포함): 취소할 경우 입력된 정보는 모두 삭제됩니다.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('취소할 경우 입력된 정보는 모두 삭제됩니다.');
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('게시판명*')).toHaveValue('취소 확인용');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/community\/boards$/);
});

test('@smoke 일치하는 결과가 없으면 원문 안내 문구를 보여 준다', async ({ page }) => {
  await page.goto('/community/boards');

  await page.getByRole('textbox', { name: '검색어', exact: true }).fill('No Such Board');
  await page
    .getByRole('form', { name: '검색', exact: true })
    .getByRole('button', { name: '검색', exact: true })
    .click();

  await expect(page.getByText('일치하는 검색결과가 없습니다.')).toBeVisible();
  await expect(page.getByText('검색결과 : 0')).toBeVisible();
});
