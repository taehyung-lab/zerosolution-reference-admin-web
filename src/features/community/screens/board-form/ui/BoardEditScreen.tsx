import { safeErrorKey } from '@/api/error-copy';
import { useTranslation } from 'react-i18next';
import { useBoardDetail } from '@/features/community/api/useBoardDetail';
import type { BoardSettings } from '@/features/community/model/board';
import { DetailStateBoundary } from '@/shared/ui/patterns/DetailStateBoundary';
import { ErrorTrace } from '@/shared/ui/patterns/ErrorTrace';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { toBoardEditDefaults } from '../model/board-form-defaults';
import type { BoardFormInput } from '../model/board-form-schema';
import { BoardForm } from './BoardForm';
import { useBoardInputForm } from './useBoardInputForm';

/**
 * 9.1.4 게시판 수정(Figma, 2026-09-11 실측): 등록과 같은 항목을 조회 값으로 채워 보여 준다.
 * 조회 실패에도 제목이 남도록 헤더를 상태 경계 밖에 둔다. 폼은 조회가 성공한 뒤에만 mount 해
 * 서버 재조회가 입력 초안을 덮어쓰지 않게 한다. 진입 실패는 route loader 가 이미 처리했다.
 */
export function BoardEditScreen({
  boardId,
  onConfirm,
  onCancel,
}: {
  readonly boardId: string;
  readonly onConfirm: (request: { boardId: string; input: BoardSettings }) => void;
  readonly onCancel: () => void;
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
          t('board.breadcrumb.edit'),
        ]}
        title={t('board.form.editTitle')}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: shared(safeErrorKey(detail.error?.kind)),
          notFound: shared('error.kind.notFound'),
        }}
        retryLabel={shared('error.unexpected.retry')}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <BoardEditForm
            key={boardId}
            defaults={toBoardEditDefaults(detail.data)}
            onConfirm={(input) => onConfirm({ boardId, input })}
            onCancel={onCancel}
          />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function BoardEditForm({
  defaults,
  onConfirm,
  onCancel,
}: {
  readonly defaults: BoardFormInput;
  readonly onConfirm: (values: BoardSettings) => void;
  readonly onCancel: () => void;
}) {
  const input = useBoardInputForm({ defaults, onConfirm });
  return (
    <BoardForm
      dialogs={input.dialogs}
      form={input.form}
      onSubmit={input.submit}
      onCancel={() => input.guard.leave(onCancel)}
    />
  );
}
