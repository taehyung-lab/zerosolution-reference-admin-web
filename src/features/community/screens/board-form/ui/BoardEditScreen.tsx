import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { updateBoardMutation } from '@/features/community/api/mutations';
import { useBoardDetail } from '@/features/community/api/useBoardDetail';
import type { BoardDetail } from '@/features/community/model/board';
import { useLocale } from '@/shared/i18n/locale-context';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { toBoardEditDefaults } from '../model/board-form-defaults';
import { toBoardSettings } from '../model/board-form-request';
import { boardFormFieldOrder, boardFormSchema } from '../model/board-form-schema';
import { BoardForm } from './BoardForm';

/**
 * 9.1.4 게시판 수정(Figma, 2026-09-11 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function BoardEditScreen({
  boardId,
  onSaved,
  onCancel,
}: {
  readonly boardId: string;
  readonly onSaved: (boardId: string) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const detail = useBoardDetail(boardId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('board.breadcrumb.community'),
          t('board.breadcrumb.boards'),
          t('board.breadcrumb.detail'),
          t('board.breadcrumb.edit'),
        ]}
        title={t('board.form.editTitle')}
      />
      <DetailStateBoundary query={detail}>
        {(board) => (
          <BoardEditForm key={board.id} board={board} onSaved={() => onSaved(board.id)} onCancel={onCancel} />
        )}
      </DetailStateBoundary>
    </section>
  );
}

function BoardEditForm({
  board,
  onSaved,
  onCancel,
}: {
  readonly board: BoardDetail;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { locale } = useLocale();
  const update = useMutation(updateBoardMutation(locale));
  const save = useSaveForm({
    schema: boardFormSchema,
    defaultValues: toBoardEditDefaults(board),
    sections: { info: boardFormFieldOrder },
    save: {
      run: (values) => update.mutateAsync({ boardId: board.id, settings: toBoardSettings(values) }),
      isPending: update.isPending,
    },
    mapError: (error) => classifyFormError(error, boardFormFieldOrder),
    onDone: onSaved,
  });
  return <BoardForm save={save} onCancel={onCancel} />;
}
