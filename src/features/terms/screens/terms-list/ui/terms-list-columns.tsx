import type { TFunction } from 'i18next';
import type { TermsRow, TermsSortKey } from '@/features/terms/model/terms';
import { displayTimeZone, formatDate, formatTimeInTimeZone } from '@/shared/lib/datetime';
import { headerSortDirection } from '@/shared/lib/list-sort';
import type { PageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { DataTableProps } from '@/shared/ui/list/DataTable';
import { selectionColumn } from '@/shared/ui/list/selection-column';
import type { TermsListView } from '../model/terms-list-search';

/**
 * Figma `11.2.1. 약관 리스트` table 의 컬럼 구성이다(2026-09-22 aside 실측, 100% 렌더 판독).
 * 행 checkbox + 버전 · 본문 · 시행일 · 게시 상태 · 게시일 · `등록일/최근업데이트일`.
 *
 * 표시 형식도 그 frame 이 정한다.
 * - `버전` 은 저장된 숫자·점 값 앞에 `V` 를 붙여 `V1.2` 로 그린다. 조회 frame 은 같은 값을 `V 1.0`
 *   으로 띄어 그리므로 두 자리의 표기를 각자의 문구가 소유한다(TERMS-LIST 미확인 5).
 * - `본문` 은 한 줄로 줄이고 넘치는 부분을 `…` 로 자른다.
 * - 일시는 `2026-06-01 12:00:00` 로 초까지 그린다.
 * - 마지막 컬럼은 두 일시를 한 셀에 쌓고 정렬 축은 `등록일` 하나다 — `최근업데이트일` 정렬은 보기
 *   영역의 `정렬` 선택으로 고른다.
 *
 * 정렬 가능한 컬럼은 Case 정의 정렬 목록의 7개와 같은 집합이다. frame 은 정렬 표시를 마지막 컬럼에만
 * 그렸지만 정렬 목록이 열거한 축은 헤더에서도 고를 수 있게 둔다(저장소의 다른 목록과 같은 처리).
 */
export function termsListColumns({
  t,
  search,
  selection,
  onHeaderSort,
}: {
  readonly t: TFunction<'terms'>;
  readonly search: TermsListView;
  readonly selection: PageRowSelection<TermsRow>;
  readonly onHeaderSort: (key: TermsSortKey) => void;
}): DataTableProps<TermsRow>['columns'] {
  const active = { type: search.sortType, direction: search.sortDirection };
  const sortMeta = (key: TermsSortKey) => ({
    sort: {
      direction: headerSortDirection(active, key),
      onSort: () => onHeaderSort(key),
    },
  });

  return [
    selectionColumn({
      selection,
      pageLabel: t('terms.result.selectAll'),
      rowLabel: (row) => t('terms.result.selectRow', { version: versionLabel(t, row) }),
    }),
    {
      id: 'version',
      header: t('terms.columns.version'),
      accessorFn: (row: TermsRow) => versionLabel(t, row),
      meta: sortMeta('version'),
    },
    {
      id: 'body',
      header: t('terms.columns.body'),
      cell: ({ row }: { row: { original: TermsRow } }) => (
        <p className="line-clamp-1 max-w-160">{row.original.body}</p>
      ),
      meta: sortMeta('body'),
    },
    {
      id: 'effectiveAt',
      header: t('terms.columns.effectiveAt'),
      accessorFn: (row: TermsRow) => formatDateTime(row.effectiveAt),
      meta: sortMeta('effectiveAt'),
    },
    {
      id: 'status',
      header: t('terms.columns.status'),
      accessorFn: (row: TermsRow) => t(`terms.values.status.${row.status}`),
      meta: sortMeta('status'),
    },
    {
      id: 'publishedAt',
      header: t('terms.columns.publishedAt'),
      accessorFn: (row: TermsRow) => formatDateTime(row.publishedAt),
      meta: sortMeta('publishedAt'),
    },
    {
      id: 'timestamps',
      header: t('terms.columns.timestamps'),
      cell: ({ row }: { row: { original: TermsRow } }) => (
        <span className="block whitespace-nowrap">
          <span className="block">{formatDateTime(row.original.registeredAt)}</span>
          <span className="block">{formatDateTime(row.original.updatedAt)}</span>
        </span>
      ),
      meta: sortMeta('registeredAt'),
    },
  ];
}

/** frame 의 목록 표기 `V1.2`. 저장된 값은 숫자와 점뿐이다. */
function versionLabel(t: TFunction<'terms'>, row: TermsRow): string {
  return t('terms.values.version', { version: row.version });
}

/** frame 의 `2026-06-01 12:00:00` 표기. 하루 경계와 시각은 브라우저 zone 으로 읽는다. */
function formatDateTime(instant: string): string {
  const day = formatDate(instant);
  if (day === '') return '';
  return `${day} ${formatTimeInTimeZone(instant, displayTimeZone(), 'second')}`;
}
