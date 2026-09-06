import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestLocaleProvider } from '@/test/locale';
import { ManagerDetailContent } from './ManagerDetailScreen';
import type { ManagerAccountStatus } from './manager-detail-actions';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/edit">{children}</a>,
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(accountStatus: ManagerAccountStatus) {
  const onActionRequest = vi.fn();
  render(
    <TestLocaleProvider>
      <ManagerDetailContent
        manager={{ id: 'example', name: 'Example' }}
        managerId="example"
        accountStatus={accountStatus}
        onActionRequest={onActionRequest}
      />
    </TestLocaleProvider>,
  );
  return onActionRequest;
}

describe('manager detail input boundaries', () => {
  it('masks only reference email and phone before operator verification', () => {
    render(<TestLocaleProvider><ManagerDetailContent managerId="example" accountStatus="active"
      manager={{ name: 'Jane', phone: '010-1234-5678', email: 'operator@example.com' }} onActionRequest={vi.fn()} /></TestLocaleProvider>);
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('010-****-5678')).toBeInTheDocument();
    expect(screen.getByText('oper****@example.com')).toBeInTheDocument();
    expect(screen.queryByText('operator@example.com')).not.toBeInTheDocument();
  });
  it.each(['active', 'locked'] as const)('reports initial confirmation blur mismatch and accepts one corrected submit: %s', async (status) => {
    const onActionRequest = setup(status);
    fireEvent.click(screen.getByRole('button', { name: status === 'active' ? '비밀번호 변경' : '잠금해제' }));
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'Safe!729' } });
    const confirmation = screen.getByLabelText('비밀번호 확인*');
    fireEvent.change(confirmation, { target: { value: 'wrong' } });
    fireEvent.blur(confirmation);
    expect(await screen.findByRole('alert')).toHaveTextContent('일치');
    fireEvent.change(confirmation, { target: { value: 'Safe!729' } });
    fireEvent.submit(confirmation.closest('form')!);
    await vi.waitFor(() => expect(onActionRequest).toHaveBeenCalledOnce());
  });
  it.each(['awaiting', 'rejected'] as const)(
    'disables password and omits edit for %s',
    (status) => {
      setup(status);
      expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeDisabled();
      expect(screen.queryByRole('link', { name: '수정' })).not.toBeInTheDocument();
    },
  );

  it.each([
    ['awaiting', '승인', '가입 승인하기', 'approve'],
    ['rejected', '삭제', '확인', 'delete'],
    ['active', '비활성화', '확인', 'deactivate'],
    ['inactive', '활성', '확인', 'activate'],
  ] as const)(
    'confirms %s action without changing the record',
    (status, label, confirmLabel, type) => {
      const onActionRequest = setup(status);
      fireEvent.click(screen.getByRole('button', { name: label }));
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: '취소',
        }),
      );
      expect(onActionRequest).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: label }));
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: confirmLabel,
        }),
      );
      expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
        type,
        managerId: 'example',
      });
    },
  );

  it('validates unlock password and confirmation without fabricating activation', async () => {
    const onActionRequest = setup('locked');
    fireEvent.click(screen.getByRole('button', { name: '잠금해제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('비밀번호*'), {
      target: { value: 'Safe!729' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호 확인*'), {
      target: { value: 'Safe!729' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await vi.waitFor(() =>
      expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
        type: 'unlock',
        managerId: 'example',
        password: 'Safe!729',
      }),
    );
    expect(screen.getByRole('dialog', { name: '잠금해제' })).toBeInTheDocument();
  });

  it('protects rejection input on cancel and sends only the reason', async () => {
    const onActionRequest = setup('awaiting');
    fireEvent.click(screen.getByRole('button', { name: '거절' }));
    fireEvent.change(screen.getByLabelText('승인거절 사유*'), {
      target: { value: 'Review needed' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getAllByRole('button', {
        name: '취소',
      })[1]!,
    );
    const question = screen.getByRole('dialog', { name: '알림' });
    fireEvent.click(within(question).getByRole('button', { name: '취소' }));
    expect(screen.getByLabelText('승인거절 사유*')).toHaveValue('Review needed');
    fireEvent.click(screen.getByRole('button', { name: '가입 거절하기' }));
    await vi.waitFor(() =>
      expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
        type: 'reject',
        managerId: 'example',
        reason: 'Review needed',
      }),
    );
  });

  it('stops withdrawal at operator verification and retains values', async () => {
    const onActionRequest = setup('active');
    fireEvent.click(screen.getByRole('button', { name: '탈퇴' }));
    fireEvent.change(screen.getByLabelText('탈퇴 사유*'), {
      target: { value: 'Requested withdrawal' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호*'), {
      target: { value: 'operator-secret' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await vi.waitFor(() =>
      expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
        type: 'verifyWithdrawal',
        managerId: 'example',
        reason: 'Requested withdrawal',
        operatorPassword: 'operator-secret',
      }),
    );
    expect(screen.getByLabelText('탈퇴 사유*')).toHaveValue('Requested withdrawal');
    expect(screen.queryByText(/복원 할 수 없습니다/)).not.toBeInTheDocument();
  });
});
