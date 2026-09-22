import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  PostAnswerStatus,
  PostComment,
  PostStatus,
} from '@/features/community/model/post';
import { postAnswerStatuses, postStatuses } from '@/features/community/model/post';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import { AlertDialog } from '@/shared/ui/dialog/AlertDialog';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DataTable } from '@/shared/ui/list/DataTable';
import { EmptyState } from '@/shared/ui/feedback/EmptyState';
import { Button } from '@/shared/ui/primitives/Button';
import { Select } from '@/shared/ui/primitives/Select';
import { usePostCommentActions } from '../model/usePostCommentActions';
import { postCommentColumns } from './post-comment-columns';

/**
 * 9.2.2 `피드백 정보` 의 댓글 줄과 표(2026-09-22 실측). 줄의 왼쪽은 `댓글 (n)` · 답변상태 select ·
 * `답변상태 변경`, 오른쪽은 `선택 ▾` · `변경` 이다. 선택은 이 표가 들고 있고 URL 로 나가지 않는다 —
 * 독립 route 가 없는 내장 collection 이기 때문이다.
 *
 * frame 이 그리는 댓글 검색 입력과 `댓글등록` 버튼은 이 화면에 없다. 검색이 무엇을 좁히는지와 등록
 * 팝업(9.2.5.3)의 입력·저장이 원문에 없어 `범위 내 보류`이며 POST-DETAIL 이 목적지를 이름으로 적는다.
 */
export function PostCommentsSection({
  postId,
  comments,
  answerStatus,
}: {
  readonly postId: string;
  readonly comments: readonly PostComment[];
  readonly answerStatus: PostAnswerStatus | undefined;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const selection = usePageRowSelection({
    rows: comments,
    getId: (row) => row.id,
    resetKey: comments.map((row) => row.id).join(','),
  });
  const actions = usePostCommentActions({ postId, selectedIds: selection.selectedIds });
  // Notion `댓글 → 답변상태 변경 → default : 대기`. 이미 정해진 답변상태가 있으면 그 값에서 시작한다.
  const [answerDraft, setAnswerDraft] = useState<PostAnswerStatus>(answerStatus ?? 'PENDING');
  const [statusDraft, setStatusDraft] = useState<PostStatus | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  const confirmation = useConfirmation({
    run: async (request: { readonly targetIds: readonly string[]; readonly status: PostStatus }) => {
      await actions.runBulkChange(request);
      setCompleted(true);
    },
    description: shared('bulkAction.confirm'),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {t('post.detail.comments.title', { count: comments.length })}
        </span>
        <Select
          aria-label={t('post.detail.comments.answerStatus')}
          className="w-40"
          options={postAnswerStatuses.map((value) => ({
            value,
            label: t(`post.values.answerStatus.${value}`),
          }))}
          value={answerDraft}
          onValueChange={(value) => {
            if (value !== null) setAnswerDraft(value as PostAnswerStatus);
          }}
        />
        <Button
          className="bg-white text-neutral-900 underline ring-1 ring-neutral-300"
          onClick={() => void actions.changeAnswerStatus(answerDraft)}
        >
          {t('post.detail.comments.changeAnswerStatus')}
        </Button>
        <span className="grow" />
        <Select
          aria-label={t('post.detail.comments.bulkField')}
          className="w-40"
          placeholder={t('post.result.bulkPlaceholder')}
          options={postStatuses.map((value) => ({
            value,
            label: t(`post.values.status.${value}`),
          }))}
          value={statusDraft ?? null}
          onValueChange={(value) => setStatusDraft(value === null ? undefined : (value as PostStatus))}
        />
        <Button
          onClick={() => {
            const request = actions.prepareBulkChange(statusDraft);
            if (request !== undefined) confirmation.request(request);
          }}
        >
          {t('post.result.bulkChange')}
        </Button>
      </div>
      {comments.length === 0 ? (
        <EmptyState>{t('post.detail.comments.empty')}</EmptyState>
      ) : (
        <DataTable
          rows={comments}
          columns={postCommentColumns({ t, selection })}
          getRowId={(row) => row.id}
        />
      )}
      <SelectionAlert controller={actions.gate} />
      {confirmation.dialog}
      <AlertDialog
        open={completed}
        onOpenChange={(open) => {
          if (!open) setCompleted(false);
        }}
        title={shared('alert.title')}
        description={shared('bulkAction.completed')}
        acknowledgeLabel={shared('bulkAction.acknowledge')}
        onAcknowledge={selection.clear}
      />
    </div>
  );
}
