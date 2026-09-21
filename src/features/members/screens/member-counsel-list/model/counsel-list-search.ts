import { z } from 'zod';
import { memberAccountStatuses, memberSignupMethods } from '@/features/members/model/member';
import {
  counselKeywordFields,
  counselPeriodTypes,
  counselSortKeys,
  counselStatuses,
  type CounselListRequest,
} from '@/features/members/model/member-records';
import { nonEmptyArray } from '@/shared/lib/search';
import { optionalInstant, optionalPositiveInteger, recoverArrayItems } from '@/shared/lib/search-codecs';
import { defineSearchFields } from '@/shared/lib/search-fields';
import { standardPageSizeOptions } from '@/shared/lib/list-options';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/** 4.6 회원상담 목록의 URL. 진입 즉시 조회하는 목록이라 검색 표식이 없고, 기본 정렬은 접수일 desc 다. */
export const counselListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: { schema: z.enum(counselSortKeys).optional().catch(undefined), defaultValue: 'receivedAt', kind: 'view' },
  sortDirection: { schema: z.enum(['asc', 'desc']).optional().catch(undefined), defaultValue: 'desc', kind: 'view' },
  periodType: { schema: z.enum(counselPeriodTypes).optional().catch(undefined), defaultValue: 'receivedAt', kind: 'filter' },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArrayItems(z.object({ field: z.enum(counselKeywordFields), value: z.string().trim().min(1) })),
    defaultValue: [],
    kind: 'filter',
  },
  signupMethods: { schema: recoverArrayItems(z.enum(memberSignupMethods)), defaultValue: [], kind: 'filter' },
  accountStatuses: { schema: recoverArrayItems(z.enum(memberAccountStatuses)), defaultValue: [], kind: 'filter' },
  inquiryType: { schema: z.string().min(1).optional().catch(undefined), defaultValue: undefined, kind: 'filter' },
  statuses: { schema: recoverArrayItems(z.enum(counselStatuses)), defaultValue: [], kind: 'filter' },
});

export type CounselListSearch = z.output<typeof counselListSearch.schema>;
export type CounselListView = ReturnType<typeof counselListSearch.resolve>;
/** 다운로드 `검색결과 전체` 가 보내는 조건: 요청에서 페이지만 뺀 것. */
export type CounselListConditions = Omit<CounselListRequest, 'page' | 'pageSize'>;

export function toCounselListConditions(search: CounselListView): CounselListConditions {
  return {
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    signupMethods: nonEmptyArray(search.signupMethods),
    accountStatuses: nonEmptyArray(search.accountStatuses),
    inquiryType: search.inquiryType,
    statuses: nonEmptyArray(search.statuses),
  };
}

export function toCounselListRequest(search: CounselListView): CounselListRequest {
  return { ...toCounselListConditions(search), page: search.page, pageSize: search.pageSize };
}
