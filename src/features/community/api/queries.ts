import { queryOptions } from '@tanstack/react-query';
import type { UiLocale } from '@/shared/i18n/locale';
import { communityQueryKeys } from './keys';
import { readBoardDetail, readBoardListPage } from '../fixtures/boards';
import type { BoardDetail, BoardListPage, BoardListRequest } from '../model/board';

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
