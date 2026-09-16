import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { WithdrawnMemberDetailScreen } from './WithdrawnMemberDetailScreen';

function renderScreen(memberId: string) {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <WithdrawnMemberDetailScreen memberId={memberId} />
    </TestQueryLocaleProvider>,
  );
  return { log };
}

describe('WithdrawnMemberDetailScreen (4.4.1 탈퇴회원 조회)', () => {
  it('탈퇴 정보를 보여 주고 회원 액션은 없으며 활동정보 선택삭제는 대상 회원과 함께 요청 함수에 닿는다', async () => {
    const { log } = renderScreen('withdrawn-1');
    expect(await screen.findByText('Example withdrawal reason')).toBeInTheDocument();
    expect(screen.getByText('refe*****@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '회원 탈퇴' })).toBeNull();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();

    fireEvent.click(await screen.findByRole('checkbox', { name: 'EXAMPLE-001 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 활동정보 선택삭제')));
    expect(screen.getByRole('cell', { name: 'EXAMPLE-001' })).toBeInTheDocument();
    log.mockRestore();
  });

  it('없는 ID 는 not-found 문구로 닫는다', async () => {
    renderScreen('no-such-member');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '탈퇴회원 조회' })).toBeInTheDocument();
  });
});
