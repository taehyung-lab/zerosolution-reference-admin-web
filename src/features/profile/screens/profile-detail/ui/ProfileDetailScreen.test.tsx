import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { ProfileDetailScreen } from './ProfileDetailScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup() {
  const onEdit = vi.fn();
  const onWithdrawn = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <ProfileDetailScreen onEdit={onEdit} onWithdrawn={onWithdrawn} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onWithdrawn };
}

describe('ProfileDetailScreen (13.1 내정보 조회)', () => {
  it('내 계정 항목을 마스킹 없이 보여 주고 비밀번호 자리에는 변경 버튼을 둔다', async () => {
    setup();

    expect(await screen.findByText('example-operator')).toBeInTheDocument();
    expect(screen.getByText('010-0000-0000')).toBeInTheDocument();
    expect(screen.getByText('operator@example.com')).toBeInTheDocument();
    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeInTheDocument();
  });

  it('수정 버튼은 수정 화면으로 보낸다', async () => {
    const { onEdit } = setup();
    fireEvent.click(await screen.findByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('비밀번호 변경은 확인 불일치를 막고, 일치하면 요청 뒤 완료 alert 를 띄운 채 화면에 남는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onWithdrawn } = setup();
    fireEvent.click(await screen.findByRole('button', { name: '비밀번호 변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('변경할 비밀번호를 입력해주세요.');
    fireEvent.change(within(dialog).getByLabelText('비밀번호*'), { target: { value: 'Qw9!zXr2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));
    expect(await screen.findByText('필수 항목을 입력해주세요.')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('비밀번호 확인*'), { target: { value: 'Qw9!zXr3' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));
    expect(await screen.findByText('비밀번호와 동일하게 입력해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('비밀번호 확인*'), { target: { value: 'Qw9!zXr2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    const done = await screen.findByText('비밀번호가 변경되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 내정보 비밀번호 변경'));
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('Qw9!zXr2'));
    fireEvent.click(within(done.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByText('비밀번호가 변경되었습니다.')).toBeNull());
    expect(onWithdrawn).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('탈퇴는 비밀번호를 받아 요청하고 완료 확인이 로그인 화면으로 보낸다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onWithdrawn } = setup();
    fireEvent.click(await screen.findByRole('button', { name: '탈퇴' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('탈퇴 후 즉시 탈퇴가 진행되며 복원할 수 없습니다.');
    expect(within(dialog).queryByLabelText('비밀번호 확인*')).toBeNull();

    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));
    expect(await screen.findByText('필수 항목을 입력해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('비밀번호*'), { target: { value: 'current-secret' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    const done = await screen.findByText('탈퇴가 완료되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 내정보 탈퇴'));
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('current-secret'));
    fireEvent.click(within(done.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onWithdrawn).toHaveBeenCalledTimes(1));
    log.mockRestore();
  });

  it('탈퇴 alert 의 취소는 아무것도 부르지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onWithdrawn } = setup();
    fireEvent.click(await screen.findByRole('button', { name: '탈퇴' }));

    const dialog = await screen.findByRole('dialog');
    // 다이얼로그의 닫기(×)와 폼의 취소가 같은 라벨을 쓴다. 폼 쪽을 누른다.
    const cancels = within(dialog).getAllByRole('button', { name: '취소' });
    fireEvent.click(cancels[cancels.length - 1]!);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).not.toHaveBeenCalled();
    expect(onWithdrawn).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
