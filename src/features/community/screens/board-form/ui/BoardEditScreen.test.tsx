import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BoardEditScreen } from './BoardEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(boardId = 'reference-board-5') {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BoardEditScreen boardId={boardId} onConfirm={onConfirm} onCancel={onCancel} />
    </TestQueryLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

describe('board edit before API', () => {
  it('조회한 게시판의 값을 초기값으로 싣는다', async () => {
    setup();

    expect(await screen.findByDisplayValue('Reference Board 5')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '구분' })).toHaveTextContent('상담');
    expect(screen.getByRole('combobox', { name: '쓰기 권한' })).toHaveTextContent('전체회원');
  });

  it('저장 확인을 거친 입력이 게시판 ID 와 함께 업무 요청에 닿는다', async () => {
    const { onConfirm } = setup();
    const name = await screen.findByDisplayValue('Reference Board 5');

    fireEvent.change(name, { target: { value: 'Reference Board 5 수정' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith({
      boardId: 'reference-board-5',
      input: {
        category: 'COUNSEL',
        name: 'Reference Board 5 수정',
        writePermission: 'ALL_MEMBERS',
      },
    });
  });

  it('게시판명을 비우면 저장이 확인창까지 가지 않는다', async () => {
    const { onConfirm } = setup();
    const name = await screen.findByDisplayValue('Reference Board 5');

    fireEvent.change(name, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByText('저장하시겠습니까?')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('없는 게시판은 폼 대신 notFound 로 선다', async () => {
    setup('no-such-board');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });
});
