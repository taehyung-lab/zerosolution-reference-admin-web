import type { PrinterKeywordField, PrinterSortKey } from '@/features/ticketing/model/printer';
import type { KeywordFilterItem } from '@/shared/model/use-keyword-draft';
import type { UtcPeriodRange } from '@/shared/model/use-period-draft';
import { printerListCanonicalSchema } from './printer-list-search';
import type { PrinterListSearch, ResolvedPrinterListSearch } from './printer-list-search';

/**
 * URL 전이 정책. 모두 순수 함수이고 결과는 canonical sparse search 다.
 *
 * - 보기·정렬 변경은 첫 페이지로 돌아간다.
 * - 페이지 이동은 나머지 조건을 보존한다.
 * - 정렬 방향은 활성 컬럼 헤더 클릭에서만 뒤집힌다(목록 공통, 2026-09-11 사용자 확정).
 *   Select 로 다른 정렬을 고르면 방향은 유지된다.
 */
function commit(next: Record<string, unknown>): PrinterListSearch {
  return printerListCanonicalSchema.parse(next);
}

export function toPageSizeSearch(
  search: ResolvedPrinterListSearch,
  pageSize: number,
): PrinterListSearch {
  return commit({ ...search, pageSize, page: 1 });
}

export function toSortSearch(
  search: ResolvedPrinterListSearch,
  sortType: PrinterSortKey,
): PrinterListSearch {
  return commit({ ...search, sortType, page: 1 });
}

export function toPageSearch(
  search: ResolvedPrinterListSearch,
  page: number,
): PrinterListSearch {
  return commit({ ...search, page });
}

/** 활성 컬럼은 방향을 뒤집고, 다른 컬럼은 오름차순부터 시작한다. */
export function toHeaderSortSearch(
  search: ResolvedPrinterListSearch,
  sortType: PrinterSortKey,
): PrinterListSearch {
  const active = search.sortType === sortType;
  return commit({
    ...search,
    sortType,
    sortDirection: active && search.sortDirection === 'asc' ? 'desc' : 'asc',
    page: 1,
  });
}

/** 검색 제출: 확정한 필터·기간·검색어를 첫 페이지로 커밋한다. 보기·정렬은 현재 값을 유지한다. */
export function toSubmittedSearch(
  search: ResolvedPrinterListSearch,
  input: {
    readonly filters: Partial<ResolvedPrinterListSearch>;
    readonly range: UtcPeriodRange;
    readonly keywords: readonly KeywordFilterItem<PrinterKeywordField>[];
  },
): PrinterListSearch {
  return commit({
    ...search,
    ...input.filters,
    ...input.range,
    keywords: input.keywords,
    page: 1,
  });
}
