import { queryOptions } from '@tanstack/react-query';
import { inlineProgress } from '@/api/query-meta';
import type { UiLocale } from '@/shared/i18n/locale';
import { communityQueryKeys } from './keys';
import { readBoardDetail, readBoardListPage } from '../fixtures/boards';
import {
  readPostBoardCategoryOptions,
  readPostBoardOptions,
  readPostDetail,
  readPostListPage,
} from '../fixtures/posts';
import type { BoardDetail, BoardListPage, BoardListRequest } from '../model/board';
import type {
  PostBoardCategoryOption,
  PostBoardOption,
  PostDetail,
  PostListPage,
  PostListRequest,
} from '../model/post';

/**
 * 게시판 목록 조회의 유일한 query 선언. route loader 와 화면이 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가
 * 확정되면 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이
 * 해소한 같은 값이므로 그때도 바뀌지 않는다.
 */
export function boardListQueryOptions(locale: UiLocale, request: BoardListRequest) {
  return queryOptions<BoardListPage>({
    queryKey: communityQueryKeys.boardList(locale, request),
    queryFn: () => readBoardListPage(request),
  });
}

/**
 * 게시판 한 건의 조회 query. 조회 화면과 수정 화면이 같은 정의를 쓴다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_QUERY: queryFn 은 임시 응답 함수다. 실제 endpoint 가 확정되면
 * 생성된 operation 으로 바꾸고 fixtures 를 지운다. 키는 ID 기반이라 그때도 바뀌지 않는다.
 */
export function boardDetailQueryOptions(locale: UiLocale, boardId: string) {
  return queryOptions<BoardDetail>({
    queryKey: communityQueryKeys.boardDetail(locale, boardId),
    queryFn: () => readBoardDetail(boardId),
  });
}

/**
 * 게시물 목록 조회의 유일한 query 선언. route 와 화면이 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_POST_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가
 * 확정되면 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이
 * 해소한 같은 값이므로 그때도 바뀌지 않는다.
 */
export function postListQueryOptions(locale: UiLocale, request: PostListRequest) {
  return queryOptions<PostListPage>({
    queryKey: communityQueryKeys.postList(locale, request),
    queryFn: () => readPostListPage(request),
  });
}

/**
 * 게시물 검색 영역의 `게시판` 선택지. 서버가 주는 목록이라 필드 안에서 로딩·실패·재시도를 그린다
 * (`inlineProgress` — 화면 전체를 덮는 진행 표시를 열지 않는다). 검색마다 다시 받을 값이 아니라
 * `staleTime: Infinity` 이고, 게시판 쓰기가 무효화한다.
 */
export function postBoardOptionsQuery(locale: UiLocale) {
  return queryOptions<readonly PostBoardOption[]>({
    queryKey: communityQueryKeys.boardOptions(locale),
    queryFn: () => readPostBoardOptions(),
    staleTime: Infinity,
    ...inlineProgress,
  });
}

/** 게시물 한 건의 조회 query. 조회 화면과 수정 화면이 같은 정의를 쓴다. */
export function postDetailQueryOptions(locale: UiLocale, postId: string) {
  return queryOptions<PostDetail>({
    queryKey: communityQueryKeys.postDetail(locale, postId),
    queryFn: () => readPostDetail(postId),
  });
}

/**
 * 등록·수정 폼의 `카테고리` 선택지. 게시판을 고르기 전에는 조회하지 않는다(선행 조건이 없는 빈 상태).
 */
export function postBoardCategoryOptionsQuery(locale: UiLocale, boardId: string) {
  return queryOptions<readonly PostBoardCategoryOption[]>({
    queryKey: communityQueryKeys.boardCategoryOptions(locale, boardId),
    queryFn: () => readPostBoardCategoryOptions(boardId),
    enabled: boardId !== '',
    staleTime: Infinity,
    ...inlineProgress,
  });
}
