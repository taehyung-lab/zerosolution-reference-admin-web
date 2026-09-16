import { localizedQueryKey } from '@/api/query-key';
import type { BoardListRequest } from '../model/board';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const communityQueryKeys = {
  /** 게시판 계열 전체. 쓰기 성공 뒤 목록·상세를 함께 무효화하는 prefix 다. */
  boards: (locale: string) => localizedQueryKey(locale, 'community', 'boards'),
  boardList: (locale: string, request: BoardListRequest) =>
    [...localizedQueryKey(locale, 'community', 'boards', 'list'), request] as const,
  boardDetail: (locale: string, boardId: string) =>
    [...localizedQueryKey(locale, 'community', 'boards', 'detail'), boardId] as const,
};
