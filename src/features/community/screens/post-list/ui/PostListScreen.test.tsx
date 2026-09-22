import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { PostListSearch } from '../model/post-list-search';
import { PostListScreen } from './PostListScreen';

/** route 가 넘기는 것은 sparse search 와 이동 callback 이다. 해소·업무 실행은 화면이 한다. */
function renderScreen(sparse: PostListSearch = {}) {
  const onSearchChange = vi.fn();
  const onActivate = vi.fn();
  const onCreate = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PostListScreen
        search={sparse}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        onCreate={onCreate}
      />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, onActivate, onCreate };
}

const firstRowTitle = 'Reference 비회원도 읽는 글';

describe('PostListScreen (9.2 게시물 목록)', () => {
  it('조회를 기다리지 않고 진입 즉시 결과를 그린다', async () => {
    renderScreen();

    expect(await screen.findByRole('cell', { name: firstRowTitle })).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 7')).toBeInTheDocument();
  });

  it('Figma 9.2.1 table 의 컬럼을 순서대로 노출하고 행 checkbox 를 준다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      '',
      '구분',
      '게시판',
      '카테고리',
      '제목',
      '내용',
      '회원유형/회원등급',
      '작성자',
      '좋아요',
      '싫어요',
      '평점',
      '댓글',
      '조회수',
      '답변상태',
      '게시상태',
      '등록일/최근업데이트일',
    ]);
    expect(
      within(screen.getByRole('table')).getByRole('checkbox', { name: `${firstRowTitle} 선택` }),
    ).toBeInTheDocument();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에 표시되고 최신 게시물이 첫 행이다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    const sorted = screen
      .getAllByRole('columnheader')
      .filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    expect(sorted[0]).toHaveAccessibleName('등록일/최근업데이트일');
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByRole('cell', { name: firstRowTitle })).toBeInTheDocument();
  });

  it('활성 정렬 헤더를 누르면 방향만 바뀐 검색으로 나간다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(screen.getByRole('button', { name: '등록일/최근업데이트일' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ sortDirection: 'asc' });
  });

  it('frame 의 표시 형식대로 빈 값·마스킹·회원유형·두 일시를 그린다', async () => {
    renderScreen({ keywords: [{ field: 'content', value: '회원님 안녕하세요' }] });

    const row = (await screen.findByRole('cell', { name: 'Reference 김담당(reference-manager)' }))
      .closest('tr')!;
    // 제목·카테고리가 없는 행은 `-` 로 그린다.
    expect(within(row).getAllByRole('cell', { name: '-' }).length).toBeGreaterThanOrEqual(2);
    // 운영자 행은 등급이 없어 유형 하나만 그린다.
    expect(within(row).getByRole('cell', { name: '운영자' })).toBeInTheDocument();
    // 두 일시를 한 셀에 쌓아 그린다(각각 block span).
    expect(
      within(row).getByRole('cell', { name: /^2026-06-02 .+2026-06-02 .+$/ }),
    ).toBeInTheDocument();
  });

  it('APP 회원 행의 작성자 이메일은 마스킹해 그린다 — CONTACT-MASKING', async () => {
    renderScreen({ keywords: [{ field: 'title', value: '비회원도' }] });

    expect(
      await screen.findByRole('cell', { name: 'Reference 이땡땡(refe*******@example.test)' }),
    ).toBeInTheDocument();
  });

  it('검색을 제출하면 입력한 조건이 첫 페이지로 커밋된다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: '공지' },
    });
    // 빈 배열이 `전체` 이므로 남길 값만 두고 나머지를 해제한다.
    const answer = screen.getByRole('group', { name: '답변상태' });
    fireEvent.click(within(answer).getByRole('checkbox', { name: '검토중' }));
    fireEvent.click(within(answer).getByRole('checkbox', { name: '완료' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({
        keywords: [{ field: 'content', value: '공지' }],
        answerStatuses: ['PENDING'],
      });
    });
  });

  it('게시판은 서버가 준 선택지에서 하나를 고르고 전체로 되돌리면 조건이 사라진다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    await chooseOptionIn('게시판', 'Reference Board 5');
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ boardId: 'reference-board-5' });
    });

    onSearchChange.mockClear();
    await chooseOptionIn('게시판', '전체');
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({});
    });
  });

  it('초기화는 조건을 비운 URL 로 나가고 검색 전 표식을 만들지 않는다', async () => {
    const { onSearchChange } = renderScreen({ statuses: ['NOT_IN_USE'] });
    await screen.findByRole('cell', { name: 'Reference 게시안함 공지' });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ keywords: [{ field: 'title', value: '없는 제목' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('행을 클릭하면 그 게시물의 조회로 나간다 — 원문 `특정 행 클릭시, 조회 화면으로 이동`', async () => {
    const { onActivate } = renderScreen();
    const cell = await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(cell);

    expect(onActivate).toHaveBeenCalledWith('reference-post-7');
  });

  it('toolbar 우측의 등록을 누르면 등록 화면으로 나간다 — 원문 `등록 버튼 → 등록 화면으로 이동`', async () => {
    const { onCreate, onActivate } = renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('미선택 상태의 변경은 원문 Case01 오류 alert 만 연다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('선택 + 값 + 확인 → 요청 함수 → 완료 alert, 확인하면 선택이 풀린다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowTitle} 선택` }));
    await chooseOptionIn('일괄변경 항목', '게시안함');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('변경되었습니다.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 게시물 일괄 상태 변경'));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: `${firstRowTitle} 선택` })).not.toBeChecked();
    log.mockRestore();
  });

  it('확인 alert 에서 취소하면 요청이 나가지 않고 선택이 남는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowTitle });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowTitle} 선택` }));
    await chooseOptionIn('일괄변경 항목', '게시');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(log).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: `${firstRowTitle} 선택` })).toBeChecked();
    log.mockRestore();
  });
});
