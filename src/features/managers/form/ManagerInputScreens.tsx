import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/patterns/PageHeader';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { ManagerCreateIdentityFields, ManagerForm } from './ManagerForm';
import { managerCreateDefaults } from './manager-form-defaults';
import {
  managerCreateFieldOrder,
  managerCreateSchema,
  managerEditFieldOrder,
  managerEditSchema,
  type ManagerCreateValues,
  type ManagerEditInput,
  type ManagerEditValues,
} from './manager-form-schema';
import type { ManagerFormOptions } from './useManagerFormOptions';
import { useManagerInputForm } from './useManagerInputForm';

export function ManagerCreateInputScreen({
  onConfirm,
  optionsForType,
}: {
  readonly onConfirm: (values: ManagerCreateValues) => void;
  readonly optionsForType: (type: string) => ManagerFormOptions;
}) {
  const { t } = useTranslation('managers');
  const navigate = useNavigate();
  const save = useManagerInputForm({
    schema: managerCreateSchema,
    defaults: managerCreateDefaults,
    fieldOrder: managerCreateFieldOrder,
    onConfirm,
  });
  return (
    <section>
      <PageHeader breadcrumb={t('form.createBreadcrumb')} title={t('form.createTitle')} />
      <ManagerForm
        save={save}
        identity={<ManagerCreateIdentityFields form={save.form} />}
        optionsForType={optionsForType}
        onCancel={() => {
          void navigate({ to: '/managers' });
        }}
      />
    </section>
  );
}

export function ManagerEditInputScreen({
  managerId,
  defaults,
  optionsForType,
  onConfirm,
}: {
  readonly managerId: string;
  readonly defaults: ManagerEditInput;
  readonly optionsForType: (type: string) => ManagerFormOptions;
  readonly onConfirm: (request: { readonly managerId: string; readonly input: ManagerEditValues }) => void;
}) {
  const { t } = useTranslation('managers');
  const navigate = useNavigate();
  const save = useManagerInputForm({
    schema: managerEditSchema,
    defaults,
    fieldOrder: managerEditFieldOrder,
    onConfirm: (input) => onConfirm({ managerId, input }),
  });
  return (
    <section>
      <PageHeader breadcrumb={t('form.editBreadcrumb')} title={t('form.editTitle')} />
      <ManagerForm
        save={save}
        identity={<FormTextField readOnly label={t('form.id')} value={managerId} />}
        optionsForType={optionsForType}
        onCancel={() => {
          void navigate({ to: '/managers/$managerId', params: { managerId } });
        }}
      />
    </section>
  );
}
