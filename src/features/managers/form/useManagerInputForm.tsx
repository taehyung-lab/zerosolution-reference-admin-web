import { revalidateLogic, useForm, useSelector, type DeepKeys } from '@tanstack/react-form';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { useFormSections } from '@/shared/ui/form/useFormSections';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { ConfirmDialog } from '@/shared/ui/patterns/ConfirmDialog';
import type { ManagerEditInput } from './manager-form-schema';
import type { ManagerSaveForm } from './ManagerForm';

/** The reference input boundary has no mutation result or saved stage. */
export function useManagerInputForm<TInput extends ManagerEditInput, TOutput>({
  schema,
  defaults,
  fieldOrder,
  onConfirm,
}: {
  readonly schema: z.ZodType<TOutput, TInput>;
  readonly defaults: TInput;
  readonly fieldOrder: readonly DeepKeys<TInput>[];
  readonly onConfirm: (values: TOutput) => void;
}): ManagerSaveForm<TInput, TOutput> {
  const { t } = useTranslation('shared');
  const { t: manager } = useTranslation('managers');
  const [candidate, setCandidate] = useState<{ readonly values: TOutput }>();
  const form = useForm({
    defaultValues: defaults,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({ fields: {
        passwordConfirm: 'passwordConfirm' in value && 'password' in value && value.passwordConfirm !== '' && value.password !== value.passwordConfirm
          ? manager('form.errors.passwordMismatch') : undefined,
      } }),
    },
    onSubmit: ({ value }) => setCandidate({ values: schema.parse(value) }),
    onSubmitInvalid: ({ formApi }) => {
      const failed = fieldOrder.filter((name) => formApi.getFieldMeta(name)?.errors.length);
      flushSync(() => {
        sections.revealInvalid(failed);
      });
      if (failed[0])
        document.getElementById(formFieldControlId<TInput>(formApi, failed[0]))?.focus();
    },
  });
  const invalidFields = useSelector(form.store, (state) =>
    Object.keys(state.fieldMeta).filter(
      (name) => (state.fieldMeta[name as DeepKeys<TInput>]?.errors.length ?? 0) > 0,
    ),
  );
  const sections = useFormSections({ info: fieldOrder }, { invalidFields });
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  const guard = useUnsavedChangesGuard({ when: dirty });
  return {
    form,
    sections,
    guard,
    stage: { kind: 'idle' },
    submit: { run: () => { void form.validate('blur'); return form.handleSubmit(); }, isPending: false },
    dialogs: (
      <>
        {guard.dialog}
        <ConfirmDialog
          open={candidate !== undefined}
          title={t('alert.title')}
          description={t('formSave.confirmDescription')}
          confirmLabel={t('formSave.confirm')}
          cancelLabel={t('formSave.cancel')}
          onOpenChange={(open) => {
            if (!open) setCandidate(undefined);
          }}
          onConfirm={() => {
            if (!candidate) return;
            const values = candidate.values;
            setCandidate(undefined);
            onConfirm(values);
          }}
        />
      </>
    ),
  };
}
