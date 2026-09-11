import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BoardListSearch } from '../model/board-list-search';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BoardListScreen } from './BoardListScreen';

/** route 가 넘기는 것은 sparse search 다. 해소는 화면이 한다. */
function renderScreen(sparse: BoardListSearch = {}) {
  const onSearchChange = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BoardListScreen search={sparse} onSearchChange={onSearchChange} />
    </TestQueryLocaleProvider>,
  );
  return onSearchChange;
}

describe('BoardListScreen', () => {
  it('조회를 기다리지 않고 진입 즉시 결과를 그린다', async () => {
    renderScreen();

    expect(await screen.findByRole('cell', { name: 'Reference Board 1' })).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 7')).toBeInTheDocument();
  });

  it('원장 12행의 컬럼을 순서대로 노출하고 행 checkbox 는 만들지 않는다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    // textContent 에는 활성 정렬 헤더의 ▲▼ 글리프가 붙으므로 뺀다.
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      'No.',
      '유형',
      '구분',
      '게시판명',
      '쓰기',
      '읽기',
      '게시물수',
      '게시물',
      '사용상태',
      '등록일',
      '최근업데이트일',
    ]);
    expect(within(screen.getByRole('table')).queryByRole('checkbox')).toBeNull();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에 표시되고 최신 게시판이 첫 행이다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 7' });

    const sorted = screen.getAllByRole('columnheader').filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    expect(sorted[0]).toHaveAccessibleName('등록일');
    // 기본 방향이 undefined 였을 때는 오름차순(Board 1 먼저)이었다. desc 확정으로 최신 등록(2026-05-21)이 먼저다.
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByRole('cell', { name: 'Reference Board 7' })).toBeInTheDocument();
  });

  it('활성 정렬 헤더를 누르면 방향만 바뀐 검색으로 나간다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    fireEvent.click(screen.getByRole('button', { name: '등록일' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    // canonical sparse URL: 기본 정렬 필드와 1페이지는 생략되고 방향만 남는다.
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ sortDirection: 'asc' });
  });

  it('검색을 제출하면 입력한 조건이 첫 페이지로 커밋된다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: 'Board 5' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    // 대상이 하나여도 URL 은 축을 가진 keywords 다.
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({
      keywords: [{ field: 'name', value: 'Board 5' }],
    });
  });

  it('초기화는 조건을 비운 URL 로 나가고 idle 표식을 만들지 않는다', async () => {
    const onSearchChange = renderScreen({ keywords: [{ field: 'name', value: 'Reference' }] });
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ keywords: [{ field: 'name', value: 'No Such Board' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('구분에서 일반을 해제하면 상담만 커밋한다 — 빈 배열이 전체다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    const group = screen.getByRole('group', { name: '구분' });
    fireEvent.click(within(group).getByRole('checkbox', { name: '일반' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toMatchObject({ categories: ['COUNSEL'] });
    });
  });

  it('권한은 한 이름 아래 쓰기·읽기 두 select 이고 합성 라벨을 만들지 않는다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    const group = screen.getByRole('group', { name: '권한' });
    expect(within(group).getAllByRole('combobox')).toHaveLength(2);
    expect(within(group).getByRole('combobox', { name: '쓰기' })).toBeInTheDocument();
    expect(within(group).getByRole('combobox', { name: '읽기' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '권한 쓰기' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: '권한 읽기' })).toBeNull();
  });

  it('권한 쓰기를 고르면 URL 에 남고, 전체로 되돌리면 조건이 사라진다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: 'Reference Board 1' });

    const group = screen.getByRole('group', { name: '권한' });
    fireEvent.click(within(group).getByRole('combobox', { name: '쓰기' }));
    fireEvent.click(await screen.findByRole('option', { name: '운영자' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ writePermission: 'MANAGER' });
    });

    onSearchChange.mockClear();
    fireEvent.click(within(group).getByRole('combobox', { name: '쓰기' }));
    // "전체" 는 UI 전용 값이라 URL·요청으로 나가지 않는다.
    fireEvent.click(await screen.findByRole('option', { name: '전체' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({});
    });
  });

  it('구분 전체를 다시 고르면 조건이 URL 에서 사라진다', async () => {
    const onSearchChange = renderScreen({ categories: ['COUNSEL'] });
    await screen.findByRole('cell', { name: 'Reference Board 5' });

    const group = screen.getByRole('group', { name: '구분' });
    fireEvent.click(within(group).getByRole('checkbox', { name: '전체' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({});
    });
  });
});
