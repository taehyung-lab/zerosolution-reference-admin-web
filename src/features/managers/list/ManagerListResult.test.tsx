import { ManagerListActions } from './ManagerListActions';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { ManagerListResult } from './ManagerListResult';
import { toManagerListParams } from '../api/queries';
import { managerSortFields, managerSortTypes } from './manager-sort';
import {
  managerSearchDefaults,
  resolveManagerSearch,
  type ManagerRouteSearch,
  type ManagerSearch,
} from './search-schema';
import { useManagerListResult } from './useManagerListResult';
import type { ManagerListData } from './useManagerListData';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/managers/id">{children}</a>,
}));

const row = (id: string) => ({ id, type: '기획사', organization: 'Zero', name: 'Kim', phone: '010', permission: 'Admin', registrationRoute: 'WEB', status: 'ACTIVE' as const, createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-31T00:00:00Z' });
const renderResult = (element: ReactNode) => render(<I18nextProvider i18n={i18n}>{element}</I18nextProvider>);
const data = (overrides: Partial<ManagerListData> = {}): ManagerListData => ({
  rows: [],
  total: 0,
  totalPages: 1,
  searched: true,
  isPending: false,
  isFetching: false,
  isError: false,
  retry: vi.fn(),
  ...overrides,
});
const sortLabel = (type: (typeof managerSortTypes)[number]) =>
  i18n.t(managerSortFields[type].labelKey, { ns: 'managers' });
const sortableHeaders = () =>
  screen.getAllByRole('columnheader').filter((header) => within(header).queryByRole('button') !== null);

function ResultHarness({
  search = managerSearchDefaults,
  onSearchChange = vi.fn(),
  onActionRequest = vi.fn(),
  value,
}: {
  readonly search?: ManagerSearch;
  readonly onSearchChange?: (next: ManagerRouteSearch) => void;
  readonly onActionRequest?: (intent: { readonly type: 'bulkChange'; readonly targetIds: readonly string[]; readonly values: { readonly accountStatus: 'active' | 'inactive' } }) => void;
  readonly value: ManagerListData;
}) {
  const result = useManagerListResult({
    search,
    data: value,
    onSearchChange,
  });
  return <ManagerListResult data={value} result={result} toolbarRight={<ManagerListActions searched={value.searched} selectedIds={result.selectedIds} rows={value.rows} onActionRequest={onActionRequest} />} />;
}

function chooseTarget(label: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: '변경 항목' }), { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: label }));
}

