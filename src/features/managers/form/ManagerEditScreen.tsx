import { classifyFormError } from '@/api/form-error';
import { useLocale } from '@/shared/i18n/locale-context';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { DetailStateBoundary } from '@/shared/ui/patterns/DetailStateBoundary';
import { ErrorTrace } from '@/shared/ui/patterns/ErrorTrace';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { safeErrorKey } from '../model/error-copy';
import { toManagerEditDefaults } from './manager-form-defaults';
import { toManagerUpdateRequest } from './manager-form-request';
import {
  managerEditFieldOrder,
  managerEditSchema,
  type ManagerEditInput,
} from './manager-form-schema';
import { ManagerForm } from './ManagerForm';
import { useManagerEditDetail } from './useManagerEditDetail';
import { useUpdateManagerMutation } from './useUpdateManagerMutation';

export function ManagerEditScreen({
  managerId,
}: {
  readonly managerId: string;
}) {
  const { t } = useTranslation('managers');
  const { t: sharedT } = useTranslation('shared');
  const detail = useManagerEditDetail(managerId);

  // The header stays outside the state boundary so the title remains visible while the detail
  // query is in an error state.
  return (
    <section>
      <PageHeader breadcrumb={t('form.editBreadcrumb')} title={t('form.editTitle')} />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: detail.error ? sharedT(safeErrorKey(detail.error.kind)) : t('form.loadError'),
          notFound: t('detail.notFound'),
        }}
        retryLabel={t('result.retry')}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <ManagerEditForm
            defaults={toManagerEditDefaults(detail.data)}
            displayId={detail.data.id ?? managerId}
            managerId={managerId}
          />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function ManagerEditForm({
  defaults,
  displayId,
  managerId,
}: {
  readonly defaults: ManagerEditInput;
  readonly displayId: string;
  readonly managerId: string;
}) {
  const { t } = useTranslation('managers');
  const { locale } = useLocale();
  const navigate = useNavigate();
  const mutation = useUpdateManagerMutation(locale, managerId);
  const goToDetail = () => {
    void navigate({ to: '/managers/$managerId', params: { managerId } });
  };
  const save = useSaveForm({
    schema: managerEditSchema,
    defaultValues: defaults,
    sections: { info: managerEditFieldOrder },
    save: {
      run: (values) => mutation.mutateAsync(toManagerUpdateRequest(values)),
      isPending: mutation.isPending,
    },
    mapError: (error) => classifyFormError(error, managerEditFieldOrder),
    onDone: goToDetail,
  });
  return (
    <ManagerForm
      save={save}
      identity={<FormTextField readOnly label={t('form.id')} value={displayId} />}
      onCancel={goToDetail}
    />
  );
}
