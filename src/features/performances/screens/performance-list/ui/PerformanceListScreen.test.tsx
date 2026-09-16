import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceVenuesQuery } from '@/features/performances/api/queries';
import type { readPerformancePage } from '@/features/performances/fixtures/performances';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import type { PerformanceListSearch } from '../model/performance-list-search';
import { PerformanceListScreen } from './PerformanceListScreen';

const { readPage } = vi.hoisted(() => ({ readPage: vi.fn<typeof readPerformancePage>() }));
vi.mock(import('@/features/performances/fixtures/performances'), async (importOriginal) => ({
  ...(await importOriginal()),
  readPerformancePage: readPage,
}));

const row = {
  id: 'show-1',
  ticketKind: 'day',
  performanceType: 'concert',
  title: 'Reference show',
  sessionCount: 2,
  performers: 'Performer',
  organizer: 'Organizer',
  period: '2026-09-01',
  venueId: 'venue-1',
  venueName: 'Venue A',
  seller: 'zero',
  registeredAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-02T00:00:00Z',
};

function setup(search: PerformanceListSearch = {}) {
  const onSearchChange = vi.fn<(value: PerformanceListSearch) => void>();
  const onActivate = vi.fn();
  const view = (value: PerformanceListSearch) => (
    <TestQueryLocaleProvider>
      <PerformanceListScreen search={value} onSearchChange={onSearchChange} onActivate={onActivate} />
    </TestQueryLocaleProvider>
  );
  return { ...render(view(search)), view, onSearchChange, onActivate };
}

describe('PerformanceListScreen (5.2 공연 목록)', () => {
  beforeEach(() => {
    readPage.mockReset().mockResolvedValue({ rows: [row], total: 101 });
  });

  it('진입 즉시 기본 조건으로 조회하고 역순 번호의 읽기 전용 표를 그린다', async () => {
    const { onActivate } = setup();
    const table = await screen.findByRole('table');

    expect(screen.getByRole('combobox', { name: '기간 기준' })).toHaveTextContent('공연일');
    expect(screen.getByRole('radio', { name: '전체' })).toBeChecked();
    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 100, sortType: 'registeredAt', sortDirection: 'desc' }),
    );
    expect(within(table).queryByRole('checkbox')).toBeNull();
    expect(within(table).getByText('101')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(변경|등록|SMS|이메일)$/ })).toBeNull();

    fireEvent.keyDown(within(table).getAllByRole('row')[1]!, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledWith('show-1');
  });

  it('초기화는 진입 URL 로 돌아가고 결과는 남는다 — 진입 즉시 조회 계약', async () => {
    const { onSearchChange, rerender, view } = setup({ venueId: 'venue-1' });
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({});
    rerender(view({}));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('검색결과 : 101')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '전체' })).toBeChecked();
  });

  it('원장의 구분·공연유형·예매처 선택지를 모두 제공하고 검색에서 커밋한다', async () => {
    const { onSearchChange } = setup();
    await screen.findByRole('table');
    for (const label of ['일일권', '기간권', '콘서트', '뮤지컬', '전시', '페스티벌', '연극', '스포츠', '멤버십', '제로플러스', '멜론티켓', '티켓링크', '놀유니버스', '예스24', '기타']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeInTheDocument();
    }

    // 전체(빈 배열)에서 항목 하나를 끄면 나머지가 명시된다.
    fireEvent.click(screen.getByRole('checkbox', { name: '페스티벌' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '예스24' }));
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    const submitted = onSearchChange.mock.calls.at(-1)![0];
    expect(submitted.performanceTypes).not.toContain('festival');
    expect(submitted.performanceTypes).toContain('concert');
    expect(submitted.sellers).not.toContain('yes24');
    expect(submitted).not.toHaveProperty('page');
  });

  it('공연장은 검색해서 하나를 고르고 검색에서만 첫 페이지로 커밋된다', async () => {
    const { onSearchChange } = setup({ page: 2 });
    await screen.findByRole('table');

    fireEvent.change(await screen.findByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Reference' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Reference Hall A' }));
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '공연장 선택 해제' }));
    fireEvent.change(screen.getByRole('textbox', { name: '공연장 검색' }), { target: { value: 'Reference' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Reference Hall B' }));
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), { target: { value: 'pending' } });
    expect(readPage).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({
      venueId: 'reference-venue-b',
      keywords: [{ field: 'title', value: 'pending' }],
    });
  });

  it('보기·정렬·헤더·페이지 전이가 canonical URL 로 나간다', async () => {
    const { onSearchChange } = setup();
    const table = await screen.findByRole('table');

    fireEvent.click(within(table).getByRole('button', { name: '공연명' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ sortType: 'title' });

    fireEvent.click(within(table).getByRole('button', { name: '최근업데이트일' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ sortType: 'updatedAt' });
  });

  it('공연장 선택지는 미리 채워진 캐시를 재사용한다', async () => {
    const onSearchChange = vi.fn();
    const { container } = render(
      <TestQueryLocaleProvider>
        <PerformanceListScreen search={{}} onSearchChange={onSearchChange} onActivate={vi.fn()} />
      </TestQueryLocaleProvider>,
    );
    await screen.findByRole('table');
    await waitFor(() => expect(container.querySelector('[role="status"]')).toBeNull());
    expect(performanceVenuesQuery('ko').queryKey).toEqual(['api', 'ko', 'performances', 'venues']);
  });
});
