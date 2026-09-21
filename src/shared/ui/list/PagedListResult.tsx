import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListViewControls, ListViewSearch } from '../../lib/list-view';
import { DataTable, type DataTableProps } from './DataTable';
import { ListResult, type ListResultCopy, type ListResultData } from './ListResult';
import { PageSizeControl } from './PageSizeControl';
import { Pagination } from './Pagination';
import { ResultToolbar } from './ResultToolbar';
import { ResultTotal } from './ResultTotal';
import { SortControl } from './SortControl';

/**
 * The result area every paged list draws in the same order: total → toolbar (page size and
 * sort on the left, once a search exists; the caller's actions on the right) → the five-state
 * result with the table inside and the pager as its footer.
 *
 * This unit owns that order and the product-generic labels of its own controls (`shared:list.*`).
 * It owns nothing that carries meaning: the query and its facts, the URL transitions behind
 * `view`, row selection, the columns, the sort options and their labels, the not-searched and
 * empty sentences, the actions, and where a row activation goes all arrive from the caller.
 * Page size and sort are hidden before a search because nothing they change can be seen yet;
 * a list that queries on entry passes `searched: true` and always shows them.
 */
export function PagedListResult<
  TRow extends object,
  TView extends ListViewSearch<string>,
  TSearched extends boolean,
>({
  data,
  total,
  view,
  columns,
  getRowId,
  onRowActivate,
  actions,
  copy,
  pageSizeOptions,
  sortOptions,
}: {
  readonly data: ListResultData<TRow, TSearched>;
  readonly total: number;
  readonly view: ListViewControls<TView>;
  readonly columns: DataTableProps<TRow>['columns'];
  readonly getRowId: (row: TRow) => string;
  readonly onRowActivate?: (row: TRow) => void;
  readonly actions?: ReactNode;
  readonly copy: ListResultCopy<TSearched>;
  readonly pageSizeOptions: readonly number[];
  readonly sortOptions: readonly { readonly value: TView['sortType']; readonly label: string }[];
}) {
  const { t } = useTranslation('shared');

  return (
    <>
      <ResultTotal searched={data.searched} total={total} />
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl label={t('list.pageSize')} options={pageSizeOptions} {...view.pageSize} />
              <SortControl
                label={t('list.sort')}
                value={view.sort.value}
                options={sortOptions}
                onValueChange={view.sort.onValueChange}
              />
            </>
          ) : null
        }
        right={actions}
      />
      <ListResult
        data={data}
        copy={copy}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={t('list.pagination.label')}
            previousLabel={t('list.pagination.previous')}
            nextLabel={t('list.pagination.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={columns} getRowId={getRowId} onRowActivate={onRowActivate} />
      </ListResult>
    </>
  );
}
