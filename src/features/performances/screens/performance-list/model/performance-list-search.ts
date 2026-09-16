import { z } from 'zod';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { defineSearchFields } from '@/shared/lib/search-fields';
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from '@/shared/lib/search-codecs';
import { nonEmptyArray } from '@/shared/lib/search';
import {
  performanceKeywordFields,
  performancePeriodTypes,
  performanceSortKeys,
} from '@/features/performances/model/performance';
import type { PerformanceListRequest } from '@/features/performances/model/performance';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 공연 목록의 URL 필드 선언. 이 화면은 진입 즉시 조회다(검색 표식 없음). 기본값의 근거:
 * - pageSize 100 · sortDirection desc: 목록 공통(2026-09-11 사용자 확정).
 * - sortType registeredAt · periodType performedAt: 원장 목록의 첫 항목이다. 출처가 기본값을 적지 않아 추론이다.
 * - 배열 필터의 빈 값 = 전체(조건 없음). 공연장은 하나를 고르며 비우면 조건 없음이다.
 */
export const performanceListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(performanceSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(performancePeriodTypes).optional().catch(undefined),
    defaultValue: 'performedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(performanceKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  ticketKinds: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  performanceTypes: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  sellers: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  venueId: { schema: z.string().min(1).optional().catch(undefined), defaultValue: undefined, kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type PerformanceListSearch = z.output<typeof performanceListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type PerformanceListView = ReturnType<typeof performanceListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toPerformanceListRequest(search: PerformanceListView): PerformanceListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    ticketKinds: nonEmptyArray(search.ticketKinds),
    performanceTypes: nonEmptyArray(search.performanceTypes),
    sellers: nonEmptyArray(search.sellers),
    venueId: search.venueId,
  };
}
