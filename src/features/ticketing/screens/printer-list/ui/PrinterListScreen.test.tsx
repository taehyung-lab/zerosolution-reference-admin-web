import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { PrinterListSearch } from '../model/printer-list-search';
import { PrinterListScreen } from './PrinterListScreen';

/** route 가 넘기는 것은 sparse search 와 이동 callback 이다. 해소·업무 실행은 화면이 한다. */
function renderScreen(sparse: PrinterListSearch = {}) {
  const onSearchChange = vi.fn();
  const onActivate = vi.fn();
  const onCreate = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <PrinterListScreen
        search={sparse}
        onSearchChange={onSearchChange}
        onActivate={onActivate}
        onCreate={onCreate}
      />
    </TestQueryLocaleProvider>,
  );
  return { onSearchChange, onActivate, onCreate };
}

const firstRowName = '003-31500210';

describe('PrinterListScreen (6.7.1 스마트프린터 목록)', () => {
  it('검색을 기다리지 않고 진입 즉시 결과를 그린다', async () => {
    renderScreen();

    expect(await screen.findByRole('cell', { name: firstRowName })).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 5')).toBeInTheDocument();
  });

  it('Figma 리스트 frame 의 컬럼을 순서대로 노출하고 행 checkbox 를 준다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent?.replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      '',
      '기기명',
      '시리얼번호',
      '모델명',
      '제조사',
      '보관위치',
      '기기상태',
      '조치사항',
      '구매일',
      '용도',
      '사용상태',
      '등록일/최근업데이트일',
    ]);
    expect(
      within(screen.getByRole('table')).getByRole('checkbox', { name: `${firstRowName} 선택` }),
    ).toBeInTheDocument();
  });

  it('첫 렌더에 기본 정렬(등록일 desc)이 헤더 하나에만 표시된다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    const sorted = screen.getAllByRole('columnheader').filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    expect(sorted[0]).toHaveAccessibleName('등록일/최근업데이트일');
  });

  it('보기·정렬·헤더·페이지 전이가 canonical URL 로 나간다', async () => {
    const { onSearchChange } = renderScreen({ pageSize: 200 });
    await screen.findByRole('cell', { name: firstRowName });

    await chooseOptionIn('정렬', '기기명');
    expect(onSearchChange).toHaveBeenLastCalledWith({ pageSize: 200, sortType: 'name' });

    fireEvent.click(screen.getByRole('button', { name: '등록일/최근업데이트일' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ pageSize: 200, sortDirection: 'asc' });
  });

  it('검색을 제출하면 검색어와 다중선택이 첫 페이지로 커밋된다', async () => {
    const { onSearchChange } = renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    await chooseOptionIn('검색 대상', '시리얼번호');
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: 'ZERO200011' },
    });
    const status = screen.getByRole('group', { name: '상태' });
    fireEvent.click(within(status).getByRole('checkbox', { name: '정상' }));
    fireEvent.click(within(status).getByRole('checkbox', { name: '고장' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(onSearchChange.mock.calls[0]?.[0]).toEqual({
        keywords: [{ field: 'serialNo', value: 'ZERO200011' }],
        statuses: ['REPAIR'],
      });
    });
  });

  it('초기화는 조건을 비운 URL 로 나간다', async () => {
    const { onSearchChange } = renderScreen({ statuses: ['BROKEN'] });
    await screen.findByRole('cell', { name: '001-12345649' });

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onSearchChange).toHaveBeenCalledWith({});
  });

  it('일치하는 결과가 없으면 원문 문구를 보여 준다', async () => {
    renderScreen({ keywords: [{ field: 'name', value: '없는 기기' }] });

    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
  });

  it('행을 클릭하면 그 프린터의 조회로 나간다 — 원문 row action', async () => {
    const { onActivate } = renderScreen();
    const cell = await screen.findByRole('cell', { name: '002-20001101' });

    fireEvent.click(cell);

    expect(onActivate).toHaveBeenCalledWith('reference-printer-3');
  });

  it('등록을 누르면 등록 화면으로 나간다', async () => {
    const { onCreate, onActivate } = renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('미선택 상태의 변경·선택복사는 원문 Case01 오류 alert 만 연다', async () => {
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('button', { name: '선택복사' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
  });

  it('선택 + 변경 값 + 확인 → 요청 함수 → 완료 alert, 확인하면 선택이 풀린다 — 원문 Case02', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowName} 선택` }));
    await chooseOptionIn('일괄변경 항목', '용도 > 현장발권용');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('변경되었습니다.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 스마트프린터 일괄변경'));

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: `${firstRowName} 선택` })).not.toBeChecked();
    log.mockRestore();
  });

  it('선택복사는 선택만 있으면 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('cell', { name: firstRowName });

    fireEvent.click(screen.getByRole('checkbox', { name: `${firstRowName} 선택` }));
    fireEvent.click(screen.getByRole('button', { name: '선택복사' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 스마트프린터 선택복사')),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    log.mockRestore();
  });
});
