import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { classifyFormError } from '@/api/form-error';
import { createManagerMutation } from '@/features/managers/api/mutations';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { managerCreateDefaults } from '../model/manager-form-defaults';
import { toManagerCreateSettings } from '../model/manager-form-request';
import { managerCreateFieldOrder, managerCreateSchema } from '../model/manager-form-schema';
import { ManagerCreateOnlyFields, ManagerForm } from './ManagerForm';

/**
 * 11.1.3 운영자 등록. 검증 → 저장 확인 → mutation → 저장 완료 → 목록. 서버가 없는 동안 mutation 은
 * 도달만 기록하고 성공으로 끝난다(`api/scenario`). 비밀번호 확인 불일치는 blur 에서도 알린다.
 */
export function ManagerCreateScreen({
  onSaved,
  onCancel,
}: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const { t } = useTranslation('managers');
  const { locale } = useLocale();
  const create = useMutation(createManagerMutation(locale));
  const save = useSaveForm({
    schema: managerCreateSchema,
    defaultValues: managerCreateDefaults,
    sections: { info: managerCreateFieldOrder },
    save: {
      run: (values) => create.mutateAsync(toManagerCreateSettings(values)),
      isPending: create.isPending,
    },
    mapError: (error) => classifyFormError(error, managerCreateFieldOrder),
    onDone: onSaved,
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('path.settings'), t('path.managers'), t('path.create')]}
        title={t('form.createTitle')}
      />
      <ManagerForm save={save} onCancel={onCancel}>
        <ManagerCreateOnlyFields form={save.form} />
      </ManagerForm>
    </section>
  );
}
