import { standardPageSizeOptions, standardPeriodPresetValues } from '@/shared/config/list';
import { usePeriodPresetLabels } from '@/shared/i18n/use-period-preset-labels';
import { formatCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/primitives/Button';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import { CheckboxTree } from '@/shared/ui/primitives/CheckboxTree';
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { Tooltip } from '@/shared/ui/primitives/Tooltip';
import { AlertDialog } from '@/shared/ui/patterns/AlertDialog';
import { BulkActionDialogs, useBulkActionDialogs } from '@/shared/ui/patterns/BulkActionDialogs';
import { DataTable, type DataTableProps } from '@/shared/ui/patterns/DataTable';
import { FilterField } from '@/shared/ui/patterns/FilterField';
import { FilterPanel } from '@/shared/ui/patterns/FilterPanel';
import { KeywordFilterField } from '@/shared/ui/patterns/KeywordFilterField';
import { ListResult } from '@/shared/ui/patterns/ListResult';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { PageSizeControl } from '@/shared/ui/patterns/PageSizeControl';
import { Pagination } from '@/shared/ui/patterns/Pagination';
import { PeriodFilterField } from '@/shared/ui/patterns/PeriodFilterField';
import { ResultSummary } from '@/shared/ui/patterns/ResultSummary';
import { ResultToolbar } from '@/shared/ui/patterns/ResultToolbar';
import { SortControl } from '@/shared/ui/patterns/SortControl';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  changeMemberListPage,
  changeMemberListView,
  pruneSelectedMemberIds,
  toggleMemberPageSelection,
} from './member-list-policy';
import {
  memberSortTypes,
  resolveMemberSearch,
  toMemberRouteSearch,
  type MemberRouteSearch,
  type MemberSearch,
} from './search-schema';
import { useMemberListFilter } from './useMemberListFilter';

/**
 * Presentation facts only. TRANSPLANT_PENDING_MEMBER_LIST_CONTRACT: the future member
 * contract must map its confirmed stable identifier and already-masked display values here.
 */
export interface MemberListRow {
  readonly key: string;
  readonly grade: string;
  readonly signupMethod: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string;
  readonly accountStatus: string;
  readonly joinedAt: string;
  readonly lastAccessedAt: string;
  readonly restrictions: readonly string[];
  readonly selectable?: boolean;
}

export interface MemberListData {
  readonly rows: readonly MemberListRow[];
  readonly total: number;
  readonly totalPages: number;
}

export type MemberListActionIntent =
  | { readonly type: 'bulkChange'; readonly memberIds: readonly string[]; readonly values: { readonly accountStatus: 'general' | 'flagged'; readonly restrictions: readonly string[] } }
  | { readonly type: 'sms' | 'email'; readonly memberIds: readonly string[] };

interface MemberListScreenProps {
  readonly search: MemberRouteSearch;
  readonly data: MemberListData;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
  readonly onActionIntent: (intent: MemberListActionIntent) => void;
  readonly onMemberActivate: (memberId: string) => void;
  readonly onRegister: () => void;
}

type ScreenDefinition = {
  readonly identity: 'all' | 'general' | 'flagged';
  readonly titleKey: 'screens.all' | 'screens.general' | 'screens.flagged';
  readonly accountStatusFilter: boolean;
  readonly restrictionFilter: boolean;
  readonly restrictionColumn: boolean;
  readonly tooltip: boolean;
};

const definitions = {
  all: { identity: 'all', titleKey: 'screens.all', accountStatusFilter: true, restrictionFilter: true, restrictionColumn: false, tooltip: true },
  general: { identity: 'general', titleKey: 'screens.general', accountStatusFilter: false, restrictionFilter: false, restrictionColumn: false, tooltip: false },
  flagged: { identity: 'flagged', titleKey: 'screens.flagged', accountStatusFilter: false, restrictionFilter: true, restrictionColumn: true, tooltip: false },
} as const satisfies Record<string, ScreenDefinition>;

export function AllMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={definitions.all} {...props} />;
}

export function GeneralMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={definitions.general} {...props} />;
}

export function FlaggedMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={definitions.flagged} {...props} />;
}

function MemberListScreen({ definition, ...props }: MemberListScreenProps & { readonly definition: ScreenDefinition }) {
  const { t } = useTranslation('members');
  const filter = useMemberListFilter(props);
  const title = t(definition.titleKey);
  return (
    <section>
      <PageHeader
        breadcrumb={t('breadcrumb', { title })}
        title={title}
        actions={definition.tooltip ? (
          <Tooltip content={t('screens.allTooltip')}>
            <button aria-label={t('screens.help')} className="rounded-full" type="button">ⓘ</button>
          </Tooltip>
        ) : undefined}
      />
      <MemberListFilters filter={filter} definition={definition} />
      <MemberListResult key={`${definition.identity}:${JSON.stringify(props.search)}`} definition={definition} {...props} />
    </section>
  );
}

