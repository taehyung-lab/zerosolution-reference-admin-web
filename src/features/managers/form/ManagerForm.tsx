import { FormCancelButton } from '@/shared/ui/form/FormCancelButton';
import type { FieldForm } from '@/shared/ui/form/FormField';
import { FormSaveFailureMessage } from '@/shared/ui/form/FormSaveDialogs';
import { FormSelectField } from '@/shared/ui/form/FormSelectField';
import { FormSubmitButton } from '@/shared/ui/form/FormSubmitButton';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import type { useSaveForm } from '@/shared/ui/form/useSaveForm';
import { SectionCard } from '@/shared/ui/patterns/SectionCard';
import { useSelector, type DeepValue } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ManagerCreateInput, ManagerEditInput } from './manager-form-schema';
import { useManagerFormOptions, type ManagerFormOptions } from './useManagerFormOptions';

/** The save lifecycle a screen declares with `useSaveForm`; this component only consumes it. */
export type ManagerSaveForm<TValues, TOutput> = Pick<
  ReturnType<typeof useSaveForm<TValues, TOutput, 'info'>>,
  'sections' | 'stage' | 'guard' | 'dialogs'
> & {
  readonly form: FieldForm<TValues> & Pick<ReturnType<typeof useSaveForm<TValues, TOutput, 'info'>>['form'], 'setFieldValue'> & {
    readonly store: Parameters<typeof useSelector<{ values: TValues }>>[0];
  };
  readonly submit: {
    readonly run: () => Promise<void>;
    readonly isPending: boolean;
  };
};

/**
 * The manager form that both the create and the edit screen render. It owns everything the two
 * screens share: option sources, the type policy ("유형 변경시 권한은 초기화됨", Notion),
 * the common fields in Figma reading order, and
 * the section/action shell. A screen declares `useSaveForm` (schema, defaults, mutation,
 * destination) and passes only what differs: the `identity` slot before the name
 * (create: ID and password pair, edit: read-only ID) and where cancel goes.
 *
 * Generic with the edit input as the lower bound because `FormApi<ManagerCreateInput>` is not
 * assignable to `FormApi<ManagerEditInput>` (TanStack's form types are not covariant in their
 * values), while both inputs contain exactly these seven fields. The `DeepValue` casts below are
 * the price of that generic: TypeScript cannot reduce `DeepValue<TValues, 'permissionId'>` to
 * `string` for an unresolved `TValues`, though the bound guarantees it.
 */
export function ManagerForm<TValues extends ManagerEditInput, TOutput>({
  save,
  identity,
  onCancel,
  optionsForType,
}: {
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
  readonly optionsForType?: (type: string) => ManagerFormOptions;
}) {
  const { form } = save;
  const type = useSelector(form.store, (state) => state.values.type);
  return optionsForType ? (
    <ManagerFormContent
      save={save}
      identity={identity}
      onCancel={onCancel}
      options={optionsForType(type)}
    />
  ) : (
    <ManagerFormWithQueries save={save} identity={identity} onCancel={onCancel} type={type} />
  );
}

function ManagerFormWithQueries<TValues extends ManagerEditInput, TOutput>({
  type,
  ...props
}: {
  readonly type: string;
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
}) {
  const options = useManagerFormOptions(type);
  return <ManagerFormContent {...props} options={options} />;
}

function ManagerFormContent<TValues extends ManagerEditInput, TOutput>({
  save,
  identity,
  onCancel,
  options,
}: {
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
  readonly options: ManagerFormOptions;
}) {
  const { t } = useTranslation('managers');
  const { form } = save;
  const clearTypeDependents = () => {
    form.setFieldValue('permissionId', '' as DeepValue<TValues, 'permissionId'>);
    form.setFieldValue('agencyId', '' as DeepValue<TValues, 'agencyId'>);
  };

  return (
    <>
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title={t('form.section')} {...save.sections.sectionProps('info')}>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <FormSelectField
              form={form}
              label={t('form.type')}
              name="type"
              options={options.type.items}
              state={options.type.state}
              onRetry={options.type.retry}
              onValueChange={clearTypeDependents}
              placeholder={t('form.selectPlaceholder')}
              required
            />
            <FormSelectField
              form={form}
              disabled={!options.typeSelected}
              label={t('form.permission')}
              name="permissionId"
              options={options.permission.items}
              state={options.permission.state}
              onRetry={options.permission.retry}
              placeholder={t('form.selectPlaceholder')}
              required
            />
            {options.isAgency ? (
              <FormSelectField
                form={form}
                description={t('form.agencyDescription')}
                label={t('form.agency')}
                name="agencyId"
                options={options.agency.items}
                state={options.agency.state}
                onRetry={options.agency.retry}
                placeholder={t('form.selectPlaceholder')}
                required
              />
            ) : null}
            {identity}
            <FormTextField
              form={form}
              label={t('form.name')}
              name="name"
              placeholder={t('form.namePlaceholder')}
              required
            />
            <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5">
              <FormTextField
                form={form}
                label={t('form.phone')}
                name="phone"
                placeholder={t('form.phonePlaceholder')}
                required
              />
              <FormTextField
                form={form}
                label={t('form.email')}
                name="email"
                placeholder={t('form.emailPlaceholder')}
                required
              />
            </div>
            <FormTextField
              form={form}
              label={t('form.organization')}
              name="organization"
              placeholder={t('form.organizationPlaceholder')}
            />
          </div>
        </SectionCard>
        <div className="mt-8 flex justify-center gap-3">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton
            disabled={save.submit.isPending}
            onClick={() => save.guard.leave(onCancel)}
          />
        </div>
      </form>
    </>
  );
}

/** The create-only identity fields: ID plus the password pair. Edit shows the ID as read-only text instead. */
export function ManagerCreateIdentityFields({
  form,
}: {
  readonly form: FieldForm<ManagerCreateInput>;
}) {
  const { t } = useTranslation('managers');
  return (
    <>
      <FormTextField
        form={form}
        autoComplete="off"
        label={t('form.id')}
        name="id"
        placeholder={t('form.idPlaceholder')}
        required
      />
      <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5">
        <FormTextField
          form={form}
          autoComplete="new-password"
          label={t('form.password')}
          name="password"
          placeholder={t('form.passwordPlaceholder')}
          required
          type="password"
        />
        <FormTextField
          form={form}
          autoComplete="new-password"
          label={t('form.passwordConfirm')}
          name="passwordConfirm"
          required
          type="password"
        />
      </div>
    </>
  );
}
