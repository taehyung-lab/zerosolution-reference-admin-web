import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TicketIssueCounts, TicketIssueRow, TicketIssueSortKey } from '@/features/ticketing/model/ticket-issue';
import { formatCount } from '@/shared/lib/format';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import type { ListViewControls } from '@/shared/lib/list-view';
import { DataTable, type DataTableProps } from '@/shared/ui/list/DataTable';
import { ListResult, type ListResultData } from '@/shared/ui/list/ListResult';
import { PageSizeControl } from '@/shared/ui/list/PageSizeControl';
import { Pagination } from '@/shared/ui/list/Pagination';
import { ResultToolbar } from '@/shared/ui/list/ResultToolbar';
import { SortControl } from '@/shared/ui/list/SortControl';
import type { TicketIssueListView } from '../model/ticket-issue-list-search';

/**
 * fact 「결과 상태 카운트」 때문에 이 화면은 공용 `PagedListResult` 를 쓰지 않고 결과 영역을 직접
 * 조립한다. 다른 목록은 결과 건수를 `검색결과 : n` 한 문장으로 그리지만 이 frame 은
 * `총 1,100  발권대기 500  발권완료 500  재발권 100  분실 100` 다섯 항목을 한 줄로 나열한다
 * (LIST-COMMON-COPY 정책: 다른 문장을 쓰는 화면은 공용 단위 대신 직접 조립한다).
 * 그 밖의 순서(카운트 → 보기·정렬 + toolbar → 표 → 페이지)와 다섯 결과 상태는 공용 계약 그대로다.
 *
 * 카운트는 표시로만 그린다 — 클릭이 어떤 필드에 무엇을 커밋하는지 원문이 말하지 않는다
 * (`product/facts/TICKET-ISSUE-LIST.md` 미확인 3, 보류).
 */
export function TicketIssueListResult({
  data,
  total,
  counts,
  view,
  columns,
  sortOptions,
  actions,
}: {
  readonly data: ListResultData<TicketIssueRow, boolean>;
  readonly total: number;
  readonly counts: TicketIssueCounts | undefined;
  readonly view: ListViewControls<TicketIssueListView>;
  readonly columns: DataTableProps<TicketIssueRow>['columns'];
  readonly sortOptions: readonly { readonly value: TicketIssueSortKey; readonly label: string }[];
  readonly actions: ReactNode;
}) {
  const { t, i18n } = useTranslation('ticketing');
  const { t: shared } = useTranslation('shared');
  const number = (value: number) => formatCount(i18n.language, value);

  return (
    <>
      {data.searched ? (
        <ul className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm" role="list">
          <li>{t('issue.result.total', { formatted: number(total) })}</li>
          <li>{t('issue.result.countPending', { formatted: number(counts?.pending ?? 0) })}</li>
          <li>{t('issue.result.countIssued', { formatted: number(counts?.issued ?? 0) })}</li>
          <li>{t('issue.result.countReissued', { formatted: number(counts?.reissued ?? 0) })}</li>
          <li>{t('issue.result.countLost', { formatted: number(counts?.lost ?? 0) })}</li>
        </ul>
      ) : null}
      <ResultToolbar
        left={
          data.searched ? (
            <>
              <PageSizeControl
                label={shared('list.pageSize')}
                options={standardPageSizeOptions}
                {...view.pageSize}
              />
              <SortControl
                label={shared('list.sort')}
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
        copy={{ notSearched: t('issue.result.notSearched'), empty: t('issue.result.empty') }}
        footer={
          <Pagination
            {...view.pagination}
            ariaLabel={shared('list.pagination.label')}
            previousLabel={shared('list.pagination.previous')}
            nextLabel={shared('list.pagination.next')}
          />
        }
      >
        <DataTable rows={data.rows} columns={columns} getRowId={(row) => row.id} />
      </ListResult>
    </>
  );
}
