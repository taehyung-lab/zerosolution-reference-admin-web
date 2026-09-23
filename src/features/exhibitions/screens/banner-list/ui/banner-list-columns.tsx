import type { TFunction } from 'i18next';
import type { BannerRow, BannerSortKey } from '@/features/exhibitions/model/banner';
import { formatBannerDateTime } from '@/features/exhibitions/model/banner-datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { BannerListView } from '../model/banner-list-search';

/**
 * Figma `7.1.1.1. 배너 리스트` table 의 컬럼 구성이다(2026-09-23 aside 실측, 원본 배율 판독).
 * 행 checkbox + 게시순서 · 구분 · 배너명 · 이동경로 유형 · 게시기간 · 게시 상태 · `등록일/최근업데이트일`.
 * `No.` 컬럼은 이 frame 에 없다.
 *
 * 표시 형식도 그 frame 이 정한다.
 * - 게시기간은 `2025-12-01 12:00:00 ~` / `2026-12-01 12:00:00` 두 줄이다.
 * - 마지막 컬럼은 `등록일 /` / `최근업데이트일` 두 줄이고 정렬 표시는 이 컬럼에만 그려져 있다.
 * - 일시는 초까지 그린다.
 *
 * 정렬 가능한 컬럼은 Case 정의 정렬 목록의 9개에서 나온다. 게시기간 헤더는 `게시시작일` 을,
 * 마지막 컬럼은 `등록일` 을 고른다 — `게시종료일`·`최근업데이트일` 은 보기 영역의 `정렬` 선택으로 고른다.
 */
export function bannerListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'exhibitions'>;
  readonly search: BannerListView;
  readonly selection: PageRowSelection<BannerRow>;
  readonly onHeaderSort: (key: BannerSortKey) => void;
}): DataTableProps<BannerRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortMeta = (key: BannerSortKey) => ({
    sort: {
      direction: headerSortDirection(active, key),
      onSort: () => onHeaderSort(key),
    },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('banner.result.selectAll'),
      rowLabel: (row) => t('banner.result.selectRow', { name: row.name }),
    }),
    {
      id: 'order',
      header: t('banner.columns.order'),
      accessorFn: (row: BannerRow) => String(row.order),
      meta: sortMeta('order'),
    },
    {
      id: 'category',
      header: t('banner.columns.category'),
      accessorFn: (row: BannerRow) => t(`banner.values.category.${row.category}`),
      meta: sortMeta('category'),
    },
    {
      id: 'name',
      header: t('banner.columns.name'),
      accessorFn: (row: BannerRow) => row.name,
      meta: sortMeta('name'),
    },
    {
      id: 'linkType',
      header: t('banner.columns.linkType'),
      accessorFn: (row: BannerRow) => t(`banner.values.linkType.${row.linkType}`),
      meta: sortMeta('linkType'),
    },
    {
      id: 'postPeriod',
      header: t('banner.columns.postPeriod'),
      cell: ({ row }: { row: { original: BannerRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">
            {t('banner.values.periodStart', { start: formatBannerDateTime(row.original.postStartAt) })}
          </span>
          <span className="block">{formatBannerDateTime(row.original.postEndAt)}</span>
        </span>
      ),
      meta: sortMeta('postStartAt'),
    },
    {
      id: 'status',
      header: t('banner.columns.status'),
      accessorFn: (row: BannerRow) => t(`banner.values.status.${row.status}`),
      meta: sortMeta('status'),
    },
    {
      id: 'timestamps',
      header: t('banner.columns.timestamps'),
      cell: ({ row }: { row: { original: BannerRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">
            {t('banner.values.registeredAt', { at: formatBannerDateTime(row.original.registeredAt) })}
          </span>
          <span className="block">{formatBannerDateTime(row.original.updatedAt)}</span>
        </span>
      ),
      meta: sortMeta('registeredAt'),
    },
  ];
}
