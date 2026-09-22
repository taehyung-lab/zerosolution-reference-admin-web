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
  termsKeywordFields,
  termsPeriodTypes,
  termsSortKeys,
  termsStatuses,
} from '@/features/terms/model/terms';
import type { TermsListRequest } from '@/features/terms/model/terms';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 약관 목록의 URL 필드 선언. 기본값의 근거는 다음과 같다(TERMS-LIST fact).
 * - pageSize 100: Case 정의의 보기 목록에서 `100` 이 굵게 그려진 값이고 Notion 도 `default : 100`.
 *   "마지막으로 설정한 값"의 보관은 미확인이라 만들지 않는다.
 * - sortType registeredAt: Case 정의 정렬 목록의 `등록일` 이 굵고 Notion 도 `default : 등록일`.
 * - sortDirection desc: 목록 공통 기본 방향(2026-09-11 사용자 확정). 활성 컬럼은 첫 렌더부터 방향을 가진다.
 * - periodType registeredAt: 기간 기준 select 가 `등록일` 을 닫힌 상태로 그린다.
 * - statuses 의 빈 배열 = 전체(조건 없음). Notion `게시 상태 → default : 전체`.
 *
 * 진입 정책은 **진입 즉시 조회**다. Figma 11.2 에는 검색 전 frame 이 없고 리스트·Case 정의 두 frame
 * 뿐이며, 같은 파일에서 검색 gate 를 가진 11.1 운영자는 「화면 진입시, 검색 안내 화면이 제공된다」
 * 절과 검색전 frame 을 따로 갖는데 약관 원문에는 그 절이 없다. Notion 의
 * `초기화 → … 검색 전 상태로 변경` 문장과는 어긋나므로 fact 의 미확인 3 이 그 충돌을 소유한다.
 * 그래서 검색 의도 표식(`searched`)이 없다.
 */
export const termsListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(termsSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(termsPeriodTypes).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(termsKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  statuses: { schema: recoverArrayItems(z.enum(termsStatuses)), defaultValue: [], kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type TermsListSearch = z.output<typeof termsListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type TermsListView = ReturnType<typeof termsListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toTermsListRequest(search: TermsListView): TermsListRequest {
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
  };
}
