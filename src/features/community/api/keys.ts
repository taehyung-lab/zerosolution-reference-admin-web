import { localizedQueryKey } from '@/api/query-key';
import type { BoardListRequest } from '../model/board';

/** 캐시 주소만 소유하는 leaf 모듈. 화면·model·query 를 import 하지 않는다. */
export const communityQueryKeys = {
  boardList: (locale: string, request: BoardListRequest) =>
    [...localizedQueryKey(locale, 'community', 'boards', 'list'), request] as const,
};
