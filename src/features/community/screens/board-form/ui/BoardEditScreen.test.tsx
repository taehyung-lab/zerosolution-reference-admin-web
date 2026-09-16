import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { BoardEditScreen } from './BoardEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(boardId = 'reference-board-2') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <BoardEditScreen boardId={boardId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
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

  it('저장은 확인을 지나 실행되고, 미연결 실패는 폼 위 문구로 남아 이동하지 않는다', async () => {
    const { onSaved } = setup();
    const name = await screen.findByDisplayValue('Reference Board 2');

    fireEvent.change(name, { target: { value: 'Reference Board 2 수정' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('게시판명을 비우면 저장이 확인창까지 가지 않는다', async () => {
    setup();
    const name = await screen.findByDisplayValue('Reference Board 2');

    fireEvent.change(name, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByText('저장하시겠습니까?')).toBeNull();
  });

  it('진입 후 없는 게시판은 폼 대신 notFound 로 선다', async () => {
    setup('no-such-board');

    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });
});
