import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { listViewControls, type ListViewSearch } from '@/shared/lib/list-view';
import type { ListResultData } from './ListResult';
import { PagedListResult } from './PagedListResult';

interface Row {
  readonly id: string;
  readonly name: string;
}

type SortKey = 'name' | 'createdAt';
type View = ListViewSearch<SortKey>;

const view: View = { page: 2, pageSize: 100, sortType: 'name', sortDirection: 'asc' };
const rows: readonly Row[] = [
  { id: 'r1', name: 'first row' },
  { id: 'r2', name: 'second row' },
];

function data<TSearched extends boolean>(
  searched: TSearched,
  overrides: Partial<Omit<ListResultData<Row, TSearched>, 'searched'>> = {},
): ListResultData<Row, TSearched> {
  return {
    rows,
    searched,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: vi.fn(() => Promise.resolve(undefined)),
    ...overrides,
  };
}

const columns = [{ id: 'name', header: 'Name', accessorKey: 'name' }] as const;
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created' },
] as const;

function renderResult(node: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
}

describe('PagedListResult', () => {
  it('draws total, then page-size and sort, then the table and pager, in that order', () => {
    const commit = vi.fn();
    renderResult(
      <PagedListResult
        data={data(true)}
        total={2}
        view={listViewControls({ search: view, totalPages: 3, commit })}
        columns={columns}
        getRowId={(row) => row.id}
        copy={{ empty: 'nothing here' }}
        pageSizeOptions={[50, 100]}
        sortOptions={sortOptions}
        actions={<button type="button">bulk action</button>}
      />,
    );

    const total = screen.getByText(/2/, { selector: 'li' });
    const pageSize = screen.getByRole('combobox', { name: '보기' });
    const sort = screen.getByRole('combobox', { name: '정렬' });
    const table = screen.getByRole('table');
    const pager = screen.getByRole('navigation', { name: '페이지 이동' });
    const order = [total, pageSize, sort, table, pager];
    for (let index = 1; index < order.length; index += 1) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'bulk action' })).toBeInTheDocument();
    expect(within(table).getByText('first row')).toBeInTheDocument();
  });

  it('hides page-size and sort before a gated list has searched and shows the not-searched sentence', () => {
    const commit = vi.fn();
    renderResult(
      <PagedListResult
        data={data<boolean>(false, { rows: [] })}
        total={0}
        view={listViewControls({ search: view, totalPages: 0, commit })}
        columns={columns}
        getRowId={(row) => row.id}
        copy={{ notSearched: 'search first', empty: 'nothing here' }}
        pageSizeOptions={[50, 100]}
        sortOptions={sortOptions}
      />,
    );

    expect(screen.queryByRole('combobox', { name: '보기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: '정렬' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('search first')).toBeInTheDocument();
  });

  it('routes row activation and view changes back to the caller without owning either', () => {
    const commit = vi.fn();
    const onRowActivate = vi.fn();
    renderResult(
      <PagedListResult
        data={data(true)}
        total={2}
        view={listViewControls({ search: view, totalPages: 3, commit })}
        columns={columns}
        getRowId={(row) => row.id}
        onRowActivate={onRowActivate}
        copy={{ empty: 'nothing here' }}
        pageSizeOptions={[50, 100]}
        sortOptions={sortOptions}
      />,
    );

    screen.getByText('second row').click();
    expect(onRowActivate).toHaveBeenCalledWith(rows[1]);

    screen.getByRole('button', { name: '3' }).click();
    expect(commit).toHaveBeenCalledWith({ ...view, page: 3 });
  });
});
