import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableSortDirection } from './DataTable';

type Row = { id: string; createdAt: string; name: string };

const rows: Row[] = [{ id: '1', createdAt: '2026-08-28', name: 'Ada' }];

/** `direction` undefined models a sortable column that is not the active sort. */
function sortableColumns(direction: DataTableSortDirection | undefined, onSort = vi.fn()) {
  return [
    {
      id: 'createdAt',
      header: 'Created at',
      accessorKey: 'createdAt',
      meta: { sort: { direction, onSort } },
    },
    { id: 'name', header: 'Name', accessorKey: 'name' },
  ];
}

describe('DataTable', () => {
  it('renders feature-owned columns without owning selection or server sorting', () => {
    const columns = [
      {
        id: 'createdAt',
        header: 'Created at',
        accessorKey: 'createdAt',
      },
      { id: 'name', header: 'Name', accessorKey: 'name' },
    ];

    render(
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
      />
    );

    expect(
      screen.getByRole('columnheader', { name: /created at/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
  });

  it.each(['ascending', 'descending'] as const)(
    'renders the active %s sortable header as one button whose th carries the same aria-sort',
    (direction) => {
      render(
        <DataTable
          rows={rows}
          columns={sortableColumns(direction)}
          getRowId={(row) => row.id}
        />
      );

      const header = screen.getByRole('columnheader', { name: 'Created at' });
      expect(header).toHaveAttribute('aria-sort', direction);
      expect(within(header).getByRole('button', { name: 'Created at' })).toBeInTheDocument();
    },
  );

  it('renders an inactive sortable header as a button whose th omits aria-sort', () => {
    // WAI-ARIA 1.2 aria-sort: apply to only one header at a time; the APG sortable
    // table example sets aria-sort only on the currently sorted column.
    render(
      <DataTable
        rows={rows}
        columns={sortableColumns(undefined)}
        getRowId={(row) => row.id}
      />
    );

    const header = screen.getByRole('columnheader', { name: 'Created at' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(within(header).getByRole('button', { name: 'Created at' })).toBeInTheDocument();
  });

  it('calls the caller-owned onSort once when the sortable header is activated', () => {
    const onSort = vi.fn();
    render(
      <DataTable
        rows={rows}
        columns={sortableColumns(undefined, onSort)}
        getRowId={(row) => row.id}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Created at' }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it.each(['ascending', 'descending'] as const)(
    'shows the ▲▼ pair marked with the %s direction only on an active header',
    (direction) => {
      render(
        <DataTable
          rows={rows}
          columns={sortableColumns(direction)}
          getRowId={(row) => row.id}
        />
      );

      const header = screen.getByRole('columnheader', { name: 'Created at' });
      const glyph = header.querySelector('[aria-hidden="true"]');
      expect(glyph).toHaveTextContent('▲▼');
      expect(glyph).toHaveAttribute('data-direction', direction);
    },
  );

  it('renders no glyph for a sortable header that is not the active sort', () => {
    render(
      <DataTable
        rows={rows}
        columns={sortableColumns(undefined)}
        getRowId={(row) => row.id}
      />
    );

    const header = screen.getByRole('columnheader', { name: 'Created at' });
    expect(header.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('leaves a column without sort meta as plain text with no button and no aria-sort', () => {
    render(
      <DataTable
        rows={rows}
        columns={sortableColumns('descending')}
        getRowId={(row) => row.id}
      />
    );

    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(within(header).queryByRole('button')).toBeNull();
  });
});
