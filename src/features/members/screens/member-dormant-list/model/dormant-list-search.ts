import { z } from 'zod';
import { memberAccountStatuses, memberKeywordFields, memberSignupMethods } from '@/features/members/model/member';
import { dormantPeriodTypes, dormantSortKeys, type DormantListRequest } from '@/features/members/model/member-records';
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

/** 4.3 휴면회원 목록의 URL. 검색 전 상태를 가지며 기본 정렬은 가입일 desc 다. */
export const dormantListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: { schema: z.enum(dormantSortKeys).optional().catch(undefined), defaultValue: 'joinedAt', kind: 'view' },
  sortDirection: { schema: z.enum(['asc', 'desc']).optional().catch(undefined), defaultValue: 'desc', kind: 'view' },
  periodType: { schema: z.enum(dormantPeriodTypes).optional().catch(undefined), defaultValue: 'joinedAt', kind: 'filter' },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.enum(memberKeywordFields), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  signupMethods: { schema: recoverArrayItems(z.enum(memberSignupMethods)), defaultValue: [], kind: 'filter' },
  accountStatuses: { schema: recoverArrayItems(z.enum(memberAccountStatuses)), defaultValue: [], kind: 'filter' },
});

export type DormantListSearch = z.output<typeof dormantListSearch.schema>;
export type DormantListView = ReturnType<typeof dormantListSearch.resolve>;

export function toDormantListRequest(search: DormantListView): DormantListRequest {
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
