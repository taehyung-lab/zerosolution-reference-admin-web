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
  bannerCategories,
  bannerKeywordFields,
  bannerLinkTypes,
  bannerPeriodTypes,
  bannerSortKeys,
  bannerStatuses,
} from '@/features/exhibitions/model/banner';
import type { BannerListRequest } from '@/features/exhibitions/model/banner';

type PageSize = (typeof standardPageSizeOptions)[number];

const pageSizeSchema = z.coerce
  .number()
  .refine((value): value is PageSize => (standardPageSizeOptions as readonly number[]).includes(value))
  .optional()
  .catch(undefined);

/**
 * 배너 목록의 URL 필드 선언. 기본값의 근거는 다음과 같다(BANNER-LIST fact).
 * - pageSize 100: Case 정의의 보기 목록에서 `100` 이 굵게 그려진 값이고 Notion 도 `default : 100`.
 *   "마지막으로 설정한 값"의 보관은 미확인이라 만들지 않는다.
 * - sortType registeredAt: Case 정의 정렬 목록의 `등록일` 이 굵고 Notion 도 `default : 등록일`.
 *   같은 원문의 `게시순서 기준으로 정렬됨` 과의 관계는 BANNER-LIST 미확인 1 이 소유한다.
 * - sortDirection desc: 목록 공통 기본 방향(2026-09-11 사용자 확정). 활성 컬럼은 첫 렌더부터 방향을 가진다.
 * - periodType registeredAt: 기간 기준 select 가 `등록일` 을 닫힌 상태로 그린다.
 * - categories ['HOME']: Notion `구분 → default : 홈`, Case 정의도 `✓ 홈` 하나만 그린다. 선택지가 하나라
 *   빈 배열은 canonical 에서 기본값으로 돌아온다.
 * - linkTypes·statuses 의 빈 배열 = 전체(조건 없음). Notion `이동경로 유형 → default : 전체`·
 *   `게시상태 → default : 전체`.
 *
 * 진입 정책은 **진입 즉시 조회**다. 시나리오 제목이 「배너 리스트를 조회할 수 있다」이고 검색 안내
 * 절이 없으며(목록 진입 판독 2026-09-10 사용자 결정), Figma 7.1 에도 검색 전 frame 이 없다. 초기화는
 * 최초 진입의 조건·조회 상태를 다시 적용한다(2026-09-15 사용자 확정). 그래서 검색 의도 표식이 없다.
 */
export const bannerListSearch = defineSearchFields({
  page: { schema: optionalPositiveInteger, defaultValue: 1, kind: 'view' },
  pageSize: { schema: pageSizeSchema, defaultValue: 100, kind: 'view' },
  sortType: {
    schema: z.enum(bannerSortKeys).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'view',
  },
  sortDirection: {
    schema: z.enum(['asc', 'desc']).optional().catch(undefined),
    defaultValue: 'desc',
    kind: 'view',
  },
  periodType: {
    schema: z.enum(bannerPeriodTypes).optional().catch(undefined),
    defaultValue: 'registeredAt',
    kind: 'filter',
  },
  startDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  endDateTime: { schema: optionalInstant, defaultValue: undefined, kind: 'filter' },
  keywords: {
    schema: recoverArray(
      z.object({ field: z.enum(bannerKeywordFields), value: z.string().trim().min(1) }),
    ),
    defaultValue: [],
    kind: 'filter',
  },
  categories: {
    schema: recoverArrayItems(z.enum(bannerCategories)),
    defaultValue: ['HOME'],
    kind: 'filter',
  },
  linkTypes: { schema: recoverArrayItems(z.enum(bannerLinkTypes)), defaultValue: [], kind: 'filter' },
  statuses: { schema: recoverArrayItems(z.enum(bannerStatuses)), defaultValue: [], kind: 'filter' },
});

/** route 가 검증해 넘기는 sparse URL. */
export type BannerListSearch = z.output<typeof bannerListSearch.schema>;
/** 화면이 한 번 해소해 쓰는 전체 검색 값. 전이는 이 값을 고쳐 canonical 로 커밋한다. */
export type BannerListView = ReturnType<typeof bannerListSearch.resolve>;

/** 해소된 URL 값을 요청 입력으로 옮긴다. Query 키도 같은 객체를 쓴다. */
export function toBannerListRequest(search: BannerListView): BannerListRequest {
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
    linkTypes: nonEmptyArray(search.linkTypes),
    statuses: nonEmptyArray(search.statuses),
  };
}
