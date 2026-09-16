import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createBoardMutation } from '@/features/community/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { boardCreateDefaults } from '../model/board-form-defaults';
import { toBoardSettings } from '../model/board-form-request';
import { boardFormFieldOrder, boardFormSchema } from '../model/board-form-schema';
import { BoardForm } from './BoardForm';

/**
 * 9.1.3 게시판 등록(Figma, 2026-09-11 실측). 검증 → 저장 확인 → mutation → 저장 완료 → 목록.
 * 서버가 없는 동안 mutation 은 미연결 실패로 끝나 폼 위에 공용 실패 문구가 남고 그 다음은 일어나지 않는다.
 */
export function BoardCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('community');
  const { locale } = useLocale();
  const create = useMutation(createBoardMutation(locale));
  const save = useSaveForm({
    schema: boardFormSchema,
    defaultValues: boardCreateDefaults,
    sections: { info: boardFormFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toBoardSettings(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, boardFormFieldOrder),
    onDone: onSaved,
  });

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
      <BoardForm save={save} onCancel={onCancel} />
    </section>
  );
}
