import { mutationOptions } from '@tanstack/react-query';
import { scenarioRequest } from '@/api/scenario';
import type { UiLocale } from '@/shared/i18n/locale';
import type { BoardCategoryItem, BoardSettings } from '../model/board';
import type { PostAnswerStatus, PostBulkChange, PostStatus, PostWriteInput } from '../model/post';
import { communityQueryKeys } from './keys';

/**
 * 게시판의 쓰기 네 개. 원문이 적은 도달 조건(등록·수정은 검증 → 저장 확인, 삭제는 삭제 확인, 카테고리 설정은
 * 팝업의 저장)까지가 화면의 책임이고 그 다음이 여기다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_BOARD_MUTATION: 이 저장소에는 서버 계약이 없어 `mutationFn` 은 도달만
 * 기록하고 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다. 성공 시 무효화할 캐시는
 * `meta.invalidates` 가 이미 선언한다.
 */
function invalidates(locale: UiLocale) {
  // 게시판이 바뀌면 게시물 검색 영역의 `게시판` 선택지도 낡는다. 두 prefix 를 함께 무효화한다.
  return {
    meta: {
      invalidates: [communityQueryKeys.boards(locale), communityQueryKeys.boardOptions(locale)],
    },
  };
}

export function createBoardMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<BoardSettings>('게시판 등록'),
    ...invalidates(locale),
  });
}

export function updateBoardMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly boardId: string; readonly settings: BoardSettings }>('게시판 수정'),
    ...invalidates(locale),
  });
}

export function deleteBoardMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<string>('게시판 삭제'),
    ...invalidates(locale),
  });
}

/**
 * 카테고리 설정 팝업(Figma 9.1.5.1)의 `저장`. 원문 50행은 추가·드래그 정렬·순서·제목 지정·삭제만 적고 저장이
 * 무엇을 확정하는지(즉시 반영인지 게시판 저장에 묶이는지)는 미확인이다(판정 문서 질문 27). 여기서는 팝업의
 * 저장이 곧 요청이며, 순서는 배열 순서다.
 */
export function saveBoardCategoriesMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly boardId: string; readonly categories: readonly BoardCategoryItem[] }>('게시판 카테고리 설정 저장'),
    ...invalidates(locale),
  });
}

/** 게시물 일괄 상태 변경이 요청하는 입력. 대상은 stable ID 배열이고 값은 cascade leaf 하나다. */
export interface PostBulkChangeRequest {
  readonly targetIds: readonly string[];
  readonly change: PostBulkChange;
}

/**
 * 결과 toolbar 의 `선택 ▾ + 변경`. 원문의 3단계(미선택 오류 → 변경 확인 → 변경 완료)까지가 화면의
 * 책임이고 그 다음이 여기다. 성공 뒤 목록을 무효화해 `변경 상태로 화면 갱신됨` 을 만든다.
 *
 * TRANSPLANT_PENDING_COMMUNITY_POST_MUTATION: 서버 계약이 없어 `mutationFn` 은 도달만 기록하고
 * 성공으로 끝난다. endpoint 가 확정되면 그 함수 본문만 바꾼다.
 */
export function bulkChangePostsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<PostBulkChangeRequest>('게시물 일괄 상태 변경'),
    meta: { invalidates: [communityQueryKeys.posts(locale)] },
  });
}

function invalidatesPosts(locale: UiLocale) {
  return { meta: { invalidates: [communityQueryKeys.posts(locale)] } };
}

/**
 * 9.2.2 조회 frame 의 `게시상태` 행: 현재 값 옆에 반대 상태로 바꾸는 버튼 하나가 있다.
 * 원문은 이 전이에 확인·완료 alert 을 적지 않으므로 만들지 않는다.
 */
export function updatePostStatusMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly postId: string; readonly status: PostStatus }>('게시물 게시상태 변경'),
    ...invalidatesPosts(locale),
  });
}

/** 9.2.2 `댓글` 줄의 `답변상태 변경`. Notion: `대기, 검토중, 완료 중 택1`, `default : 대기`. */
export function updatePostAnswerStatusMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly postId: string; readonly answerStatus: PostAnswerStatus }>('게시물 답변상태 변경'),
    ...invalidatesPosts(locale),
  });
}

/** 9.2.2 `댓글` 줄의 `선택 ▾ + 변경`. 대상은 댓글 ID 배열이다. */
export function bulkChangePostCommentsMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{
      readonly postId: string;
      readonly targetIds: readonly string[];
      readonly status: PostStatus;
    }>('게시물 댓글 일괄 상태 변경'),
    ...invalidatesPosts(locale),
  });
}

/** 9.2.2 하단 `삭제`. 공통 삭제 확인(1.1.3.1.1)을 지난 뒤가 여기다. */
export function deletePostMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<string>('게시물 삭제'),
    ...invalidatesPosts(locale),
  });
}

/** 9.2.3 등록 frame 하단 `저장`. */
export function createPostMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<PostWriteInput>('게시물 등록'),
    ...invalidatesPosts(locale),
  });
}

/** 9.2.4 수정 frame 하단 `저장`. */
export function updatePostMutation(locale: UiLocale) {
  return mutationOptions({
    mutationFn: scenarioRequest<{ readonly postId: string; readonly input: PostWriteInput }>('게시물 수정'),
    ...invalidatesPosts(locale),
  });
}