describe('ManagerListResult', () => {
  it('requires rows, confirms the product status, and emits one intent only after confirmation', () => {
    const onActionRequest = vi.fn();
    renderResult(<ResultHarness value={data({ rows: [row('1')], total: 1 })} onActionRequest={onActionRequest} />);
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionRequest).not.toHaveBeenCalled();

    const target = screen.getByRole('combobox', { name: '변경 항목' });
    expect(target).toHaveTextContent('선택');
    fireEvent.click(screen.getByRole('checkbox', { name: '1 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(target).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    chooseTarget('비활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('[대기, 거절, 잠금]은 상태를 변경할 수 없습니다.');
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onActionRequest).not.toHaveBeenCalled();
    expect(target).toHaveTextContent('비활성');
    expect(screen.getByRole('checkbox', { name: '1 선택' })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({ type: 'bulkChange', targetIds: ['1'], values: { accountStatus: 'inactive' } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '1 선택' })).toBeChecked();
  });

  it.each(['notSearched', 'loading', 'error', 'empty'] as const)('keeps confirmation cancellable through %s', (state) => {
    const onActionRequest = vi.fn();
    const value = data({ rows: [row('1')], total: 1 });
    const { rerender } = renderResult(<ResultHarness value={value} onActionRequest={onActionRequest} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '1 선택' }));
    chooseTarget('활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    rerender(<I18nextProvider i18n={i18n}><ResultHarness value={{ ...value,
      searched: state !== 'notSearched', isPending: state === 'loading', isError: state === 'error', rows: state === 'empty' ? [] : value.rows,
    }} onActionRequest={onActionRequest} /></I18nextProvider>);
    expect(screen.getByRole('dialog')).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onActionRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('excludes confirmed waiting and locked rows before emitting an intent', () => {
    const onActionRequest = vi.fn();
    renderResult(<ResultHarness value={data({ rows: [
      row('active'),
      { ...row('waiting'), status: 'AWAITING' },
      { ...row('locked'), status: 'LOCKED' },
      { ...row('unmapped-inactive'), status: 'INACTIVE' },
    ], total: 4 })} onActionRequest={onActionRequest} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    chooseTarget('활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({ type: 'bulkChange', targetIds: ['active', 'unmapped-inactive'], values: { accountStatus: 'active' } });
  });

  it('does not emit an empty intent when every selected row is blocked', () => {
    const onActionRequest = vi.fn();
    renderResult(<ResultHarness value={data({ rows: [{ ...row('waiting'), status: 'AWAITING' }], total: 1 })} onActionRequest={onActionRequest} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'waiting 선택' }));
    chooseTarget('활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('shows only the register action before the first search', () => {
    renderResult(<ResultHarness value={data({ searched: false })} />);
    expect(screen.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '등록' })).toBeInTheDocument();
  });

  it('does not render Pagination for a single-page result', () => {
    renderResult(<ResultHarness value={data({ rows: [row('1')], total: 1 })} />);

    expect(screen.queryByRole('navigation', { name: '페이지 이동' })).not.toBeInTheDocument();
  });

  it('renders feature-owned columns without inventing unsupported selection actions', () => {
    renderResult(<ResultHarness value={data({ rows: [row('1'), row('2')], total: 2 })} />);
    expect(screen.getByRole('listitem').textContent).toBe('검색결과 : 2');
    expect(screen.queryByRole('checkbox', { name: '전체 선택' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '최근접속일' })).toBeInTheDocument();
    expect(screen.getAllByText('2026-08-31')).not.toHaveLength(0);
  });

  it('renders an empty date cell without crashing the list', () => {
    renderResult(
      <ResultHarness
        value={data({ rows: [{ ...row('1'), createdAt: '' }], total: 1 })}
      />,
    );

    const headers = screen.getAllByRole('columnheader');
    const createdAtIndex = headers.findIndex((header) =>
      within(header).queryByText('가입일'),
    );
    const cells = within(screen.getAllByRole('row')[1]!).getAllByRole('cell');
    expect(cells[createdAtIndex]).toBeEmptyDOMElement();
  });

  it.each([
    ['ko', '검색결과 : 2'],
    ['en', 'Results: 2'],
    ['ja', '検索結果 : 2'],
  ])('lets i18n own the whole summary sentence in %s', (language, expected) => {
    const localized = i18n.cloneInstance({ lng: language });
    render(
      <I18nextProvider i18n={localized}>
        <ResultHarness value={data({ rows: [row('1'), row('2')], total: 2 })} />
      </I18nextProvider>,
    );

    expect(screen.getByRole('listitem').textContent).toBe(expected);
  });

  it('reflects the route sort state on the sortable header and updates the same search', () => {
    const onSearchChange = vi.fn();
    renderResult(<ResultHarness onSearchChange={onSearchChange} value={data({ rows: [row('1')], total: 1 })} />);

    expect(screen.getByRole('columnheader', { name: '가입일' })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: '이름' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveTextContent('가입일');

    fireEvent.click(screen.getByRole('button', { name: '가입일' }));
    const routeSearch = onSearchChange.mock.calls[0]?.[0] as ManagerRouteSearch;
    expect(routeSearch).toEqual({
      periodType: 'CREATED_AT',
      sortDirection: 'ASC',
    });
    expect(toManagerListParams(resolveManagerSearch(routeSearch))).toEqual(
      expect.objectContaining({ sortType: 'CREATED_AT', sortDirection: 'ASC' }),
    );
  });

  it('makes exactly the sort-select options sortable as column headers', () => {
    renderResult(<ResultHarness value={data({ rows: [row('1')], total: 1 })} />);

    // The glyph is aria-hidden, so the accessible name is the column label alone.
    expect(sortableHeaders()).toHaveLength(managerSortTypes.length);
    for (const type of managerSortTypes) {
      const button = screen.getByRole('button', { name: sortLabel(type) });
      expect(button.closest('th')).not.toBeNull();
    }
  });

  it.each(managerSortTypes)(
    'sends %s with the kept direction and page 1 when its inactive header is clicked',
    (type) => {
      const onSearchChange = vi.fn();
      const activeElsewhere: ManagerSearch = {
        ...managerSearchDefaults,
        sortType: type === 'CREATED_AT' ? 'NAME' : 'CREATED_AT',
        sortDirection: 'ASC',
        page: 3,
      };
      renderResult(
        <ResultHarness search={activeElsewhere} onSearchChange={onSearchChange} value={data({ rows: [row('1')], total: 1 })} />,
      );

      fireEvent.click(screen.getByRole('button', { name: sortLabel(type) }));
      const routeSearch = onSearchChange.mock.calls[0]?.[0] as ManagerRouteSearch;
      expect(toManagerListParams(resolveManagerSearch(routeSearch))).toEqual(
        expect.objectContaining({ sortType: type, sortDirection: 'ASC', pageNo: 1 }),
      );
    },
  );

  it('marks only the active header with the direction glyph and aria-sort', () => {
    renderResult(
      <ResultHarness
        search={{ ...managerSearchDefaults, sortType: 'NAME', sortDirection: 'ASC' }}
        value={data({ rows: [row('1')], total: 1 })}
      />,
    );

    const nameHeader = screen.getByRole('columnheader', { name: '이름' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(nameHeader.querySelector('[aria-hidden="true"]')).toHaveAttribute('data-direction', 'ascending');
    expect(screen.getByRole('columnheader', { name: '가입일' })).not.toHaveAttribute('aria-sort');
    expect(screen.getAllByRole('columnheader').filter((h) => h.hasAttribute('aria-sort'))).toEqual([nameHeader]);
    expect(screen.getAllByRole('columnheader').filter((h) => h.querySelector('[aria-hidden="true"]'))).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveTextContent('이름');
  });

  it('keeps columns without a rehearsal sort key as plain headers', () => {
    renderResult(<ResultHarness value={data({ rows: [row('1')], total: 1 })} />);

    for (const name of ['휴대폰번호', '가입경로']) {
      const header = screen.getByRole('columnheader', { name });
      expect(header).not.toHaveAttribute('aria-sort');
      expect(within(header).queryByRole('button')).toBeNull();
    }
  });

  it('keeps a recovery pager visible when the URL page is out of range', () => {
    renderResult(<ResultHarness search={{ ...managerSearchDefaults, page: 40 }} value={data({ total: 250, totalPages: 3 })} />);
    expect(screen.getByRole('navigation', { name: '페이지 이동' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });
});
