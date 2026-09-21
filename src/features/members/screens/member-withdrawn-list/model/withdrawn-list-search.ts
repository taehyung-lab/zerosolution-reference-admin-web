import { z } from 'zod';
import { memberAccountStatuses, memberSignupMethods } from '@/features/members/model/member';
import {
  withdrawnPeriodTypes,
  withdrawnSortKeys,
  type WithdrawnListRequest,
} from '@/features/members/model/member-records';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineGatedSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/lib/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/** 4.4 탈퇴회원 목록의 URL. 검색어는 이메일만, 기본 정렬은 탈퇴요청일 desc 다. */
export const withdrawnListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: { schema: z.enum(withdrawnSortKeys).optional().catch(undefined), defaultValue: 'withdrawnAt', kind: 'view' },
  sortDirection: { schema: z.enum(['asc', 'desc']).optional().catch(undefined), defaultValue: 'desc', kind: 'view' },
  periodType: { schema: z.enum(withdrawnPeriodTypes).optional().catch(undefined), defaultValue: 'joinedAt', kind: 'filter' },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.literal('email'), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  signupMethods: { schema: recoverArrayItems(z.enum(memberSignupMethods)), defaultValue: [], kind: 'filter' },
  accountStatuses: { schema: recoverArrayItems(z.enum(memberAccountStatuses)), defaultValue: [], kind: 'filter' },
});

export type WithdrawnListSearch = z.output<typeof withdrawnListSearch.schema>;
export type WithdrawnListView = ReturnType<typeof withdrawnListSearch.resolve>;

export function toWithdrawnListRequest(search: WithdrawnListView): WithdrawnListRequest {
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
    accountStatuses: nonEmptyArray(search.accountStatuses),
  };
}