function MemberListFilters({
  filter,
  definition,
}: {
  readonly filter: ReturnType<typeof useMemberListFilter>;
  readonly definition: ScreenDefinition;
}) {
  const { t } = useTranslation('members');
  const presetLabels = usePeriodPresetLabels();
  const signupNodes = [
    { value: 'direct', label: t('signup.direct') },
    { value: 'kakao', label: t('signup.kakao') },
    { value: 'naver', label: t('signup.naver') },
    { value: 'apple', label: t('signup.apple') },
    { value: 'melon', label: t('signup.melon') },
  ];
  const restrictionNodes = [
    { value: 'specialContent', label: t('restriction.specialContent') },
    { value: 'inquiry', label: t('restriction.inquiry') },
    { value: 'entry', label: t('restriction.entry') },
  ];
  return (
    <FilterPanel
      title={t('search')}
      collapseLabel={t('filters.collapse')}
      expandLabel={t('filters.expand')}
      submitLabel={t('search')}
      resetLabel={t('reset')}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t('filters.period')}
        criterion={{
          label: t('filters.periodType'),
          value: filter.draft.periodType,
          options: [
            { value: 'joinedAt', label: t('columns.joinedAt') },
            { value: 'lastAccessedAt', label: t('columns.lastAccessedAt') },
          ],
          onValueChange: (periodType) => filter.patchDraft({ periodType }),
        }}
        preset={filter.period.preset}
        presets={standardPeriodPresetValues.map((value) => ({ value, label: presetLabels[value] }))}
        customLabel={presetLabels.CUSTOM}
        presetGroupLabel={t('filters.periodPreset')}
        range={filter.period.range}
        onPresetChange={filter.period.setPreset}
        onRangeChange={filter.period.setRange}
        fromLabel={t('filters.startDate')}
        toLabel={t('filters.endDate')}
        calendarLabel={t('filters.calendar')}
        error={filter.periodError}
      />
      <div>
        <KeywordFilterField
          label={t('filters.keyword')}
          field={{
            label: t('filters.keywordType'),
            value: filter.keyword.pending.field,
            options: [
              { value: 'email', label: t('columns.email') },
              { value: 'name', label: t('columns.name') },
              { value: 'phone', label: t('columns.phone') },
            ],
            onValueChange: filter.keyword.setPendingField,
          }}
          items={filter.keyword.items}
          pendingValue={filter.keyword.pending.value}
          onPendingValueChange={filter.keyword.setPendingValue}
          onAdd={filter.addKeyword}
          onRemoveAt={filter.keyword.removeAt}
          addLabel={t('filters.add')}
          removeLabel={(item) => t('filters.remove', { value: item.value })}
          inputLabel={t('filters.keyword')}
          formatItem={(item) => `${t(`columns.${item.field}`)} : ${item.value}`}
        />
        {filter.keywordError ? <p className="text-sm text-red-700" role="alert">{filter.keywordError}</p> : null}
      </div>
      <FilterField label={t('filters.signupMethod')}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t('filters.all')}
            nodes={signupNodes}
            values={filter.draft.signupMethods}
            emptyMeansAll
            onValueChange={(signupMethods) => filter.patchDraft({ signupMethods: signupMethods as MemberSearch['signupMethods'] })}
          />
        )}
      </FilterField>
      {definition.accountStatusFilter ? (
        <FilterField label={t('filters.accountStatus')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={[
                { value: 'general', label: t('accountStatus.general') },
                { value: 'flagged', label: t('accountStatus.flagged') },
              ]}
              values={filter.draft.accountStatuses}
              emptyMeansAll
              onValueChange={(accountStatuses) => filter.patchDraft({ accountStatuses: accountStatuses as MemberSearch['accountStatuses'] })}
            />
          )}
        </FilterField>
      ) : null}
      {definition.restrictionFilter ? (
        <FilterField label={t('filters.restrictions')}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t('filters.all')}
              nodes={restrictionNodes}
              values={filter.draft.restrictions}
              emptyMeansAll
              onValueChange={(restrictions) => filter.patchDraft({ restrictions: restrictions as MemberSearch['restrictions'] })}
            />
          )}
        </FilterField>
      ) : null}
    </FilterPanel>
  );
}

