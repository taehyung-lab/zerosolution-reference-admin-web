import { z } from 'zod';
import { memberKeywordFields } from '@/features/members/model/member';
import {
  appealPeriodTypes,
  appealRestrictions,
  appealResults,
  appealSortKeys,
  appealStatuses,
  type AppealListRequest,
} from '@/features/members/model/member-records';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/model/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/** 4.7 소명신청 목록의 URL. 진입 즉시 조회하는 목록이라 검색 표식이 없고, 기본 정렬은 소명 신청일 desc 다. */
export const appealListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: { schema: z.enum(appealSortKeys).optional().catch(undefined), defaultValue: 'appliedAt', kind: 'view' },
  sortDirection: { schema: z.enum(['asc', 'desc']).optional().catch(undefined), defaultValue: 'desc', kind: 'view' },
  periodType: { schema: z.enum(appealPeriodTypes).optional().catch(undefined), defaultValue: 'appliedAt', kind: 'filter' },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.enum(memberKeywordFields), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  restrictions: { schema: recoverArrayItems(z.enum(appealRestrictions)), defaultValue: [], kind: 'filter' },
  statuses: { schema: recoverArrayItems(z.enum(appealStatuses)), defaultValue: [], kind: 'filter' },
  results: { schema: recoverArrayItems(z.enum(appealResults)), defaultValue: [], kind: 'filter' },
});

export type AppealListSearch = z.output<typeof appealListSearch.schema>;
export type AppealListView = ReturnType<typeof appealListSearch.resolve>;

export function toAppealListRequest(search: AppealListView): AppealListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    restrictions: nonEmptyArray(search.restrictions),
    statuses: nonEmptyArray(search.statuses),
    results: nonEmptyArray(search.results),
  };
}
