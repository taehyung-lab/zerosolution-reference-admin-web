import type { TFunction } from 'i18next';
import type { PrinterRow, PrinterSortKey } from '@/features/ticketing/model/printer';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { PrinterListView } from "../model/printer-list-search";

/**
 * Figma `6.7.1.1 스마트프린터 리스트` table 의 컬럼 구성이다(2026-09-15 렌더 실측).
 * 행 checkbox + 기기명·시리얼번호·모델명·제조사·(네트워크)·보관위치·기기상태·조치사항·구매일·용도·
 * 사용상태·`등록일/최근업데이트일`.
 *
 * `네트워크` 컬럼은 frame 에 있으나 그 값의 출처가 조회·등록·수정 frame 과 Notion 어디에도 없어
 * 이 표에서 보류한다(미확인). 마지막 컬럼은 frame 대로 두 일시를 한 셀에 쌓아 보여 주고 정렬 축은
 * `등록일` 하나다 — 업데이트일 정렬은 보기 영역의 `정렬` 선택으로 고른다.
 */
export function printerListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'ticketing'>;
  readonly search: PrinterListView;
  readonly selection: PageRowSelection<PrinterRow>;
  readonly onHeaderSort: (key: PrinterSortKey) => void;
}): DataTableProps<PrinterRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortMeta = (key: PrinterSortKey) => ({
    sort: {
      direction: headerSortDirection(active, key),
      onSort: () => onHeaderSort(key),
    },
  });
  const empty = t('printer.detail.emptyValue');
  const text = (value: string) => (value === '' ? empty : value);

  return [
    selectionColumn({
      selection,
      pageLabel: t('printer.result.selectAll'),
      rowLabel: (row) => t('printer.result.selectRow', { name: row.name }),
    }),
    {
      id: 'name',
      header: t('printer.columns.name'),
      accessorFn: (row: PrinterRow) => row.name,
      meta: sortMeta('name'),
    },
    {
      id: 'serialNo',
      header: t('printer.columns.serialNo'),
      accessorFn: (row: PrinterRow) => row.serialNo,
      meta: sortMeta('serialNo'),
    },
    {
      id: 'model',
      header: t('printer.columns.model'),
      accessorFn: (row: PrinterRow) => text(row.model),
      meta: sortMeta('model'),
    },
    {
      id: 'manufacturer',
      header: t('printer.columns.manufacturer'),
      accessorFn: (row: PrinterRow) => text(row.manufacturer),
      meta: sortMeta('manufacturer'),
    },
    {
      id: 'location',
      header: t('printer.columns.location'),
      accessorFn: (row: PrinterRow) => text(row.location),
      meta: sortMeta('location'),
    },
    {
      id: 'status',
      header: t('printer.columns.status'),
      accessorFn: (row: PrinterRow) => t(`printer.values.status.${row.status}`),
      meta: sortMeta('status'),
    },
    {
      id: 'measures',
      header: t('printer.columns.measures'),
      accessorFn: (row: PrinterRow) => text(row.measures),
      meta: sortMeta('measures'),
    },
    {
      id: 'purchasedAt',
      header: t('printer.columns.purchasedAt'),
      accessorFn: (row: PrinterRow) => text(row.purchasedAt),
      meta: sortMeta('purchasedAt'),
    },
    {
      id: 'purpose',
      header: t('printer.columns.purpose'),
      accessorFn: (row: PrinterRow) => t(`printer.values.purpose.${row.purpose}`),
      meta: sortMeta('purpose'),
    },
    {
      id: 'usage',
      header: t('printer.columns.usage'),
      accessorFn: (row: PrinterRow) => t(`printer.values.usage.${row.usage}`),
      meta: sortMeta('usage'),
    },
    {
      id: 'timestamps',
      header: t('printer.columns.timestamps'),
      cell: ({ row }: { row: { original: PrinterRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">{formatDateTime(row.original.registeredAt)}</span>
          <span className="block">{formatDateTime(row.original.updatedAt)}</span>
        </span>
      ),
      meta: sortMeta('registeredAt'),
    },
  ];
}

/** frame 의 `2026-06-01 12:00:00` 표기. 하루 경계와 시각은 브라우저 zone 으로 읽는다. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
