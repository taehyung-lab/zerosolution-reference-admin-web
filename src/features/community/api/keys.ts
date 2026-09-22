import { localizedQueryKey } from '@/api/query-key';
import type { BoardListRequest } from '../model/board';
import type { PostListRequest } from '../model/post';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const communityQueryKeys = {
  /** 게시판 계열 전체. 쓰기 성공 뒤 목록·상세를 함께 무효화하는 prefix 다. */
  boards: (locale: string) => localizedQueryKey(locale, 'community', 'boards'),
  boardList: (locale: string, request: BoardListRequest) =>
    [...localizedQueryKey(locale, 'community', 'boards', 'list'), request] as const,
  boardDetail: (locale: string, boardId: string) =>
    [...localizedQueryKey(locale, 'community', 'boards', 'detail'), boardId] as const,
  /** 게시물 계열 전체. 일괄 상태 변경이 무효화하는 prefix 다. */
  posts: (locale: string) => localizedQueryKey(locale, 'community', 'posts'),
  postList: (locale: string, request: PostListRequest) =>
    [...localizedQueryKey(locale, 'community', 'posts', 'list'), request] as const,
  postDetail: (locale: string, postId: string) =>
    [...localizedQueryKey(locale, 'community', 'posts', 'detail'), postId] as const,
  /**
   * 게시물 검색 영역의 `게시판` 선택지. 게시판 쓰기가 이 목록을 바꾸므로 게시판 mutation 도 함께
   * 무효화한다. 목록·상세 prefix 와 섞이면 검색마다 선택지까지 다시 받으므로 따로 둔다.
   */
  boardOptions: (locale: string) => localizedQueryKey(locale, 'community', 'options', 'boards'),
  /** 고른 게시판이 소유한 카테고리 선택지. 게시판마다 다르므로 ID 를 키에 싣는다. */
  boardCategoryOptions: (locale: string, boardId: string) =>
    [...localizedQueryKey(locale, 'community', 'options', 'boardCategories'), boardId] as const,
};
