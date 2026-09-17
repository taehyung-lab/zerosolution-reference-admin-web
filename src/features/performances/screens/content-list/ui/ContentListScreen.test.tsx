import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { readContentPage } from '@/features/performances/fixtures/contents';
import type { ContentRow } from '@/features/performances/model/content';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import type { ContentListSearch } from '../model/content-list-search';
import { ContentListScreen } from './ContentListScreen';

const { readPage } = vi.hoisted(() => ({ readPage: vi.fn<typeof readContentPage>() }));
vi.mock(import('@/features/performances/fixtures/contents'), async (importOriginal) => ({
  ...(await importOriginal()),
  readContentPage: readPage,
}));

const registered: ContentRow = {
  id: 'content-1',
  ticketKind: 'day',
  performanceType: 'concert',
  title: 'Reference Content 1',
  sessionCount: 2,
  performers: 'Reference Performer',
  organizer: 'Reference Organizer',
  period: '2026-09-01',
  venueId: 'reference-venue-a',
  usageStatus: 'notInUse',
  hasPreview: true,
  registeredAt: '2026-09-01T03:00:00Z',
  updatedAt: '2026-09-02T03:00:00Z',
};
const withoutPreview: ContentRow = { ...registered, id: 'content-2', title: 'Reference Content 2', hasPreview: false };

function setup(search: ContentListSearch = {}) {
  const onSearchChange = vi.fn<(value: ContentListSearch) => void>();
  const view = (value: ContentListSearch) => (
    <TestQueryLocaleProvider>
      <ContentListScreen search={value} onSearchChange={onSearchChange} />
    </TestQueryLocaleProvider>
  );
  return { ...render(view(search)), view, onSearchChange };
}

describe('ContentListScreen (5.1 콘텐츠 목록)', () => {
  beforeEach(() => {
    readPage.mockReset().mockResolvedValue({ rows: [registered, withoutPreview], total: 2 });
  });

  it('진입 즉시 기본 조건으로 조회하고 원장 컬럼을 그린다', async () => {
    setup();
    const table = await screen.findByRole('table');

    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 100, sortType: 'registeredAt', sortDirection: 'desc', periodType: 'performedAt' }),
    );
    expect(screen.getByText('검색결과 : 2')).toBeInTheDocument();
    for (const header of ['구분', '공연유형', '공연명', '총회차', '출연자', '주최/기획', '공연기간', '사용 상태', '미리보기', '등록일/최근업데이트일']) {
      expect(within(table).getByRole('columnheader', { name: new RegExp(header) })).toBeInTheDocument();
    }
    expect(within(table).getAllByRole('checkbox').length).toBe(3);
    expect(within(table).getByRole('columnheader', { name: /등록일\/최근업데이트일/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('원장 검색 영역의 구분·공연유형·사용상태를 모두 제공하고 예매처는 두지 않는다', async () => {
    const { onSearchChange } = setup();
    await screen.findByRole('table');
    for (const label of ['일일권', '기간권', '콘서트', '뮤지컬', '전시', '페스티벌', '연극', '스포츠', '멤버십', '사용', '사용안함']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('checkbox', { name: '예스24' })).toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: '사용안함' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    const submitted = onSearchChange.mock.calls.at(-1)![0];
    expect(submitted.usageStatuses).toEqual(['inUse']);
  });

  it('초기화는 진입 URL 로 돌아가고 결과는 남는다 — 진입 즉시 조회 계약', async () => {
    const { onSearchChange, rerender, view } = setup({ venueId: 'reference-venue-a' });
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({});
    rerender(view({}));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('2줄 날짜 헤더는 활성 정렬 키를 따라가고 보기·정렬 전이는 canonical URL 로 나간다', async () => {
    const { onSearchChange } = setup({ sortType: 'updatedAt' });
    const table = await screen.findByRole('table');

    fireEvent.click(within(table).getByRole('button', { name: /등록일\/최근업데이트일/ }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ sortType: 'updatedAt', sortDirection: 'asc' });

    fireEvent.click(within(table).getByRole('button', { name: '사용 상태' }));
    expect(onSearchChange).toHaveBeenLastCalledWith({ sortType: 'usageStatus' });
  });

  it('일괄변경은 미선택·값 미선택을 한 alert 로 거절하고 확인 뒤 완료 alert 로 닫는다', async () => {
    setup();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('변경할 항목을 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Reference Content 1 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('변경할 사용 상태를 선택해주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('combobox', { name: '사용 상태' }));
    fireEvent.click(await screen.findByRole('option', { name: '사용' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(await screen.findByText('선택 항목을 변경하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('변경되었습니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByRole('checkbox', { name: 'Reference Content 1 선택' })).not.toBeChecked();
  });

  it('미리보기는 등록된 행에만 있고 팝업이 회차·언어로 내용을 바꾼다', async () => {
    setup();
    const table = await screen.findByRole('table');
    expect(within(table).queryByRole('button', { name: 'Reference Content 2 미리보기' })).toBeNull();

    fireEvent.click(within(table).getByRole('button', { name: 'Reference Content 1 미리보기' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('heading', { name: /1회차 · ko/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('combobox', { name: '회차' }));
    fireEvent.click(await screen.findByRole('option', { name: '2회차' }));
    expect(await within(dialog).findByRole('heading', { name: /2회차 · ko/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
