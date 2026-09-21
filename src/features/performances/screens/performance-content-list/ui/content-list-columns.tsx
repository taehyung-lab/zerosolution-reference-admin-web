import type { TFunction } from 'i18next';
import type { ContentRow, ContentSortKey } from '@/features/performances/model/content';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { ContentListView } from '../model/content-list-search';

type Column = DataTableProps<ContentRow>['columns'][number];

/** 원장 5.1 table 이 2줄 셀에 `등록일 / 최근업데이트일` 을 초 단위까지 함께 적는다. */
const instant = (value: string) => `${formatDate(value)} ${formatTimeInTimeZone(value, displayTimeZone(), 'second')}`;

/**
 * Figma `5.1.1. 콘텐츠 리스트`(`129:21882`) table 의 컬럼 순서: checkbox · 구분 · 공연유형 · 공연명 ·
 * 총회차 · 출연자 · 주최/기획 · 공연기간 · 사용 상태 · 미리보기 · 등록일/최근업데이트일.
 * 정렬 축이 있는 컬럼에만 헤더 정렬을 건다. 마지막 2줄 셀은 두 날짜 키를 함께 담으므로 활성 키가
 * 최근업데이트일이면 그 키를, 아니면 등록일을 헤더 정렬로 쓴다 — 그 아이콘이 둘 중 어느 키를 뜻하는지는
 * 원장의 미확인이며, 첫 렌더부터 활성 방향이 보이게 하는 목록 공통 규칙을 이 선택이 지킨다.
 */
export function contentListColumns({
  t,
  search,
  selection,
  onHeaderSort,
  onPreview,
}: {
  readonly t: TFunction<'performances'>;
  readonly search: ContentListView;
  readonly selection: PageRowSelection<ContentRow>;
  readonly onHeaderSort: (key: ContentSortKey) => void;
  readonly onPreview: (row: ContentRow) => void;
}): DataTableProps<ContentRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const dateSortKey: ContentSortKey = search.sortType === 'updatedAt' ? 'updatedAt' : 'registeredAt';
  const sortable = (
    key: ContentSortKey,
    header: string,
    accessorFn: (row: ContentRow) => string | number,
  ): Column => ({
    id: key,
    header,
    accessorFn,
    meta: { sort: { direction: headerSortDirection(active, key), onSort: () => onHeaderSort(key) } },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('content.result.selectPage'),
      rowLabel: (row) => t('content.result.selectRow', { title: row.title }),
    }),
    sortable('ticketKind', t('content.fields.ticketKind'), (row) => t(`options.${row.ticketKind}`)),
    sortable('performanceType', t('content.fields.performanceType'), (row) => t(`options.${row.performanceType}`)),
    sortable('title', t('content.fields.title'), (row) => row.title),
    { id: 'sessionCount', header: t('content.fields.sessionCount'), accessorFn: (row: ContentRow) => row.sessionCount },
    sortable('performers', t('content.fields.performers'), (row) => row.performers),
    sortable('organizer', t('content.fields.organizer'), (row) => row.organizer),
    sortable('period', t('content.fields.period'), (row) => row.period),
    sortable('usageStatus', t('content.fields.usageStatus'), (row) => t(`content.options.${row.usageStatus}`)),
    {
      id: 'preview',
      header: t('content.fields.preview'),
      cell: ({ row }) =>
        row.original.hasPreview ? (
          <button
            aria-label={t('content.preview.open', { title: row.original.title })}
            className="underline"
            type="button"
            onClick={() => onPreview(row.original)}
          >
            {t('content.fields.preview')}
          </button>
        ) : (
          t('content.result.emptyValue')
        ),
    },
    {
      id: 'registeredUpdatedAt',
      header: t('content.fields.registeredUpdatedAt'),
      cell: ({ row }) => (
        <span className="whitespace-pre-line">{`${instant(row.original.registeredAt)} /\n${instant(row.original.updatedAt)}`}</span>
      ),
      meta: {
        sort: {
          direction: headerSortDirection(active, dateSortKey),
          onSort: () => onHeaderSort(dateSortKey),
        },
      },
    },
  ];
}
