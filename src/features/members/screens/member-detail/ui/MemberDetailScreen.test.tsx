import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOption } from '@/test/select';
import { MemberDetailScreen } from './MemberDetailScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(memberId: string) {
  const onEdit = vi.fn();
  const onMessage = vi.fn();
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <MemberDetailScreen memberId={memberId} onEdit={onEdit} onMessage={onMessage} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onEdit, onMessage, log };
}

const dialog = () => screen.getByRole('dialog');

describe('MemberDetailScreen (4.2 회원 조회)', () => {
  it('회원정보를 마스킹해 보여 주고 수정·SMS·이메일은 밖으로 나간다', async () => {
    const { onEdit, onMessage } = renderScreen('example-flagged');
    expect(await screen.findByText('flag***@example.test')).toBeInTheDocument();
    expect(screen.getByText('010-****-5000')).toBeInTheDocument();
    expect(screen.getByText('1:1문의')).toBeInTheDocument();
    expect(screen.queryByText('flagged@example.test')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledWith('sms');
    fireEvent.click(screen.getAllByRole('button', { name: '수정' })[0]!);
    expect(onEdit).toHaveBeenCalledWith('example-flagged');
  });

  it('비밀번호 변경은 확인 불일치를 blur 에서 알리고 맞으면 요청 함수에 닿으며 비밀번호는 로그에 없다', async () => {
    const { log } = renderScreen('example-general');
    await screen.findByText('gene***@example.test');

    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'Safe!729' } });
    const confirmation = screen.getByLabelText('비밀번호 확인*');
    fireEvent.change(confirmation, { target: { value: 'wrong' } });
    fireEvent.blur(confirmation);
    expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호와 동일하게 입력해주세요.');

    fireEvent.change(confirmation, { target: { value: 'Safe!729' } });
    fireEvent.submit(confirmation.closest('form')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 비밀번호 변경'));
    expect(log.mock.calls.join('\n')).not.toContain('Safe!729');
  });

  it('개인정보 전체보기와 회원 탈퇴는 운영자 비밀번호(탈퇴는 5자 사유)를 받아 요청 함수에 닿는다', async () => {
    const { log } = renderScreen('example-general');
    await screen.findByText('gene***@example.test');

    fireEvent.click(screen.getByRole('button', { name: '개인정보 전체보기' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호를 다시 입력해주세요.');
    fireEvent.change(screen.getByLabelText('운영자 비밀번호*'), { target: { value: 'operator-secret' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 개인정보 조회 재인증')));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    fireEvent.change(screen.getByLabelText('탈퇴 사유*'), { target: { value: '짧음' } });
    fireEvent.change(screen.getByLabelText('운영자 비밀번호*'), { target: { value: 'operator-secret' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('사유를 5자 이상 입력해주세요.');
    fireEvent.change(screen.getByLabelText('탈퇴 사유*'), { target: { value: '회원의 요청으로 탈퇴' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 탈퇴 재인증')));
    expect(log.mock.calls.join('\n')).not.toContain('operator-secret');
  });

  it('입력 뒤 닫기는 버리기 확인을 거친다', async () => {
    renderScreen('example-general');
    await screen.findByText('gene***@example.test');
    fireEvent.click(screen.getByRole('button', { name: '개인정보 전체보기' }));
    fireEvent.change(screen.getByLabelText('운영자 비밀번호*'), { target: { value: 'keep' } });
    fireEvent.click(within(screen.getByRole('dialog', { name: '개인정보 전체보기' })).getByRole('button', { name: '취소' }));
    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent('입력을 취소하시겠습니까?');
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('활동정보 선택삭제와 상담 등록은 대상 회원과 함께 요청 함수에 닿는다', async () => {
    const { log } = renderScreen('example-general');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'EXAMPLE-001 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 활동정보 선택삭제')));
    expect(screen.getByRole('cell', { name: 'EXAMPLE-001' })).toBeInTheDocument();

    const create = screen.getByRole('form', { name: '신규 상담 등록' });
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    expect((await within(create).findAllByRole('alert')).length).toBeGreaterThan(0);
    await chooseOption(within(create).getByRole('combobox', { name: '문의유형' }), '예매');
    fireEvent.change(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' }), { target: { value: '새 상담' } });
    fireEvent.click(within(create).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 상세 상담 등록')));
    expect(within(create).getByRole('textbox', { name: '상담내용 및 처리결과' })).toHaveValue('새 상담');
    expect(log.mock.calls.join('\n')).not.toContain('새 상담');
  });

  it('없는 ID 는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-member');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '회원 조회' })).toBeInTheDocument();
  });
});
