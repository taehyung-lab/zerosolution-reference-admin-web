import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { BoardEditScreen } from './BoardEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(boardId = 'reference-board-2') {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <BoardEditScreen boardId={boardId} onConfirm={onConfirm} onCancel={onCancel} />
    </TestQueryLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

describe('board edit (Figma 9.1.4 수정)', () => {
  it('조회한 게시판의 설정 전부를 초기값으로 싣고 꺼진 하위 항목은 비활성이다', async () => {
    setup();

    expect(await screen.findByDisplayValue('Reference Board 2')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '쓰기' })).toHaveTextContent('운영자');
    expect(screen.getByRole('combobox', { name: '읽기' })).toHaveTextContent('비회원 포함');
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveTextContent('사용안함');
    expect(screen.getByLabelText('파일첨부 용량제한*')).toHaveValue('10');
    expect(screen.getByRole('combobox', { name: '댓글' })).toHaveTextContent('사용안함');
    expect(screen.getByRole('combobox', { name: '비밀댓글' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: '중복 허용' })).toBeDisabled();
  });

  it('저장 확인을 거친 설정이 게시판 ID 와 함께 업무 요청에 닿는다', async () => {
    const { onConfirm } = setup();
    const name = await screen.findByDisplayValue('Reference Board 2');

    fireEvent.change(name, { target: { value: 'Reference Board 2 수정' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith({
      boardId: 'reference-board-2',
      input: expect.objectContaining({
        name: 'Reference Board 2 수정',
        write: { permission: 'MANAGER' },
        attachment: 'IN_USE',
        attachmentLimitMb: 10,
        comment: 'NOT_IN_USE',
      }),
    });
    const request = onConfirm.mock.calls[0]?.[0] as { input: Record<string, unknown> } | undefined;
    expect(request?.input).not.toHaveProperty('secretComment');
  });

  it('게시판명을 비우면 저장이 확인창까지 가지 않는다', async () => {
    const { onConfirm } = setup();
    const name = await screen.findByDisplayValue('Reference Board 2');

    fireEvent.change(name, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByText('저장하시겠습니까?')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('진입 후 없는 게시판은 폼 대신 notFound 로 선다', async () => {
    setup('no-such-board');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });
});
