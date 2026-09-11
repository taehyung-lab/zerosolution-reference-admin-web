import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { resolveBoardListSearch } from '../model/board-list-search';
import type { BoardListSearch } from '../model/board-list-search';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BoardListScreen } from './BoardListScreen';

function renderScreen(sparse: BoardListSearch = {}) {
  const onSearchChange = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BoardListScreen search={resolveBoardListSearch(sparse)} onSearchChange={onSearchChange} />
    </TestQueryLocaleProvider>,
  );
  return onSearchChange;
}

describe('BoardListScreen', () => {
  it('조회를 기다리지 않고 진입 즉시 결과를 그린다', async () => {
    renderScreen();

    expect(await screen.findByRole('cell', { name: '공지사항' })).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 7')).toBeInTheDocument();
  });

  it('원장 12행의 컬럼을 순서대로 노출하고 행 checkbox 는 만들지 않는다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: '공지사항' });

    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent?.trim());
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

  it('활성 정렬 헤더를 누르면 방향만 바뀐 검색으로 나간다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: '공지사항' });

    fireEvent.click(screen.getByRole('button', { name: '등록일' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    // canonical sparse URL: 기본 정렬 필드와 1페이지는 생략되고 방향만 남는다.
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ sortDirection: 'asc' });
  });

  it('검색을 제출하면 입력한 조건이 첫 페이지로 커밋된다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: '공지사항' });

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: '상담' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange.mock.calls[0]?.[0]).toEqual({ names: ['상담'] });
  });

  it('초기화는 조건을 비운 URL 로 나가고 idle 표식을 만들지 않는다', async () => {
    const onSearchChange = renderScreen({ names: ['공지'] });
    await screen.findByRole('cell', { name: '공지사항' });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ names: ['없는게시판'] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('구분에서 일반을 해제하면 상담만 커밋한다 — 빈 배열이 전체다', async () => {
    const onSearchChange = renderScreen();
    await screen.findByRole('cell', { name: '공지사항' });

    const group = screen.getByRole('group', { name: '구분' });
    fireEvent.click(within(group).getByRole('checkbox', { name: '일반' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toMatchObject({ categories: ['COUNSEL'] });
    });
  });

  it('구분 전체를 다시 고르면 조건이 URL 에서 사라진다', async () => {
    const onSearchChange = renderScreen({ categories: ['COUNSEL'] });
    await screen.findByRole('cell', { name: '1:1 문의' });

    const group = screen.getByRole('group', { name: '구분' });
    fireEvent.click(within(group).getByRole('checkbox', { name: '전체' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({});
    });
  });
});
