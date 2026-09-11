import { queryOptions } from '@tanstack/react-query';
import { communityQueryKeys } from './keys';
import { readBoardListPage } from '../fixtures/boards';
import type { BoardListPage, BoardListRequest } from '../model/board';

/**
 * 게시판 목록 조회의 유일한 query 선언. route loader 와 화면이 같은 정의를 소비한다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_QUERY: queryFn 은 아직 임시 응답 함수다. 실제 endpoint 가
 * 확정되면 여기서 생성된 operation 을 호출하고 fixtures 를 지운다. 요청 입력과 캐시 키는 화면이
 * 해소한 같은 값이므로 그때도 바뀌지 않는다.
 */
export function boardListQueryOptions(locale: string, request: BoardListRequest) {
  return queryOptions<BoardListPage>({
    queryKey: communityQueryKeys.boardList(locale, request),
    queryFn: () => readBoardListPage(request),
  });
}
