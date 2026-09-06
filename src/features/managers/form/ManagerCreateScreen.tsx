import { classifyFormError } from '@/api/form-error';
import { useLocale } from '@/shared/i18n/locale-context';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCreateManagerMutation } from './useCreateManagerMutation';
import { managerCreateDefaults } from './manager-form-defaults';
import { toManagerCreateRequest } from './manager-form-request';
import { managerCreateFieldOrder, managerCreateSchema } from './manager-form-schema';
import { ManagerCreateIdentityFields, ManagerForm } from './ManagerForm';

export function ManagerCreateScreen() {
  const { t } = useTranslation('managers');
  const { locale } = useLocale();
  const navigate = useNavigate();
  const mutation = useCreateManagerMutation(locale);
  const goToList = () => {
    void navigate({ to: '/managers' });
  };
  const save = useSaveForm({
    schema: managerCreateSchema,
    defaultValues: managerCreateDefaults,
    sections: { info: managerCreateFieldOrder },
    save: {
      run: (values) => mutation.mutateAsync(toManagerCreateRequest(values)),
      isPending: mutation.isPending,
    },
    mapError: (error) => classifyFormError(error, managerCreateFieldOrder),
    onDone: goToList,
  });

  return (
    <section>
      <PageHeader breadcrumb={t('form.createBreadcrumb')} title={t('form.createTitle')} />
      <ManagerForm
        save={save}
        identity={<ManagerCreateIdentityFields form={save.form} />}
        onCancel={goToList}
      />
    </section>
  );
}
