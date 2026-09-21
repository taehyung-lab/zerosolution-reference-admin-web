import { z } from 'zod';
import {
  contentKeywordFields,
  contentPeriodTypes,
  contentSortKeys,
  contentUsageStatuses,
  type ContentListRequest,
} from '@/features/performances/model/content';
import { nonEmptyArray } from '@/shared/lib/search';
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from '@/shared/lib/search-codecs';
import { defineSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/lib/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 5.1 콘텐츠 목록의 URL 필드 선언. 이 화면은 진입 즉시 조회다(검색 표식 없음) — Notion 절 제목이
 * 「공연 리스트를 조회할 수 있다」이므로 원장 README 의 진입 판독 규칙이 즉시 조회로 읽는다. 기본값의 근거:
 * - pageSize 100 · sortType 등록일 · periodType 공연일: Figma `5.1.1. 콘텐츠 리스트`(`129:21882`)의
 *   보기·정렬·기간 기준 닫힌 상태(2026-09-17 원본 해상도 판독).
 * - sortDirection desc: 목록 공통(2026-09-11 사용자 확정).
 * - 배열 필터의 빈 값 = 전체(조건 없음, Notion `default : 전체`). 공연장은 하나를 고르며 비우면 조건 없음이다.
 */
export const contentListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(contentSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(contentPeriodTypes).optional().catch(undefined),
    defaultValue: 'performedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(contentKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  ticketKinds: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  performanceTypes: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  usageStatuses: { schema: recoverArrayItems(z.enum(contentUsageStatuses)), defaultValue: [], kind: 'filter' },
  venueId: { schema: z.string().min(1).optional().catch(undefined), defaultValue: undefined, kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type ContentListSearch = z.output<typeof contentListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type ContentListView = ReturnType<typeof contentListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toContentListRequest(search: ContentListView): ContentListRequest {
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
    usageStatuses: nonEmptyArray(search.usageStatuses),
    venueId: search.venueId,
  };
}
