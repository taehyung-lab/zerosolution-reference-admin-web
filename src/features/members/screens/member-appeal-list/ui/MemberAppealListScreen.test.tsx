import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { MemberAppealListScreen } from './MemberAppealListScreen';

function renderScreen() {
  const onSearchChange = vi.fn();
  const onActivate = vi.fn();
  const onMessage = vi.fn();
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  render(
    <TestQueryLocaleProvider>
      <MemberAppealListScreen search={{}} onSearchChange={onSearchChange} onActivate={onActivate} onMessage={onMessage} />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, onActivate, onMessage, log };
}

describe('MemberAppealListScreen (4.7 불량회원 소명신청)', () => {
  it('진입 즉시 조회하고 일괄변경은 선택·값·확인을 지나 요청 함수에 닿는다', async () => {
    const { log } = renderScreen();
    await screen.findByRole('table');
    expect(screen.getByText('검색결과 : 1')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1:1문의' })).toBeInTheDocument();

    await chooseOptionIn('변경 항목', '일반회원');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getAllByRole('row')[1]!).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 소명 회원 일괄변경')));
    log.mockRestore();
  });

  it('SMS 는 선택한 대상을 알리고 행 클릭은 소명신청 조회로 나가며 필터 검색은 조건을 커밋한다', async () => {
    const { onMessage, onActivate, onSearchChange } = renderScreen();
    await screen.findByRole('table');
    fireEvent.click(within(screen.getAllByRole('row')[1]!).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledExactlyOnceWith('sms', ['appeal-1']);
    expect(onActivate).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('row')[1]!);
    expect(onActivate).toHaveBeenCalledWith('appeal-1');

    fireEvent.click(within(screen.getByRole('group', { name: '처리상태' })).getByRole('checkbox', { name: '보류' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ statuses: ['waiting', 'reviewing', 'completed'] });
  });
});
