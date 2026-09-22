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
  postAnswerStatuses,
  postCategories,
  postKeywordFields,
  postMemberTypes,
  postPeriodTypes,
  postSortKeys,
  postStatuses,
} from '@/features/community/model/post';
import type { PostListRequest } from '@/features/community/model/post';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 게시물 목록의 URL 필드 선언. 기본값의 근거는 다음과 같다(POST-LIST fact).
 * - pageSize 100: Case 정의의 보기 목록에서 `100` 이 굵게 그려진 값이고 Notion 도 `default : 100`.
 *   "마지막으로 설정한 값"의 보관은 미확인이라 만들지 않는다.
 * - sortType registeredAt: Case 정의 정렬 목록의 `등록일` 이 굵고 Notion 도 `default : 등록일`.
 * - sortDirection desc: 목록 공통 기본 방향(2026-09-11 사용자 확정). 활성 컬럼은 첫 렌더부터 방향을 가진다.
 * - periodType registeredAt: 기간 기준 select 가 `등록일` 을 닫힌 상태로 그린다.
 * - 배열 필터의 빈 값 = 전체(조건 없음). Notion 이 구분·답변상태·사용상태의 default 를 전체로 적는다.
 * - boardId·memberType 의 `전체` 는 조건 없음이라 URL 에 나가지 않는다(단일선택 계약).
 *
 * 진입 정책은 **진입 즉시 조회**다. Figma 9.2.1 은 검색전 frame 없이 결과가 있는 화면 하나뿐이고,
 * 같은 파일의 gate 가 있는 표면(9.2.5.4 작성자 검색)은 검색전·검색후 frame 을 따로 그린다. Notion 의
 * `초기화 → … 검색 전 상태로 변경` 문장과는 어긋나므로 fact 의 미확인 1 이 그 충돌을 소유한다.
 * 그래서 검색 의도 표식(`searched`)이 없다.
 */
export const postListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(postSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(postPeriodTypes).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(postKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  categories: {
    schema: recoverArrayItems(z.enum(postCategories)),
    defaultValue: [],
    kind: 'filter',
  },
  /** 선택지가 서버에서 오므로 enum 이 아니다. 없는 ID 는 서버가 빈 결과로 답한다. */
  boardId: {
    schema: z.string().trim().min(1).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
  memberType: {
    schema: z.enum(postMemberTypes).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
  answerStatuses: {
    schema: recoverArrayItems(z.enum(postAnswerStatuses)),
    defaultValue: [],
    kind: 'filter',
  },
  statuses: { schema: recoverArrayItems(z.enum(postStatuses)), defaultValue: [], kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type PostListSearch = z.output<typeof postListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type PostListView = ReturnType<typeof postListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toPostListRequest(search: PostListView): PostListRequest {
  return {
    page: search.page,
    pageSize: search.pageSize,
    sortType: search.sortType,
    sortDirection: search.sortDirection,
    periodType: search.periodType,
    startDateTime: search.startDateTime,
    endDateTime: search.endDateTime,
    keywords: nonEmptyArray(search.keywords),
    categories: nonEmptyArray(search.categories),
    boardId: search.boardId,
    memberType: search.memberType,
    answerStatuses: nonEmptyArray(search.answerStatuses),
    statuses: nonEmptyArray(search.statuses),
  };
}