function MemberListResult({
  search,
  data,
  definition,
  onSearchChange,
  onActionIntent,
  onMemberActivate,
  onRegister,
}: MemberListScreenProps & { readonly definition: ScreenDefinition }) {
  const { t, i18n } = useTranslation('members');
  const resolved = resolveMemberSearch(search);
  const selectableIds = useMemo(
    () => data.rows.filter((row) => row.selectable !== false).map((row) => row.key),
    [data.rows],
  );
  const [selectionState, setSelectionState] = useState<{
    readonly source: readonly string[];
    readonly ids: ReadonlySet<string>;
  }>({ source: selectableIds, ids: new Set() });
  let storedSelection = selectionState.ids;
  if (selectionState.source !== selectableIds) {
    storedSelection = pruneSelectedMemberIds(selectionState.ids, selectableIds);
    setSelectionState({ source: selectableIds, ids: storedSelection });
  }
  const setStoredSelection = (ids: ReadonlySet<string>) => {
    setSelectionState({ source: selectableIds, ids });
  };
  const selected = pruneSelectedMemberIds(storedSelection, selectableIds);
  const selectedIds = [...selected];
  const [bulkTarget, setBulkTarget] = useState<'' | 'general' | 'flagged'>('');
  const [bulkRestrictions, setBulkRestrictions] = useState<readonly string[]>([]);
  const [bulkError, setBulkError] = useState<string>();
  const [messageAlert, setMessageAlert] = useState<'sms' | 'email'>();
  const [popup, setPopup] = useState<'sms' | 'email'>();
  const bulk = useBulkActionDialogs({
    selectedCount: selected.size,
    run: (values: MemberListActionIntent & { readonly type: 'bulkChange' }) => onActionIntent(values),
  });
  const commitView = (next: MemberSearch) => onSearchChange(toMemberRouteSearch(next));

  const sortDirection = (sortType: MemberSearch['sortType']) =>
    resolved.sortType === sortType ? (resolved.sortDirection === 'asc' ? 'ascending' : 'descending') : undefined;
  const requestSort = (sortType: MemberSearch['sortType']) =>
    commitView(changeMemberListView(resolved, {
      sortType,
      sortDirection: resolved.sortType === sortType && resolved.sortDirection === 'desc' ? 'asc' : resolved.sortDirection,
    }));

  type Column = DataTableProps<MemberListRow>['columns'][number];
  const sortable = (sortType: MemberSearch['sortType'], column: Column): Column => ({
    ...column,
    meta: { sort: { direction: sortDirection(sortType), onSort: () => requestSort(sortType) } },
  });
  const allChecked = selectableIds.length > 0 && selected.size === selectableIds.length;
  const columns: DataTableProps<MemberListRow>['columns'] = [
    {
      id: 'selection',
      header: () => (
        <Checkbox
          aria-label={t('result.selectPage')}
          checked={allChecked}
          indeterminate={selected.size > 0 && !allChecked}
          onChange={(event) => setStoredSelection(toggleMemberPageSelection(selected, selectableIds, event.target.checked))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t('result.selectRow', { name: row.original.name })}
          checked={selected.has(row.original.key)}
          disabled={row.original.selectable === false}
          onChange={(event) => setStoredSelection(toggleMemberPageSelection(selected, [row.original.key], event.target.checked))}
        />
      ),
    },
    { id: 'grade', header: t('columns.grade'), accessorKey: 'grade' },
    sortable('signupMethod', { id: 'signupMethod', header: t('columns.signupMethod'), accessorKey: 'signupMethod' }),
    sortable('email', { id: 'email', header: t('columns.email'), accessorKey: 'email' }),
    sortable('name', { id: 'name', header: t('columns.name'), accessorKey: 'name' }),
    sortable('phone', { id: 'phone', header: t('columns.phone'), accessorKey: 'phone' }),
    { id: 'accountStatus', header: t('columns.accountStatus'), accessorKey: 'accountStatus' },
    sortable('joinedAt', { id: 'joinedAt', header: t('columns.joinedAt'), accessorKey: 'joinedAt' }),
    sortable('lastAccessedAt', { id: 'lastAccessedAt', header: t('columns.lastAccessedAt'), accessorKey: 'lastAccessedAt' }),
    ...(definition.restrictionColumn ? [{ id: 'restrictions', header: t('columns.restrictions'), cell: ({ row }: { row: { original: MemberListRow } }) => row.original.restrictions.join(', ') }] : []),
  ];

  const requestBulkChange = () => {
    if (!bulk.requireSelection()) return;
    if (bulkTarget === '' || (bulkTarget === 'flagged' && bulkRestrictions.length === 0)) {
      setBulkError(t('bulk.incomplete'));
      return;
    }
    setBulkError(undefined);
    bulk.requestConfirmation({
      type: 'bulkChange',
      memberIds: [...selectedIds],
      values: { accountStatus: bulkTarget, restrictions: bulkTarget === 'flagged' ? [...bulkRestrictions] : [] },
    });
  };
  const requestMessage = (type: 'sms' | 'email') => {
    if (selectedIds.length === 0) {
      setMessageAlert(type);
      return;
    }
    onActionIntent({ type, memberIds: [...selectedIds] });
    setPopup(type);
  };
  const searched = search.periodType !== undefined;
  // TRANSPLANT_PENDING_MEMBER_PERMISSION: replace the visible-action baseline when the product permission identifiers are contracted.
  const toolbarRight = (
    <div className="flex flex-wrap items-start gap-2">
      {searched ? (
        <>
          <div>
            <select aria-label={t('bulk.field')} value={bulkTarget} onChange={(event) => setBulkTarget(event.target.value as typeof bulkTarget)}>
              <option value="">{t('bulk.select')}</option>
              <option value="general">{t('accountStatus.general')}</option>
              <option value="flagged">{t('accountStatus.flagged')}</option>
            </select>
            {bulkTarget === 'flagged' ? (
              <FilterField label={t('filters.restrictions')}>
                {({ labelId }) => (
                  <CheckboxTree
                    ariaLabelledby={labelId}
                    selectAllLabel={t('filters.all')}
                    nodes={[
                      { value: 'specialContent', label: t('restriction.specialContent') },
                      { value: 'inquiry', label: t('restriction.inquiry') },
                      { value: 'entry', label: t('restriction.entry') },
                    ]}
                    values={bulkRestrictions}
                    onValueChange={setBulkRestrictions}
                  />
                )}
              </FilterField>
            ) : null}
            {bulkError ? <p role="alert">{bulkError}</p> : null}
          </div>
          <Button onClick={requestBulkChange}>{t('bulk.change')}</Button>
          <Button onClick={() => requestMessage('sms')}>{t('actions.sms')}</Button>
          <Button onClick={() => requestMessage('email')}>{t('actions.email')}</Button>
        </>
      ) : null}
      <Button onClick={onRegister}>{t('actions.register')}</Button>
    </div>
  );

  return (
    <section>
      {searched ? <ResultSummary groups={[{ key: 'total', items: [{ key: 'total', text: t('result.total', { count: formatCount(i18n.language, data.total) }) }] }]} /> : null}
      <ResultToolbar
        left={searched ? (
          <>
            <PageSizeControl label={t('result.pageSize')} value={resolved.pageSize} options={standardPageSizeOptions} onValueChange={(pageSize) => commitView(changeMemberListView(resolved, { pageSize: pageSize as MemberSearch['pageSize'] }))} />
            <SortControl label={t('result.sort')} value={resolved.sortType} options={memberSortTypes.map((value) => ({ value, label: t(`columns.${value}`) }))} onValueChange={requestSort} />
          </>
        ) : null}
        right={toolbarRight}
      />
      <ListResult
        data={{ rows: data.rows, searched, isPending: false, isFetching: false, isError: false, retry: () => Promise.resolve(undefined) }}
        copy={{ notSearched: t('result.notSearched'), empty: t('result.empty') }}
        footer={<Pagination page={resolved.page} totalPages={data.totalPages} onPageChange={(page) => commitView(changeMemberListPage(resolved, page))} ariaLabel={t('result.paginationLabel')} previousLabel={t('result.previous')} nextLabel={t('result.next')} />}
      >
        <DataTable rows={data.rows} columns={columns} getRowId={(row) => row.key} onRowActivate={(row) => onMemberActivate(row.key)} />
      </ListResult>
      <BulkActionDialogs controller={bulk} />
      <AlertDialog
        open={messageAlert !== undefined}
        onOpenChange={(open) => { if (!open) setMessageAlert(undefined); }}
        title={t('dialog.title')}
        description={messageAlert ? t(`actions.${messageAlert}Missing`) : undefined}
        acknowledgeLabel={t('dialog.acknowledge')}
      />
      <Dialog
        open={popup !== undefined}
        onOpenChange={(open) => { if (!open) setPopup(undefined); }}
        title={popup ? t(`actions.${popup}Title`) : t('dialog.title')}
      />
    </section>
  );
}
