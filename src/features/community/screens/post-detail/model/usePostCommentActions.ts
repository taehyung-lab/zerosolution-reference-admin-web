import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  bulkChangePostCommentsMutation,
  updatePostAnswerStatusMutation,
} from '@/features/community/api/mutations';
import type { PostAnswerStatus, PostStatus } from '@/features/community/model/post';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSelectionGate } from '@/shared/hooks/use-selection-gate';

/**
 * 9.2.2 `피드백 정보 > 댓글` 줄이 가진 두 업무의 전제와 실행. 확인창의 상태와 렌더는 Actions 컴포넌트가 갖는다.
 *
 * - `답변상태 변경`: 고른 답변상태를 게시물에 적용한다. Notion 은 `대기, 검토중, 완료 중 택1` 과
 *   `default : 대기` 만 적고 확인·완료 alert 을 적지 않으므로 만들지 않는다.
 * - `선택 ▾ + 변경`: 고른 댓글의 게시상태를 바꾼다. 미선택 거절은 목록과 같은 공용 문구를 쓴다
 *   (제품 공통 일괄변경 문장, POST-DETAIL 미확인 2).
 */
export function usePostCommentActions({
  postId,
  selectedIds,
}: {
  readonly postId: string;
  readonly selectedIds: readonly string[];
}) {
  const { t } = useTranslation('shared');
  const { locale } = useLocale();
  const gate = useSelectionGate(selectedIds.length);
  const bulkChange = useMutation(bulkChangePostCommentsMutation(locale));
  const answerStatus = useMutation(updatePostAnswerStatusMutation(locale));

  return {
    gate,
    prepareBulkChange: (status: PostStatus | undefined) => {
      if (!gate.requireSelection(t('bulkAction.missingSelection'))) return undefined;
      if (status === undefined) return undefined;
      return { postId, targetIds: [...selectedIds], status };
    },
    runBulkChange: (request: { readonly targetIds: readonly string[]; readonly status: PostStatus }) =>
      bulkChange.mutateAsync({ postId, ...request }),
    changeAnswerStatus: (next: PostAnswerStatus) =>
      answerStatus.mutateAsync({ postId, answerStatus: next }),
  };
}
