import { mutationOptions } from '@tanstack/react-query';
import { notConnected } from '@/api/not-connected';
import type { UiLocale } from '@/shared/i18n/locale';
import type { BoardCategoryItem, BoardSettings } from '../model/board';
import { communityQueryKeys } from './keys';

/**
 * 게시판의 쓰기 네 개. 원문이 적은 도달 조건(등록·수정은 검증 → 저장 확인, 삭제는 삭제 확인, 카테고리 설정은
 * 팝업의 저장)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_MUTATION: 이 저장소에는 서버 계약이 없어 모두 미연결 오류로 끝난다.
 * 화면은 그 실패를 공용 문구로 보여 주고 성공 이후(완료 alert·이동·캐시 갱신)는 만들지 않는다.
 * endpoint 가 확정되면 `mutationFn` 만 바꾼다. 성공 시 무효화할 캐시는 `meta.invalidates` 가 이미 선언한다.
 */
function invalidates(locale: UiLocale) {
  return { meta: { invalidates: [communityQueryKeys.boards(locale)] } };
}

export function createBoardMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<BoardSettings>('community.board.create'),
    ...invalidates(locale),
  });
}

export function updateBoardMutation(locale: UiLocale, boardId: string) {
  return mutationOptions({
    mutationFn: notConnected<BoardSettings>(`community.board.update:${boardId}`),
    ...invalidates(locale),
  });
}

export function deleteBoardMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: notConnected<string>('community.board.delete'),
    ...invalidates(locale),
  });
}

/**
 * 카테고리 설정 팝업(Figma 9.1.5.1)의 `저장`. 원문 50행은 추가·드래그 정렬·순서·제목 지정·삭제만 적고 저장이
 * 무엇을 확정하는지(즉시 반영인지 게시판 저장에 묶이는지)는 미확인이다(판정 문서 질문 27). 여기서는 팝업의
 * 저장이 곧 요청이며, 순서는 배열 순서다.
 */
export function saveBoardCategoriesMutation(locale: UiLocale, boardId: string) {
  return mutationOptions({
    mutationFn: notConnected<readonly BoardCategoryItem[]>(
      `community.board.categories:${boardId}`,
    ),
    ...invalidates(locale),
  });
}
