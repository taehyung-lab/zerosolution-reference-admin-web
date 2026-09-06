import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useDraftCommit } from '@/shared/lib/use-draft-commit';
import { useKeywordDraft } from '@/shared/lib/use-keyword-draft';
import { usePeriodDraft } from '@/shared/lib/use-period-draft';
import { usePageRowSelection } from '@/shared/lib/use-page-row-selection';
import { standardPageSizeOptions, standardPeriodPresetValues } from '@/shared/config/list';
import { usePeriodPresetLabels } from '@/shared/i18n/use-period-preset-labels';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { FilterPanel } from '@/shared/ui/patterns/FilterPanel';
import { FilterField } from '@/shared/ui/patterns/FilterField';
import { PeriodFilterField } from '@/shared/ui/patterns/PeriodFilterField';
import { KeywordFilterField } from '@/shared/ui/patterns/KeywordFilterField';
import { DataTable, type DataTableProps } from '@/shared/ui/patterns/DataTable';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import { Select } from '@/shared/ui/primitives/Select';
import { useManagerDirectoryData } from './useManagerDirectoryData';
import type { ManagerDirectoryRow } from '../model/manager';
import { ManagerListActions } from './ManagerListActions';
import {
  managerListFilter,
  managerListSearchSchema,
  managerListSorts,
  type ManagerListSearch,
} from './manager-list-search';
import type { ManagerListActionRequest } from './useManagerListActions';

