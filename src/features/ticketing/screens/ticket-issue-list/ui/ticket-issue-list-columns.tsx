import type { TFunction } from 'i18next';
import type { TicketIssueRow, TicketIssueSortKey } from '@/features/ticketing/model/ticket-issue';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { formatCount } from '@/shared/lib/format';
import { headerSortDirection } from '@/shared/lib/list-sort';
import { maskPhone } from '@/shared/lib/mask-contact';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { TicketIssueListView } from '../model/ticket-issue-list-search';

/**
 * fact 「표」의 컬럼 구성이다: checkbox + 공연정보 · 예매정보 · 예매자정보 · 결제정보 · 발권상태 ·
 * 최근발권일 · `등록일/최근업데이트일`. 앞 넷은 한 셀에 `항목 : 값` 을 여러 줄로 쌓는 복합 셀이고,
 * frame 이 정렬 아이콘을 마지막 열에만 그리므로 header 정렬도 그 열 하나다 — 나머지 18 축은 보기
 * 영역의 `정렬` select 로 고른다.
 */
export function ticketIssueListColumns({
  t,
  locale,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'ticketing'>;
  readonly locale: string;
  readonly search: TicketIssueListView;
  readonly selection: PageRowSelection<TicketIssueRow>;
  readonly onHeaderSort: (key: TicketIssueSortKey) => void;
}): DataTableProps<TicketIssueRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const empty = t('issue.result.emptyValue');
  const text = (value: string) => (value === '' ? empty : value);
  const line = (field: string, value: string) => t('issue.columns.line', { field, value });

  return [
    selectionColumn({
      selection,
      pageLabel: t('issue.result.selectAll'),
      rowLabel: (row) => t('issue.result.selectRow', { reservationNo: row.reservationNo }),
    }),
    {
      id: 'performance',
      header: t('issue.columns.performance'),
      cell: ({ row }: { row: { original: TicketIssueRow } }) => (
        <StackedCell
          lines={[
            line(t('issue.fields.performanceType'), text(row.original.performanceType)),
            line(t('issue.fields.performanceName'), text(row.original.performanceName)),
            line(t('issue.fields.round'), t('issue.values.round', { round: row.original.round })),
            line(t('issue.fields.performedAt'), formatMinute(row.original.performedAt)),
          ]}
        />
      ),
    },
    {
      id: 'reservation',
      header: t('issue.columns.reservation'),
      cell: ({ row }: { row: { original: TicketIssueRow } }) => (
        <StackedCell
          lines={[
            line(t('issue.fields.reservationNo'), text(row.original.reservationNo)),
            line(t('issue.fields.seatNo'), text(row.original.seatNo)),
            line(t('issue.fields.grade'), text(row.original.grade)),
            line(t('issue.fields.ticketSerialNo'), maskSerial(row.original.ticketSerialNo, empty)),
          ]}
        />
      ),
    },
    {
      id: 'buyer',
      header: t('issue.columns.buyer'),
      cell: ({ row }: { row: { original: TicketIssueRow } }) => (
        <StackedCell
          lines={[
            line(t('issue.fields.buyerName'), text(row.original.buyerName)),
            // 목록이 연락처를 그리면 마스킹한 값을 보인다 — CONTACT-MASKING.
            line(t('issue.fields.buyerPhone'), text(maskPhone(row.original.buyerPhone))),
          ]}
        />
      ),
    },
    {
      id: 'payment',
      header: t('issue.columns.payment'),
      cell: ({ row }: { row: { original: TicketIssueRow } }) => (
        <StackedCell
          lines={[
            line(t('issue.fields.paymentMethod'), text(row.original.paymentMethod)),
            line(
              t('issue.fields.paymentAmount'),
              t('issue.values.amount', { formatted: formatCount(locale, row.original.paymentAmount) }),
            ),
            line(t('issue.fields.discount'), text(row.original.discount)),
            line(t('issue.fields.vendor'), t(`issue.values.vendor.${row.original.vendor}`)),
          ]}
        />
      ),
    },
    {
      id: 'issueStatus',
      header: t('issue.columns.issueStatus'),
      accessorFn: (row: TicketIssueRow) => t(`issue.values.issueStatus.${row.issueStatus}`),
    },
    {
      id: 'lastIssuedAt',
      header: t('issue.columns.lastIssuedAt'),
      accessorFn: (row: TicketIssueRow) =>
        row.lastIssuedAt === undefined ? empty : formatSecond(row.lastIssuedAt),
    },
    {
      id: 'timestamps',
      header: t('issue.columns.timestamps'),
      cell: ({ row }: { row: { original: TicketIssueRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">{formatSecond(row.original.registeredAt)}</span>
          <span className="block">{formatSecond(row.original.updatedAt)}</span>
        </span>
      ),
      meta: {
        sort: {
          direction: headerSortDirection(active, 'registeredAt'),
          onSort: () => onHeaderSort('registeredAt'),
        },
      },
    },
  ];
}

/** 복합 셀 하나. frame 은 `항목 : 값` 을 줄마다 쌓아 그린다. */
function StackedCell({ lines }: { readonly lines: readonly string[] }) {
  return (
    <span className="block">
      {lines.map((value) => (
        <span className="block whitespace-nowrap" key={value}>
          {value}
        </span>
      ))}
    </span>
  );
}

/** frame 의 `2026-01-03 14:00` 표기. */
function formatMinute(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone())}`;
}

/** frame 의 `2026-06-01 12:00:00` 표기. */
function formatSecond(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}

/** frame 의 `12****23` 표기 — 앞 둘·뒤 둘만 남기고 가운데를 가린다. */
function maskSerial(serial: string, empty: string): string {
  if (serial === '') return empty;
  if (serial.length <= 4) return serial;
  return `${serial.slice(0, 2)}${'*'.repeat(serial.length - 4)}${serial.slice(-2)}`;
}
