import { z } from 'zod';
import { standardPageSizeOptions } from '@/shared/model/list-options';
import { defineSearchFields } from '@/shared/lib/search-fields';
import {
  optionalInstant,
  optionalPositiveInteger,
  recoverArray,
  recoverArrayItems,
} from '@/shared/lib/search-codecs';
import { nonEmptyArray } from '@/shared/lib/search';
import {
  boardCategories,
  boardKeywordFields,
  boardPeriodTypes,
  boardSortKeys,
  boardTypes,
  boardUsages,
  boardPermissions,
} from '@/features/community/model/board';
import type { BoardListRequest } from '@/features/community/model/board';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 게시판 목록의 URL 필드 선언. 기본값의 근거는 다음과 같다.
 * - pageSize 100: Notion 원문 46행 + 판정 문서 질문 1(2026-09-09 결정).
 * - sortType registeredAt: Notion 원문 47행은 `등록일 or 마지막으로 설정한 값`이라 확정값이 아니다.
 *   질문 1 의 답은 보기에만 적용되므로 정렬 default 는 미확인이고 여기 값은 추론이다(원장 13행).
 * - sortDirection desc: 두 출처 모두 방향 기본값을 적지 않아 2026-09-11 사용자가 확정했다(질문 3, 목록 공통).
 * - periodType registeredAt: 기준 목록의 첫 항목이자 정렬 기본값과 같은 축이다. 출처가 기본값을 적지 않아 추론이다.
 * - 배열 필터의 빈 값 = 전체(조건 없음). Notion 원문 39행이 구분·사용상태의 default 를 전체로 적는다.
 *
 * 이 화면은 진입 즉시 조회라 검색 의도 표식이 없다(원장 7행, 2026-09-10 사용자 확정).
 */
export const boardListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(boardSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(boardPeriodTypes).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(boardKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  types: { schema: recoverArrayItems(z.enum(boardTypes)), defaultValue: [], kind: 'filter' },
  categories: {
    schema: recoverArrayItems(z.enum(boardCategories)),
    defaultValue: [],
    kind: 'filter',
  },
  usages: { schema: recoverArrayItems(z.enum(boardUsages)), defaultValue: [], kind: 'filter' },
  writePermission: {
    schema: z.enum(boardPermissions).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
  readPermission: {
    schema: z.enum(boardPermissions).optional().catch(undefined),
    defaultValue: undefined,
    kind: 'filter',
  },
});

/** route 가 검증해 넘기는 sparse URL. */
export type BoardListSearch = z.output<typeof boardListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type BoardListView = ReturnType<typeof boardListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toBoardListRequest(search: BoardListView): BoardListRequest {
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
    categories: nonEmptyArray(search.categories),
    usages: nonEmptyArray(search.usages),
    writePermission: search.writePermission,
    readPermission: search.readPermission,
  };
}
