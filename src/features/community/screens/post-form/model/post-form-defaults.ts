import type { PostDetail } from '@/features/community/model/post';
import { formatDate } from '@/shared/lib/datetime';
import type { PostFormInput } from './post-form-schema';

/**
 * 등록 화면의 초기 값 — Figma 9.2.3 등록 frame 이 보여 주는 첫 상태(2026-09-22 실측): 구분 `일반`,
 * 게시판·카테고리는 `선택`(빈 값), 게시상태 `게시`. 작성자는 `본인으로 작성하기` 가 켜져 있어
 * 답변받을 이메일 입력이 비활성이고 빈 값이다.
 */
export function postCreateDefaults(today: string): PostFormInput {
  return {
    category: 'GENERAL',
    boardId: '',
    boardCategoryId: '',
    boardCategoryRequired: false,
    answerEmail: '',
    answerEmailRequired: false,
    title: '',
    content: '',
    registeredAt: today,
    status: 'IN_USE',
  };
}

/**
 * 수정 화면은 조회한 게시물의 값을 그대로 싣는다(Figma 9.2.4). 그 frame 은 `답변받을 이메일 *` 을
 * 필수 입력으로 그리므로 수정에서는 항상 필수다.
 */
export function toPostEditDefaults(detail: PostDetail): PostFormInput {
  return {
    category: detail.category,
    boardId: detail.boardId,
    boardCategoryId: detail.boardCategoryId ?? '',
    boardCategoryRequired: detail.boardCategoryId !== undefined,
    answerEmail: detail.answerEmail ?? '',
    answerEmailRequired: true,
    title: detail.title ?? '',
    content: detail.content,
    registeredAt: formatDate(detail.registeredAt),
    status: detail.status,
  };
}
