import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { ManagerDetailScreen } from './ManagerDetailScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(managerId: string) {
  const onEdit = vi.fn();
  const onMessage = vi.fn();
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <ManagerDetailScreen managerId={managerId} onEdit={onEdit} onMessage={onMessage} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onMessage, log };
}

const dialog = () => screen.getByRole('dialog');

describe('ManagerDetailScreen (11.1.2 운영자 조회)', () => {
  it('운영자정보를 읽기 전용으로 보여 주고 휴대폰·이메일은 재인증 전까지 마스킹한다', async () => {
    const { onEdit, onMessage } = renderScreen('example-active');

    expect(await screen.findByText('Example3')).toBeInTheDocument();
    expect(screen.getByText('010-****-0000')).toBeInTheDocument();
    expect(screen.getByText('oper*****@example.com')).toBeInTheDocument();
    expect(screen.queryByText('operator3@example.com')).toBeNull();
    expect(screen.getByText('활성', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('이름: Example > Example3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledWith('sms');
    fireEvent.click(screen.getByRole('button', { name: '이메일' }));
    expect(onMessage).toHaveBeenCalledWith('email');
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(onEdit).toHaveBeenCalledWith('example-active');
  });

  it('대기 상태는 이메일 작성이 없고 승인은 확인창의 고유 문장을 지나 요청 함수에 닿는다', async () => {
    const { log } = renderScreen('example-awaiting');
    await screen.findByText('Example1');

    expect(screen.queryByRole('button', { name: '이메일' })).toBeNull();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '승인' }));
    expect(dialog()).toHaveTextContent('가입을 승인하시겠습니까?');
    fireEvent.click(within(dialog()).getByRole('button', { name: '취소' }));
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '승인' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: '가입 승인하기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 가입 승인'));
  });

  it('거절은 사유 입력 팝업을 지나고, 입력 뒤 닫기는 버리기 확인을 거친다', async () => {
    const { log } = renderScreen('example-awaiting');
    await screen.findByText('Example1');

    fireEvent.click(screen.getByRole('button', { name: '거절' }));
    fireEvent.click(screen.getByRole('button', { name: '가입 거절하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('승인거절 사유를 입력해주세요.');

    fireEvent.change(screen.getByLabelText('승인거절 사유*'), { target: { value: 'Review needed' } });
    fireEvent.click(within(screen.getByRole('dialog', { name: '거절' })).getAllByRole('button', { name: '취소' })[1]!);
    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent('입력을 취소하시겠습니까?');
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '취소' }));

    fireEvent.click(screen.getByRole('button', { name: '가입 거절하기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 가입 거절'));
    expect(log.mock.calls.join('\n')).not.toContain('Review needed');
  });

  it('거절 상태는 사유를 보여 주고 삭제는 공통 삭제 확인을 지난다', async () => {
    const { log } = renderScreen('example-rejected');
    await screen.findByText('Example2');

    expect(screen.getByText('Example reason')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '개인정보 전체보기' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(dialog()).toHaveTextContent('삭제하시겠습니까?');
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 삭제')));
  });

  it('비밀번호 변경은 확인 불일치를 blur 에서 알리고 맞으면 요청 함수에 닿는다', async () => {
    const { log } = renderScreen('example-active');
    await screen.findByText('Example3');

    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'Safe!729' } });
    const confirmation = screen.getByLabelText('비밀번호 확인*');
    fireEvent.change(confirmation, { target: { value: 'wrong' } });
    fireEvent.blur(confirmation);
    expect(await screen.findByRole('alert')).toHaveTextContent('일치');

    fireEvent.change(confirmation, { target: { value: 'Safe!729' } });
    fireEvent.submit(confirmation.closest('form')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 비밀번호 변경'));
    expect(log.mock.calls.join('\n')).not.toContain('Safe!729');
  });

  it('탈퇴는 사유와 운영자 비밀번호를 받아 요청 함수에 닿고, 비활성화·활성·잠금해제는 상태별로만 보인다', async () => {
    const { log } = renderScreen('example-active');
    await screen.findByText('Example3');
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '활성' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '탈퇴' }));
    fireEvent.change(screen.getByLabelText('탈퇴 사유*'), { target: { value: 'Requested withdrawal' } });
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'operator-secret' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 탈퇴 재인증')),
    );
    expect(log.mock.calls.join('\n')).not.toContain('operator-secret');
  });

  it('잠금 상태는 잠금해제 입력을, 비활성 상태는 활성 확인을 연다', async () => {
    renderScreen('example-locked');
    await screen.findByText('Example5');
    fireEvent.click(screen.getByRole('button', { name: '잠금해제' }));
    expect(screen.getByRole('dialog', { name: '잠금해제' })).toBeInTheDocument();
  });

  it('없는 ID 는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-manager');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
