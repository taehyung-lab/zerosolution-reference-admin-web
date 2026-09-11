import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { BoardCreateScreen } from './BoardCreateScreen';

let guardDisabled = true;
vi.mock('@tanstack/react-router', () => ({
  useBlocker: (options: { disabled: boolean }) => {
    guardDisabled = options.disabled;
    return { status: 'idle' };
  },
}));

afterEach(() => {
  guardDisabled = true;
});

function setup() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestLocaleProvider>
      <BoardCreateScreen onConfirm={onConfirm} onCancel={onCancel} />
    </TestLocaleProvider>,
  );
  return { onConfirm, onCancel };
}

async function chooseWritePermission() {
  fireEvent.click(screen.getByRole('combobox', { name: '쓰기 권한' }));
  fireEvent.click(await screen.findByRole('option', { name: '운영자' }));
}

describe('board create before API', () => {
  it('원문이 열거한 세 필드만 그리고 구분 기본값은 일반이다', () => {
    setup();

    expect(screen.getByRole('combobox', { name: '구분' })).toHaveTextContent('일반');
    expect(screen.getByLabelText('게시판명*')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '쓰기 권한' })).toBeInTheDocument();
    // 원문 등록 절에 없는 입력은 만들지 않았다(판정 문서 질문 29).
    expect(screen.queryByRole('combobox', { name: '읽기 권한' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: '사용상태' })).toBeNull();
  });

  it('필수 입력이 비면 저장이 확인창까지 가지 않고 첫 오류로 포커스가 간다', async () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByLabelText('게시판명*')).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('유효한 입력은 저장 확인을 거쳐야 업무 요청에 닿는다', async () => {
    const { onConfirm } = setup();

    fireEvent.change(screen.getByLabelText('게시판명*'), { target: { value: '공지 게시판' } });
    await chooseWritePermission();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장하시겠습니까?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledWith({
      category: 'GENERAL',
      name: '공지 게시판',
      writePermission: 'MANAGER',
    });
  });

  it('입력이 있으면 이탈 보호가 켜지고 취소는 guard 를 거친다', async () => {
    const { onCancel } = setup();
    expect(guardDisabled).toBe(true);

    fireEvent.change(screen.getByLabelText('게시판명*'), { target: { value: '공지 게시판' } });
    await waitFor(() => expect(guardDisabled).toBe(false));

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
