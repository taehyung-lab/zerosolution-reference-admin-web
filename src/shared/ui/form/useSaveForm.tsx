import {
  revalidateLogic,
  useForm,
  useSelector,
  type DeepKeys,
} from '@tanstack/react-form';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { formFieldControlId } from './FormField';
import { FormSaveDialogs, type FormSaveFailure } from './FormSaveDialogs';
import { useUnsavedChangesGuard } from './UnsavedChangesGuard';
import { useFormSections } from './useFormSections';

export type SaveStage<TOutput> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'confirming'; readonly values: TOutput }
  | { readonly kind: 'saved' }
  | { readonly kind: 'failed'; readonly root: FormSaveFailure };

/** What a rejected save means for the form. `undefined` from the mapper means nothing to show. */
export interface FormErrorOutcome<TField extends string> {
  readonly fields: readonly TField[];
  readonly root?: FormSaveFailure;
}

/**
 * The confirm → save → acknowledge lifecycle of a page-level create/edit form. It owns the form
 * instance, the one save stage, the invalid-submit reveal/focus, server error placement, and
 * the dirty-leave guard; the caller owns everything that carries meaning — schema, defaults,
 * which fields sit in which section, the mutation, how a rejection is classified, and where the
 * user goes afterwards. Every input is an opaque value or callback, so the hook knows no domain.
 *
 * `dialogs` is the one node the caller renders for every dialog this lifecycle can open: the
 * dirty-leave question and the save confirm/acknowledge pair. Returning them assembled keeps the
 * blocker and its dialog together — a guard that blocks without a rendered dialog would trap the
 * user on the screen.
 *
 * On success the saved values become the dirty baseline (`reset(values, { keepDefaultValues })`):
 * the guard releases because nothing is unsaved, not because a flag says so. While the save is
 * pending the guard refuses a leave without asking (the progress overlay is the message). `keepDefaultValues`
 * matters — `useForm` re-applies the caller's options on every render and would otherwise roll
 * the values back to the original defaults (form-core 1.33.5 `update`).
 */
export function useSaveForm<TInput, TOutput, TSection extends string>({
  schema,
  defaultValues,
  sections,
  save,
  mapError,
  onDone,
}: {
  readonly schema: z.ZodType<TOutput, TInput>;
  readonly defaultValues: TInput;
  readonly sections: Readonly<Record<TSection, readonly DeepKeys<TInput>[]>>;
  readonly save: {
    readonly run: (values: TOutput) => Promise<unknown>;
    readonly isPending: boolean;
  };
  readonly mapError: (
    error: unknown
  ) => FormErrorOutcome<DeepKeys<TInput>> | undefined;
  readonly onDone: () => void;
}) {
  const { t } = useTranslation('shared');
  const [stage, setStage] = useState<SaveStage<TOutput>>({ kind: 'idle' });
  const fieldOrder = (
    Object.values(sections) as readonly (readonly DeepKeys<TInput>[])[]
  ).flat();

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      setStage({ kind: 'confirming', values: schema.parse(value) });
    },
    onSubmitInvalid: ({ formApi }) => {
      const invalid = Object.keys(formApi.state.fieldMeta).filter(
        (name) =>
          (formApi.getFieldMeta(name as DeepKeys<TInput>)?.errors.length ?? 0) >
          0
      ) as DeepKeys<TInput>[];
      revealAndFocus(invalid);
    },
  });

  const invalidFields = useSelector(form.store, (state) =>
    Object.keys(state.fieldMeta).filter(
      (name) =>
        (state.fieldMeta[name as DeepKeys<TInput>]?.errors.length ?? 0) > 0
    )
  );
  const sectionState = useFormSections(sections, { invalidFields });
  const isDirty = useSelector(form.store, (state) => state.isDirty);
  const guard = useUnsavedChangesGuard({
    when: isDirty,
    refuseSilently: save.isPending,
  });

  function revealAndFocus(names: readonly DeepKeys<TInput>[], defer = false) {
    let target: DeepKeys<TInput> | undefined;
    flushSync(() => {
      target = sectionState.revealInvalid(names);
    });
    if (target === undefined) return;
    const id = formFieldControlId<TInput>(target);
    if (defer) window.setTimeout(() => document.getElementById(id)?.focus(), 0);
    else document.getElementById(id)?.focus();
  }

  // Ordinary validation never touches `onServer`, so a stale server rejection would block every
  // later submit. Each submit starts from a clean server slate; the server decides again.
  function clearServerErrors() {
    for (const name of fieldOrder) {
      if (form.getFieldMeta(name)?.errorMap.onServer === undefined) continue;
      form.setFieldMeta(name, (previous) => ({
        ...previous,
        errorMap: { ...previous?.errorMap, onServer: undefined },
      }));
    }
  }

  async function confirm() {
    if (stage.kind !== 'confirming') return;
    const { values } = stage;
    flushSync(() => setStage({ kind: 'idle' }));
    try {
      await save.run(values);
      form.reset(form.state.values, { keepDefaultValues: true });
      setStage({ kind: 'saved' });
    } catch (error: unknown) {
      const outcome = mapError(error);
      if (outcome === undefined) return;
      if (outcome.root !== undefined)
        setStage({ kind: 'failed', root: outcome.root });
      if (outcome.fields.length === 0) return;
      const rejected = fieldOrder.filter((field) =>
        outcome.fields.includes(field)
      );
      for (const field of rejected) {
        form.setFieldMeta(field, (previous) => ({
          ...previous,
          errorMap: {
            ...previous?.errorMap,
            onServer: t('formError.rejectedByServer'),
          },
        }));
      }
      revealAndFocus(rejected, true);
    }
  }

  const submit = {
    isPending: save.isPending,
    run: () => {
      clearServerErrors();
      return form.handleSubmit();
    },
    confirm,
    cancel: () => setStage({ kind: 'idle' }),
    acknowledge: () => {
      setStage({ kind: 'idle' });
      onDone();
    },
  };

  return {
    form,
    sections: sectionState,
    stage,
    guard,
    submit,
    dialogs: (
      <>
        {guard.dialog}
        <FormSaveDialogs
          stage={stage.kind}
          pending={save.isPending}
          onConfirm={() => {
            void submit.confirm();
          }}
          onCancel={submit.cancel}
          onAcknowledge={submit.acknowledge}
        />
      </>
    ),
  };
}
