import { useTranslation } from 'react-i18next';
import { useBoardDetail } from '@/features/community/api/useBoardDetail';
import type { BoardDetail } from '@/features/community/model/board';
import { formatDate } from '@/shared/lib/datetime';
import { useConfirmation } from '@/shared/lib/use-confirmation';
import { ConfirmDialog } from '@/shared/ui/patterns/ConfirmDialog';
import { DetailField } from '@/shared/ui/patterns/DetailField';
import { DetailStateBoundary } from '@/shared/ui/patterns/DetailStateBoundary';
import { ErrorTrace } from '@/shared/ui/patterns/ErrorTrace';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { SectionCard } from '@/shared/ui/patterns/SectionCard';
import { UpdateHistory } from '@/shared/ui/patterns/UpdateHistory';
import { Button } from '@/shared/ui/primitives/Button';
import { toBoardHistoryEntries } from '../model/board-history';

/**
 * 9.1 게시판 조회. 원문 「게시판정보를 조회할 수 있다」가 확정한 것은 업데이트 내역, `수정 버튼 →
 * 수정 화면으로 이동`, `삭제 버튼` 이고, 표시 필드는 원장 12행이 게시판 레코드의 값으로 열거한 것이다.
 *
 * 원문이 같은 화면에 있다고 적는 `카테고리`(+카테고리 설정 팝업)와 `피드백 설정` 은 항목 모양이
 * 미확인이라 만들지 않는다(판정 문서 질문 27·28). 없는 섹션을 빈 상태로 그리면 미확인이 구현으로 보인다.
 * 필드 집합·순서와 업데이트 내역 열 구성은 질문 31 이 소유한다.
 */
export function BoardDetailScreen({
  boardId,
  onEdit,
  onDelete,
}: {
  readonly boardId: string;
  readonly onEdit: (boardId: string) => void;
  readonly onDelete: (boardId: string) => void;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const detail = useBoardDetail(boardId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('board.breadcrumb.community'),
          t('board.breadcrumb.boards'),
          t('board.breadcrumb.detail'),
        ]}
        title={t('board.detail.title')}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: shared('error.kind.business'),
          notFound: shared('error.kind.notFound'),
        }}
        retryLabel={shared('error.unexpected.retry')}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <BoardDetailContent board={detail.data} onEdit={onEdit} onDelete={onDelete} />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function BoardDetailContent({
  board,
  onEdit,
  onDelete,
}: {
  readonly board: BoardDetail;
  readonly onEdit: (boardId: string) => void;
  readonly onDelete: (boardId: string) => void;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const empty = t('board.detail.emptyValue');
  const deletion = useConfirmation<string>({ run: onDelete });

  return (
    <div className="space-y-5">
      <SectionCard title={t('board.detail.section')}>
        <dl className="grid md:grid-cols-2 md:gap-x-8">
          <DetailField label={t('board.columns.type')}>
            {t(`board.values.type.${board.type}`)}
          </DetailField>
          <DetailField label={t('board.columns.category')}>
            {t(`board.values.category.${board.category}`)}
          </DetailField>
          <DetailField label={t('board.columns.name')}>{board.name || empty}</DetailField>
          <DetailField label={t('board.columns.postCount')}>{board.postCount}</DetailField>
          <DetailField label={t('board.detail.writePermission')}>
            {t(`board.values.permission.${board.writePermission}`)}
          </DetailField>
          <DetailField label={t('board.detail.readPermission')}>
            {t(`board.values.permission.${board.readPermission}`)}
          </DetailField>
          <DetailField label={t('board.columns.usage')}>
            {t(`board.values.usage.${board.usage}`)}
          </DetailField>
          <DetailField label={t('board.columns.registeredAt')}>
            {formatDate(board.registeredAt) || empty}
          </DetailField>
          <DetailField label={t('board.columns.updatedAt')}>
            {formatDate(board.updatedAt) || empty}
          </DetailField>
        </dl>
      </SectionCard>
      <SectionCard title={t('board.detail.history')}>
        <UpdateHistory
          entries={toBoardHistoryEntries(board.changeLogs, t)}
          labels={{
            date: t('board.detail.historyDate'),
            change: t('board.detail.historyChange'),
            manager: t('board.detail.historyManager'),
          }}
          emptyText={t('board.detail.historyEmpty')}
        />
      </SectionCard>
      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={() => onEdit(board.id)}>{t('board.detail.edit')}</Button>
        <Button onClick={() => deletion.requestConfirmation(board.id)}>
          {t('board.detail.delete')}
        </Button>
      </div>
      <ConfirmDialog
        open={deletion.state.kind === 'confirm'}
        title={shared('alert.title')}
        description={t('board.detail.deleteConfirm')}
        confirmLabel={shared('formSave.confirm')}
        cancelLabel={shared('formSave.cancel')}
        onOpenChange={(open) => {
          if (!open) deletion.close();
        }}
        onConfirm={deletion.confirm}
      />
    </div>
  );
}
