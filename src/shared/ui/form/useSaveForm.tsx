import {
  revalidateLogic,
  useForm,
  useSelector,
  type DeepKeys,
} from '@tanstack/react-form';
import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { formFieldControlId } from './FormField';
import { FormSaveDialogs, type FormSaveFailure } from './FormSaveDialogs';
import { useUnsavedChangesGuard } from './UnsavedChangesGuard';
import { useFormSections } from '../../hooks/use-form-sections';

export type SaveStage<TOutput, TInput = unknown> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'confirming'; readonly values: TOutput; readonly submitted: TInput }
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
 * On success the server-normalized defaults become the dirty baseline when the feature maps them
 * from the mutation result; otherwise the exact submitted input snapshot does. The guard releases
 * because nothing is unsaved, not because a flag says so. Pending exits are refused silently.
 */
export function useSaveForm<TInput, TOutput, TSection extends string, TSaveResult = unknown>({
  schema,
  defaultValues,
  resetKey,
  sections,
  blurValidator,
  save,
  mapError,
  onDone,
}: {
  readonly schema: z.ZodType<TOutput, TInput>;
  readonly defaultValues: TInput;
  readonly resetKey?: string | number;
  readonly sections: Readonly<Record<TSection, readonly DeepKeys<TInput>[]>>;
  /**
   * Fields that must also say something on blur, before the form has ever been submitted — a
   * cross-field mismatch the user should see when leaving the second input rather than at submit.
   * Values in, one message per field out; the hook never reads a field name or its meaning.
   */
  readonly blurValidator?: (
    values: TInput
  ) => Partial<Record<DeepKeys<TInput>, string | undefined>>;
  readonly save: {
    readonly run: (values: TOutput) => Promise<TSaveResult>;
    readonly getDefaultValues?: (result: TSaveResult) => TInput | undefined;
    readonly isPending: boolean;
  };
  readonly mapError: (
    error: unknown
  ) => FormErrorOutcome<DeepKeys<TInput>> | undefined;
  readonly onDone: () => void;
}) {
  const { t } = useTranslation('shared');
  const [stage, setStage] = useState<SaveStage<TOutput, TInput>>({ kind: 'idle' });
  const [formDefaults, setFormDefaults] = useState(defaultValues);
  const previousResetKey = useRef(resetKey);
  const fieldOrder = (
    Object.values(sections) as readonly (readonly DeepKeys<TInput>[])[]
  ).flat();

  const form = useForm({
    defaultValues: formDefaults,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      ...(blurValidator === undefined
        ? {}
        : { onBlur: ({ value }: { value: TInput }) => ({ fields: blurValidator(value) }) }),
    },
    onSubmit: ({ value }) => {
      setStage({ kind: 'confirming', values: schema.parse(value), submitted: value });
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

  useLayoutEffect(() => {
    if (Object.is(previousResetKey.current, resetKey)) return;
    previousResetKey.current = resetKey;
    setFormDefaults(defaultValues);
    form.reset(defaultValues);
    setStage({ kind: 'idle' });
  }, [defaultValues, form, resetKey]);

  const invalidFields = useSelector(form.store, (state) =>
    Object.keys(state.fieldMeta).filter(
      (name) =>
        (state.fieldMeta[name as DeepKeys<TInput>]?.errors.length ?? 0) > 0
    )
  );
  const sectionState = useFormSections(sections, { invalidFields });
  const isDirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
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
    const id = formFieldControlId<TInput>(form, target);
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
    const { values, submitted } = stage;
    flushSync(() => setStage({ kind: 'idle' }));
    try {
      const result = await save.run(values);
      const savedDefaults = save.getDefaultValues?.(result) ?? submitted;
      flushSync(() => setFormDefaults(savedDefaults));
      form.reset(savedDefaults);
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
      if (blurValidator !== undefined) void form.validate('blur');
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
