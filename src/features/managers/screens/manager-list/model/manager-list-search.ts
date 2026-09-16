import { z } from 'zod';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { defineGatedSearchFields } from '@/shared/lib/search-fields';
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from '@/shared/lib/search-codecs';
import { nonEmptyArray } from '@/shared/lib/search';
import {
  managerAccountStatuses,
  managerKeywordFields,
  managerPeriodTypes,
  managerRegistrationRoutes,
  managerSortKeys,
} from '@/features/managers/model/manager';
import type { ManagerListRequest } from '@/features/managers/model/manager';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 운영자 목록의 URL 필드 선언. 이 화면은 검색 전 상태를 가진다(원장 11.1: 진입 시 안내 문구, 검색 뒤 결과) —
 * 빈 URL 이 검색 전이고 `searched` 표식이 조회를 연다. 기본값의 근거:
 * - pageSize 100 · sortDirection desc: 목록 공통(2026-09-11 사용자 확정).
 * - sortType joinedAt · periodType joinedAt: 원장 기간 기준·정렬 목록의 첫 항목이다. 출처가 기본값을 적지 않아 추론이다.
 * - 배열 필터의 빈 값 = 전체(조건 없음). 권한은 전체 권한 중 하나이며 비우면 조건 없음이다.
 */
export const managerListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(managerSortKeys).optional().catch(undefined),
    defaultValue: 'joinedAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(managerPeriodTypes).optional().catch(undefined),
    defaultValue: 'joinedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(managerKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  types: { schema: recoverArrayItems(z.string().min(1)), defaultValue: [], kind: 'filter' },
  permission: { schema: z.string().min(1).optional().catch(undefined), defaultValue: undefined, kind: 'filter' },
  statuses: {
    schema: recoverArrayItems(z.enum(managerAccountStatuses)),
    defaultValue: [],
    kind: 'filter',
  },
  registrationRoutes: {
    schema: recoverArrayItems(z.enum(managerRegistrationRoutes)),
    defaultValue: [],
    kind: 'filter',
  },
});

/** route 가 검증해 넘기는 sparse URL. */
export type ManagerListSearch = z.output<typeof managerListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. `searched` 는 조회를 여는 표식이다. */
export type ManagerListView = ReturnType<typeof managerListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toManagerListRequest(search: ManagerListView): ManagerListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    types: nonEmptyArray(search.types),
    permission: search.permission,
    statuses: nonEmptyArray(search.statuses),
    registrationRoutes: nonEmptyArray(search.registrationRoutes),
  };
}
