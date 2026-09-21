import { z } from 'zod';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { defineSearchFields } from '@/shared/lib/search-fields';
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from '@/shared/lib/search-codecs';
import { nonEmptyArray } from '@/shared/lib/search';
import {
  printerKeywordFields,
  printerPeriodTypes,
  printerPurposes,
  printerSortKeys,
  printerStatuses,
  printerUsages,
} from '@/features/ticketing/model/printer';
import type { PrinterListRequest } from '@/features/ticketing/model/printer';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 스마트프린터 목록의 URL 필드 선언. 기본값의 근거는 다음과 같다.
 * - pageSize 100: Notion 원문 `보기 → default : 100 or 마지막으로 설정한 값` 의 확정 값과
 *   Figma Case 정의 `보기 100`. "마지막으로 설정한 값"의 보관은 미확인이라 만들지 않는다.
 * - sortType registeredAt: Notion 원문 `정렬 → default : 등록일 or 마지막으로 설정한 값`.
 * - sortDirection desc: 목록 공통 기본 방향(2026-09-11 사용자 확정).
 * - periodType registeredAt: 원문 기간 기준 목록(등록일·최근업데이트일)의 첫 항목이다. 출처가
 *   기본값을 적지 않아 추론이다.
 * - 배열 필터의 빈 값 = 전체(조건 없음). 원문이 상태·용도·사용상태의 default 를 전체로 적는다.
 *
 * 이 화면에는 검색 gate 가 없다(원문 절 제목이 「스마트프린터 리스트를 조회할 수 있다」이고
 * Figma 에 검색전 frame 이 없다). 그래서 `searched` 표식도 없다.
 */
export const printerListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(printerSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(printerPeriodTypes).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(printerKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  statuses: { schema: recoverArrayItems(z.enum(printerStatuses)), defaultValue: [], kind: 'filter' },
  purposes: { schema: recoverArrayItems(z.enum(printerPurposes)), defaultValue: [], kind: 'filter' },
  usages: { schema: recoverArrayItems(z.enum(printerUsages)), defaultValue: [], kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type PrinterListSearch = z.output<typeof printerListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type PrinterListView = ReturnType<typeof printerListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toPrinterListRequest(search: PrinterListView): PrinterListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    statuses: nonEmptyArray(search.statuses),
    purposes: nonEmptyArray(search.purposes),
    usages: nonEmptyArray(search.usages),
  };
}
