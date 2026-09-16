import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { AppealDetailScreen } from './AppealDetailScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(appealId = 'appeal-1') {
  const onMessage = vi.fn();
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <AppealDetailScreen appealId={appealId} memberHref={(memberId) => `/members/${memberId}`} onMessage={onMessage} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onMessage, log };
}

describe('AppealDetailScreen (4.7.1 소명신청 조회)', () => {
  it('거절 결과는 사유를 요구하고, 완료 결과는 저장 확인 없이 요청 함수에 닿는다', async () => {
    const { log, onMessage } = renderScreen();
    expect(await screen.findByRole('link', { name: '회원정보 조회' })).toHaveAttribute('href', '/members/example-flagged');
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledWith('sms');

    await chooseOptionIn('소명결과', '거절');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('필수 항목을 입력해주세요.');
    expect(log).not.toHaveBeenCalled();

    await chooseOptionIn('소명결과', '완료');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 소명 처리 저장')));
    log.mockRestore();
  });

  it('통보는 저장된 결과를 미리 보여 주고 확인을 지나 요청 함수에 닿으며 작성 중인 초안은 남는다', async () => {
    const { log } = renderScreen();
    await screen.findByRole('link', { name: '회원정보 조회' });
    fireEvent.change(screen.getByRole('textbox', { name: '담당자 의견' }), { target: { value: '보존할 처리 초안' } });

    fireEvent.click(screen.getByRole('button', { name: '회원에게 결과 통보하기' }));
    const notice = screen.getByRole('dialog', { name: '회원에게 결과 통보하기' });
    expect(notice).toHaveTextContent('완료');
    expect(within(notice).queryByRole('combobox')).toBeNull();
    fireEvent.click(within(notice).getByRole('button', { name: '보내기' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '취소' }));
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(within(notice).getByRole('button', { name: '보내기' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: '알림' })).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 소명 결과 통보')));
    fireEvent.click(within(notice).getAllByRole('button', { name: '취소' }).at(-1)!);
    expect(screen.getByRole('textbox', { name: '담당자 의견' })).toHaveValue('보존할 처리 초안');
    log.mockRestore();
  });

  it('없는 ID 는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-appeal');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
  });
});
