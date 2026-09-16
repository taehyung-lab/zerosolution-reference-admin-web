import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { MemberCreateScreen } from './MemberCreateScreen';

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
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <MemberCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillAll() {
  fill('이메일*', 'member@example.com');
  fill('비밀번호*', 'Safe!729');
  fill('이름*', '김회원');
  fill('휴대폰번호*', '010-1234-5678');
  const today = screen.getByRole('group', { name: '생년월일' }).querySelector<HTMLButtonElement>('[data-today] button');
  if (today === null) throw new Error('Today must be selectable');
  fireEvent.click(today);
}

describe('MemberCreateScreen (4.2.2 회원 등록)', () => {
  it('빈 저장은 다섯 오류를 알리고 첫 필드(이메일)로 포커스가 가며 확인창을 열지 않는다', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByLabelText('이메일*')).toHaveFocus());
    expect(screen.getAllByRole('alert')).toHaveLength(5);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('유효한 입력은 저장 확인 → 요청 함수 → 저장 완료 → 목록 이동으로 이어지며 비밀번호는 로그에 없다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    fillAll();
    await waitFor(() => expect(guardDisabled).toBe(false));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const confirm = await screen.findByRole('dialog');
    expect(confirm).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(confirm).getByRole('button', { name: '취소' }));
    expect(log).not.toHaveBeenCalled();
    expect(screen.getByLabelText('이메일*')).toHaveValue('member@example.com');

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));
    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 등록'));
    expect(log.mock.calls.join('\n')).not.toContain('Safe!729');
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    log.mockRestore();
  });

  it('입력이 없으면 취소가 바로 나가고, 기본값으로 되돌린 입력은 보호하지 않는다', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledOnce();

    fill('이메일*', 'a');
    expect(guardDisabled).toBe(false);
    fill('이메일*', '');
    expect(guardDisabled).toBe(true);
  });
});
