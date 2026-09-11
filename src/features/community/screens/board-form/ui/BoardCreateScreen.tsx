import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { boardCreateDefaults } from '../model/board-form-defaults';
import type { BoardFormValues } from '../model/board-form-schema';
import { BoardForm } from './BoardForm';
import { useBoardInputForm } from './useBoardInputForm';

/**
 * 9.1 게시판 등록. 원문 「게시판을 등록할 수 있다」의 입력·유효성 체크 뒤 저장 확인까지 연결하고
 * 최종 입력을 필수 `onConfirm` 으로 넘긴다. 실제 저장과 완료 이동은 서버 계약 확정 후에 붙인다.
 */
export function BoardCreateScreen({
  onConfirm,
  onCancel,
}: {
  readonly onConfirm: (values: BoardFormValues) => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const input = useBoardInputForm({ defaults: boardCreateDefaults, onConfirm });

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('board.breadcrumb.community'),
          t('board.breadcrumb.boards'),
          t('board.breadcrumb.create'),
        ]}
        title={t('board.form.createTitle')}
      />
      <BoardForm
        dialogs={input.dialogs}
        form={input.form}
        onSubmit={input.submit}
        onCancel={() => input.guard.leave(onCancel)}
      />
    </section>
  );
}
