import { z } from 'zod';
import {
  memberAccountStatuses,
  memberKeywordFields,
  memberPeriodTypes,
  memberRestrictions,
  memberSignupMethods,
  memberSortKeys,
  type MemberListRequest,
} from '@/features/members/model/member';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineGatedSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import type { MemberListDefinition } from './member-list-definition';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 활성 회원 목록의 URL 필드 선언. 세 route 가 같은 선언을 쓰고, 정의가 노출하지 않는 조건은 요청에서 떨어진다.
 * 이 화면은 검색 전 상태를 가진다(원장 4.1: 진입 시 안내 문구, 검색 뒤 결과) — 빈 URL 이 검색 전이고
 * `searched` 표식이 조회를 연다. 기본값의 근거:
 * - pageSize 100 · sortDirection desc: 목록 공통(2026-09-11 사용자 확정).
 * - sortType joinedAt · periodType joinedAt: 원장 기간 기준·정렬 목록의 첫 항목이다.
 * - 배열 필터의 빈 값 = 전체(조건 없음).
 */
export const memberListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(memberSortKeys).optional().catch(undefined),
    defaultValue: 'joinedAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(memberPeriodTypes).optional().catch(undefined),
    defaultValue: 'joinedAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.enum(memberKeywordFields), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  signupMethods: { schema: recoverArrayItems(z.enum(memberSignupMethods)), defaultValue: [], kind: 'filter' },
  accountStatuses: { schema: recoverArrayItems(z.enum(memberAccountStatuses)), defaultValue: [], kind: 'filter' },
  restrictions: { schema: recoverArrayItems(z.enum(memberRestrictions)), defaultValue: [], kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type MemberListSearch = z.output<typeof memberListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. `searched` 는 조회를 여는 표식이다. */
export type MemberListView = ReturnType<typeof memberListSearch.resolve>;

/** 해소된 URL 값을 정의에 맞춰 요청 입력으로 옮긴다. 일반·불량 route 는 계정 상태를 고정하고, 숨긴 조건은 보내지 않는다. */
export function toMemberListRequest(search: MemberListView, definition: MemberListDefinition): MemberListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    signupMethods: nonEmptyArray(search.signupMethods),
    accountStatuses: definition.variant === 'all' ? nonEmptyArray(search.accountStatuses) : [definition.variant],
    restrictions: definition.restrictionFilter ? nonEmptyArray(search.restrictions) : undefined,
  };
}
