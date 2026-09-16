import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessageKey, errorTraceOf } from '../../lib/error-copy';
import type { ErrorTraceValue } from '../feedback/ErrorTrace';
import { ConfirmDialog } from './ConfirmDialog';

type ConfirmationState<TValues> =
  | { readonly kind: 'closed' }
  | {
      readonly kind: 'confirm';
      readonly values: TValues;
      readonly pending: boolean;
      readonly failure: ErrorTraceValue | undefined;
    };

type Copy<TValues> = string | ((values: TValues) => string);

const resolve = <TValues,>(copy: Copy<TValues> | undefined, values: TValues) =>
  typeof copy === 'function' ? copy(values) : copy;

/**
 * The ask → run → done lifecycle of one consequential action (delete, approve, bulk change).
 * The caller renders `dialog` once and calls `request(values)` from its control; this owns the
 * open state, the pending guard, and the failure line when `run` rejects, so the dialog stays
 * open for another try or a cancel. What runs and where the user goes afterwards stay outside.
 * `description` and `confirmLabel` may depend on the requested values when one control asks
 * different questions.
 */
export function useConfirmation<TValues = void>({
  run,
  description,
  confirmLabel,
}: {
  readonly run: (values: TValues) => void | Promise<unknown>;
  readonly description: Copy<TValues>;
  readonly confirmLabel?: Copy<TValues>;
}) {
  const { t } = useTranslation('shared');
  const [state, setState] = useState<ConfirmationState<TValues>>({ kind: 'closed' });
  const close = () => setState({ kind: 'closed' });

  async function confirm() {
    if (state.kind !== 'confirm' || state.pending) return;
    setState({ ...state, pending: true, failure: undefined });
    try {
      await run(state.values);
      close();
    } catch (error: unknown) {
      setState({ ...state, pending: false, failure: errorTraceOf(error) });
    }
  }

  const open = state.kind === 'confirm';
  return {
    request: (values: TValues) =>
      setState({ kind: 'confirm', values, pending: false, failure: undefined }),
    pending: open && state.pending,
    dialog: open ? (
      <ConfirmDialog
        open
        pending={state.pending}
        title={t('alert.title')}
        description={resolve(description, state.values)}
        confirmLabel={resolve(confirmLabel, state.values) ?? t('formSave.confirm')}
        cancelLabel={t('formSave.cancel')}
        onConfirm={() => void confirm()}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {state.failure ? (
          <p className="text-sm text-red-700" role="alert">
            {t(errorMessageKey(state.failure.kind))}
          </p>
        ) : null}
      </ConfirmDialog>
    ) : null,
  };
}
