import { z } from 'zod';
import { memberAccountStatuses, memberKeywordFields } from '@/features/members/model/member';
import { accessPaths, accessSortKeys, type AccessListRequest } from '@/features/members/model/member-records';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineGatedSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/model/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/** 4.5 회원접속 목록의 URL. 기간 기준은 접속일 하나라 select 없이 고정이고, 기본 정렬은 접속일 desc 다. */
export const accessListSearch = defineGatedSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: { schema: z.enum(accessSortKeys).optional().catch(undefined), defaultValue: 'accessedAt', kind: 'view' },
  sortDirection: { schema: z.enum(['asc', 'desc']).optional().catch(undefined), defaultValue: 'desc', kind: 'view' },
  periodType: { schema: z.literal('accessedAt').optional().catch(undefined), defaultValue: 'accessedAt', kind: 'filter' },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.enum(memberKeywordFields), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  accountStatuses: { schema: recoverArrayItems(z.enum(memberAccountStatuses)), defaultValue: [], kind: 'filter' },
  accessPaths: { schema: recoverArrayItems(z.enum(accessPaths)), defaultValue: [], kind: 'filter' },
});

export type AccessListSearch = z.output<typeof accessListSearch.schema>;
export type AccessListView = ReturnType<typeof accessListSearch.resolve>;
/** 다운로드 `검색결과 전체` 가 보내는 조건: 요청에서 페이지만 뺀 것. */
export type AccessListConditions = Omit<AccessListRequest, 'page' | 'pageSize'>;

export function toAccessListConditions(search: AccessListView): AccessListConditions {
  return {
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    accountStatuses: nonEmptyArray(search.accountStatuses),
    accessPaths: nonEmptyArray(search.accessPaths),
  };
}

export function toAccessListRequest(search: AccessListView): AccessListRequest {
  return { ...toAccessListConditions(search), page: search.page, pageSize: search.pageSize };
}
