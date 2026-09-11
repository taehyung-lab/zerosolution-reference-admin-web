import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BoardDetailScreen } from './BoardDetailScreen';

function renderScreen(boardId = 'reference-board-1') {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BoardDetailScreen boardId={boardId} onEdit={onEdit} onDelete={onDelete} />
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onDelete };
}

describe('BoardDetailScreen', () => {
  it('게시판 레코드 값을 읽기 전용으로 보여 준다', async () => {
    renderScreen();

    await screen.findByText('게시판정보');
    // 원장 12행이 레코드 값으로 열거한 항목이 순서대로 라벨로 나온다.
    expect(screen.getAllByRole('term').map((node) => node.textContent)).toEqual([
      '유형',
      '구분',
      '게시판명',
      '게시물수',
      '쓰기 권한',
      '읽기 권한',
      '사용상태',
      '등록일',
      '최근업데이트일',
    ]);
    expect(screen.getAllByRole('definition')[2]).toHaveTextContent('Reference Board 1');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('업데이트 내역을 3열로 보여 준다', async () => {
    renderScreen();
    await screen.findByText('Reference Board 1');

    expect(screen.getByText('업데이트 내역')).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['업데이트일', '업데이트 사항', '담당자']);
  });

  it('수정 버튼은 그 게시판의 수정 화면으로 나간다', async () => {
    const { onEdit } = renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(onEdit).toHaveBeenCalledWith('reference-board-1');
  });

  it('삭제는 확인 alert 를 거쳐야 업무 요청에 닿는다', async () => {
    const { onDelete } = renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(await screen.findByText('삭제하시겠습니까?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onDelete).toHaveBeenCalledWith('reference-board-1');
  });

  it('삭제 확인을 취소하면 요청이 나가지 않는다', async () => {
    const { onDelete } = renderScreen();
    await screen.findByText('Reference Board 1');

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    fireEvent.click(await screen.findByRole('button', { name: '취소' }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('없는 게시판은 notFound 로 선다', async () => {
    renderScreen('no-such-board');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