export function ManagerListScreen({
  search,
  onSearchChange,
  onActionRequest,
}: {
  readonly search: ManagerListSearch;
  readonly onSearchChange: (search: ManagerListSearch) => void;
  readonly onActionRequest: (request: ManagerListActionRequest) => void;
}) {
  const { t } = useTranslation('managers');
  const { t: shared } = useTranslation('shared');
  const navigate = useNavigate();
  const filterKey = JSON.stringify(managerListFilter(search));
  const { draft, patchDraft, resetDraft } = useDraftCommit({
    committed: search,
    keyOf: (value) => JSON.stringify(managerListFilter(value)),
    createDraft: managerListFilter,
  });
  const period = usePeriodDraft({ committed: search, resetKey: filterKey });
  const keyword = useKeywordDraft<'id' | 'name' | 'phone' | 'email'>({
    committedItems: search.keywords ?? [],
    initialField: 'id',
    resetKey: filterKey,
  });
  const presets = usePeriodPresetLabels();
  const commit = (next: ManagerListSearch) =>
    onSearchChange(managerListSearchSchema.parse(next));
  const searched = search.periodType !== undefined;
  const { rows, total, totalPages, page, typeOptions, permissionOptions } = useManagerDirectoryData(search);
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const sort = search.sort ?? 'joinedAt';
  const direction = search.direction ?? 'desc';
  const sortLabel = (value: typeof sort) => t(`scenarioSort.${value}`);
  const columns: DataTableProps<ManagerDirectoryRow>['columns'] = [
    {
      id: 'selection',
      header: () => (
        <Checkbox
          aria-label={t('result.selectAll')}
          checked={selection.isAllChecked}
          indeterminate={selection.isMixed}
          onChange={(event) => selection.togglePage(event.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('result.selectRow', { id: row.original.id })}
          checked={selection.isChecked(row.original)}
          onChange={(event) => selection.toggleRow(row.original, event.target.checked)}
        />
      ),
    },
    ...(
      [
        'type',
        'organization',
        'id',
        'name',
        'phone',
        'email',
        'permission',
        'registrationRoute',
        'accountStatus',
        'joinedAt',
        'lastAccessAt',
      ] as const
    ).map((field) => ({
      id: field,
      header: sortLabel(field),
      meta: {
        sort: {
          direction:
            sort === field
              ? direction === 'asc'
                ? ('ascending' as const)
                : ('descending' as const)
              : undefined,
          onSort: () =>
            commit({
              ...search,
              sort: field,
              direction: sort === field && direction === 'desc' ? 'asc' : 'desc',
              page: undefined,
            }),
        },
      },
      cell: ({ row }: { row: { original: ManagerDirectoryRow } }) => {
        if (field === 'accountStatus')
          return row.original.accountStatus
            ? t(`accountStatus.${row.original.accountStatus}`)
            : t('detail.emptyValue');
        if (field === 'joinedAt') return row.original.createdAt.slice(0, 10);
        if (field === 'lastAccessAt') return row.original.lastAccessAt.slice(0, 10);
        return row.original[field];
      },
    })),
  ];
  return (
    <section>
      <PageHeader title={t('title')} breadcrumb={t('breadcrumb')} />
      <FilterPanel
        title={t('search')}
        submitLabel={t('search')}
        resetLabel={t('reset')}
        collapseLabel={t('filters.collapse')}
        expandLabel={t('filters.expand')}
        onReset={() => {
          resetDraft();
          period.reset();
          keyword.reset();
          onSearchChange({});
        }}
        onSubmit={(event) => {
          event.preventDefault();
          commit({
            ...search,
            ...draft,
            ...period.utcRange,
            keywords: [...keyword.itemsIncludingPending()],
            page: undefined,
          });
        }}
      >
        <PeriodFilterField
          label={t('filters.period')}
          criterion={{
            label: t('filters.periodType'),
            value: draft.periodType,
            options: [
              { value: 'joinedAt', label: sortLabel('joinedAt') },
              { value: 'lastAccessAt', label: sortLabel('lastAccessAt') },
            ],
            onValueChange: (periodType) => patchDraft({ periodType }),
          }}
          preset={period.preset}
          presets={standardPeriodPresetValues.map((value) => ({
            value,
            label: presets[value],
          }))}
          customLabel={presets.CUSTOM}
          presetGroupLabel={t('filters.periodPreset')}
          range={period.range}
          onPresetChange={period.setPreset}
          onRangeChange={period.setRange}
          fromLabel={t('filters.startDate')}
          toLabel={t('filters.endDate')}
          calendarLabel={t('filters.calendar')}
        />
        <KeywordFilterField
          label={t('filters.keyword')}
          field={{
            label: t('filters.keywordType'),
            value: keyword.pending.field,
            options: (['id', 'name', 'phone', 'email'] as const).map((value) => ({
              value,
              label: sortLabel(value),
            })),
            onValueChange: keyword.setPendingField,
          }}
          items={keyword.items}
          pendingValue={keyword.pending.value}
          onPendingValueChange={keyword.setPendingValue}
          onAdd={keyword.addPending}
          onRemoveAt={keyword.removeAt}
          addLabel={t('filters.add')}
          removeLabel={(item) => t('filters.remove', { value: item.value })}
          inputLabel={t('filters.keyword')}
          formatItem={(item) => `${sortLabel(item.field)} : ${item.value}`}
        />
        <FilterField label={t('form.permission')}>
          {({ labelId, controlId }) => (
            <Select
              id={controlId}
              aria-labelledby={labelId}
              value={draft.permission || 'all'}
              onValueChange={(value) =>
                patchDraft({ permission: value === 'all' ? '' : (value ?? '') })
              }
              options={[
                { value: 'all', label: t('filters.all') },
                ...permissionOptions,
              ]}
            />
          )}
        </FilterField>
        <FilterField label={t('filters.type')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={typeOptions}
              values={draft.types}
              emptyMeansAll
              onValueChange={(types) => patchDraft({ types })}
            />
          )}
        </FilterField>
        <FilterField label={t('filters.registrationRoute')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={['WEB', 'APP'].map((value) => ({ value, label: value }))}
              values={draft.registrationRoutes}
              emptyMeansAll
              onValueChange={(values) =>
                patchDraft({ registrationRoutes: values as ('WEB' | 'APP')[] })
              }
            />
          )}
        </FilterField>
        <FilterField label={t('filters.status')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={(['awaiting', 'rejected', 'active', 'inactive', 'locked'] as const).map(
                (value) => ({ value, label: t(`accountStatus.${value}`) }),
              )}
              values={draft.statuses}
              emptyMeansAll
              onValueChange={(statuses) =>
                patchDraft({ statuses: statuses as typeof draft.statuses })
              }
            />
          )}
        </FilterField>
      </FilterPanel>
      {searched ? <p>{shared('list.total', { formatted: total })}</p> : null}
      <ResultToolbar
        left={
          searched ? (
            <>
              <PageSizeControl
                label={t('result.pageSize')}
                value={search.pageSize ?? 100}
                options={standardPageSizeOptions}
                onValueChange={(pageSize) => commit({ ...search, pageSize, page: undefined })}
              />
              <SortControl
                label={t('result.sort')}
                value={sort}
                options={managerListSorts.map((value) => ({
                  value,
                  label: sortLabel(value),
                }))}
                onValueChange={(value) => commit({ ...search, sort: value, page: undefined })}
              />
            </>
          ) : null
        }
        right={
          <ManagerListActions
            searched={searched}
            selectedIds={selection.selectedIds}
            rows={rows}
            onActionRequest={onActionRequest}
          />
        }
      />
      <ListResult
        data={{
          rows,
          searched,
          isFetching: false,
          isPending: false,
          isError: false,
          retry: () => Promise.resolve(),
        }}
        copy={{
          notSearched: t('result.notSearched'),
          empty: t('result.empty'),
        }}
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(page) => commit({ ...search, page })}
            ariaLabel={t('result.paginationLabel')}
            previousLabel={t('result.previous')}
            nextLabel={t('result.next')}
          />
        }
      >
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => {
            void navigate({
              to: '/managers/$managerId',
              params: { managerId: row.id },
            });
          }}
        />
      </ListResult>
    </section>
  );
}
