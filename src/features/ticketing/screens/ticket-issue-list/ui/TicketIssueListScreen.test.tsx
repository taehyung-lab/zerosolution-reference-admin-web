import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { TicketIssueListSearch } from '../model/ticket-issue-list-search';
import { TicketIssueListScreen } from './TicketIssueListScreen';

/** route 가 넘기는 것은 sparse search 와 URL 커밋 하나다. 해소·업무 실행은 화면이 한다. */
function renderScreen(sparse: TicketIssueListSearch = {}) {
  const onSearchChange = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <TicketIssueListScreen search={sparse} onSearchChange={onSearchChange} />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange };
}

const firstReservationNo = 'REFERENCE0000005';

/** 예매번호는 복합 셀 안의 한 줄이다. 그 줄을 찾아 행으로 올라간다. */
async function findRow(reservationNo: string): Promise<HTMLElement> {
  const line = await screen.findByText(`예매번호 : ${reservationNo}`);
  const row = line.closest('tr');
  if (row === null) throw new Error(`no row for ${reservationNo}`);
  return row;
}

describe('TicketIssueListScreen (6.2 전체발권 목록)', () => {
  it('진입은 검색 전이라 표 대신 안내 문구를 그린다', () => {
    renderScreen();

    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '보기' })).not.toBeInTheDocument();
  });

  it('공연을 고르기 전에는 공연 검색·기간·검색어만 있고, 고른 뒤 공연일과 네 다중선택이 더해진다', async () => {
    renderScreen();

    expect(screen.queryByRole('group', { name: '예매처' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '공연일' })).not.toBeInTheDocument();

    fireEvent.change(await screen.findByRole('textbox', { name: '공연 검색' }), {
      target: { value: 'WINTER' },
    });
    fireEvent.click(await screen.findByRole('button', { name: '[부산] REFERENCE WINTER STAGE' }));

    expect(await screen.findByRole('group', { name: '공연일' })).toBeInTheDocument();
    for (const name of ['예매처', '예매상태', '발권상태', '재발권상태']) {
      expect(screen.getByRole('group', { name })).toBeInTheDocument();
    }
  });

  it('검색을 제출하면 검색어와 다중선택이 첫 페이지로, 검색 표식과 함께 커밋된다', async () => {
    const { onSearchChange } = renderScreen();

    await chooseOptionIn('검색 대상', '좌석번호');
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), { target: { value: '1층' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith({
        keywords: [{ field: 'seatNo', value: '1층' }],
        searched: true,
      });
    });
  });

  it('검색된 URL 은 frame 의 컬럼과 상태 카운트를 그린다', async () => {
    renderScreen({ searched: true });

    await findRow(firstReservationNo);
    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      '',
      '공연정보',
      '예매정보',
      '예매자정보',
      '결제정보',
      '발권상태',
      '최근발권일',
      '등록일/최근업데이트일',
    ]);
    expect(screen.getByText('총 5')).toBeInTheDocument();
    expect(screen.getByText('발권대기 2')).toBeInTheDocument();
    expect(screen.getByText('발권완료 1')).toBeInTheDocument();
    expect(screen.getByText('재발권 2')).toBeInTheDocument();
    expect(screen.getByText('분실 1')).toBeInTheDocument();
  });

  it('복합 셀은 연락처와 티켓일련번호를 마스킹하고 빈 값을 `-` 로 그린다', async () => {
    renderScreen({ searched: true, keywords: [{ field: 'reservationNo', value: 'REFERENCE0000001' }] });

    const row = await findRow('REFERENCE0000001');
    expect(within(row).getByText('휴대폰번호 : 010-****-1234')).toBeInTheDocument();
    expect(within(row).getByText('티켓일련번호 : 12****23')).toBeInTheDocument();
    expect(within(row).getByText('할인정보 : -')).toBeInTheDocument();
    expect(within(row).getByText('결제금액 : 150,000원')).toBeInTheDocument();
    expect(within(row).getByText('공연일 : 2026-01-03 14:00')).toBeInTheDocument();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에만 표시되고, 헤더를 누르면 방향이 뒤집힌다', async () => {
    const { onSearchChange } = renderScreen({ searched: true });
    await findRow(firstReservationNo);

    const sorted = screen.getAllByRole('columnheader').filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(screen.getByRole('button', { name: '등록일/최근업데이트일' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ sortDirection: 'asc', searched: true });
  });

  it('초기화는 검색 전 URL 로 돌아간다', async () => {
    const { onSearchChange } = renderScreen({ searched: true, vendors: ['YES24'] });
    await findRow('REFERENCE0000004');

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ searched: true, keywords: [{ field: 'reservationNo', value: '없는 예매번호' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('미선택 상태의 변경은 원문 Case01 오류 alert 만 연다', async () => {
    renderScreen({ searched: true });
    await findRow(firstReservationNo);

    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
  });

  it('선택 + 변경 값 + 확인 → 요청 함수 → 완료 alert, 확인하면 선택이 풀린다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen({ searched: true });
    await findRow(firstReservationNo);

    const rowLabel = `예매번호 ${firstReservationNo} 선택`;
    fireEvent.click(screen.getByRole('checkbox', { name: rowLabel }));
    await chooseOptionIn('일괄변경 항목', '발권상태 > 분실');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('변경되었습니다.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 전체발권 일괄변경'));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: rowLabel })).not.toBeChecked();
    log.mockRestore();
  });

  it('다운로드는 범위를 골라야 하고, `선택한 항목` 은 선택이 없으면 오류 alert 로 거절된다 — 원문 Case01~03', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen({ searched: true });
    await findRow(firstReservationNo);

    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    expect(log).not.toHaveBeenCalled();

    await chooseOptionIn('다운로드 범위', '선택한 항목');
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(log).not.toHaveBeenCalled();

    await chooseOptionIn('다운로드 범위', '검색결과 전체');
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 전체발권 다운로드')),
    );
    log.mockRestore();
  });
});
