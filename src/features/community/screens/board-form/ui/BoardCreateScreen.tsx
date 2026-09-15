import { useTranslation } from 'react-i18next';
import type { BoardSettings } from '@/features/community/model/board';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { boardCreateDefaults } from '../model/board-form-defaults';
import { BoardForm } from './BoardForm';
import { useBoardInputForm } from './useBoardInputForm';

/**
 * 9.1.3 게시판 등록(Figma, 2026-09-11 실측). 저장은 검증 → 확인 alert → 요청 함수 도달까지이고
 * 성공 이후는 만들지 않는다. 취소·dirty 이탈은 공용 가드가 묻는다.
 */
export function BoardCreateScreen({
  onConfirm,
  onCancel,
}: {
  readonly onConfirm: (values: BoardSettings) => void;
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
