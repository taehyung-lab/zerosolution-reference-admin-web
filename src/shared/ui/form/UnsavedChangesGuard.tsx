import { useBlocker } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../patterns/ConfirmDialog';

/**
 * Blocks Router navigation while `when` is true and confirms the leave with one of two confirmed
 * product sentences. Navigation the user did not start from the form (LNB, back) reads
 * `unsavedChanges`; a leave requested through `leave()` — the form's own cancel button — reads
 * `formCancel`. Both leaves go through the same blocker, so the cancel button needs no second
 * dialog and no guard bypass; when the form is not dirty, `leave()` navigates without asking.
 *
 * `refuseSilently` keeps the block but asks nothing: while a save is pending the form is still
 * dirty, yet the app-wide progress overlay already says to wait and would sit on top of the
 * question (measured in Chromium), so the leave is simply refused until the save settles.
 *
 * The one shared file allowed to import the Router: the pending destination stays in the blocker
 * instead of being copied into a store.
 */
export function useUnsavedChangesGuard({
  when,
  refuseSilently = false,
}: {
  readonly when: boolean;
  readonly refuseSilently?: boolean;
}): {
  readonly dialog: ReactNode;
  readonly leave: (navigate: () => void) => void;
} {
  const { t } = useTranslation('shared');
  const [reason, setReason] = useState<'navigate' | 'cancel'>('navigate');
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    withResolver: true,
    disabled: !when,
  });
  const blocked = blocker.status === 'blocked';
  const reset = blocked ? blocker.reset : undefined;
  useEffect(() => {
    if (refuseSilently) reset?.();
  }, [refuseSilently, reset]);

  const leave = (navigate: () => void) => {
    if (when) setReason('cancel');
    navigate();
  };

  if (!blocked || refuseSilently) return { dialog: null, leave };

  const copy =
    reason === 'cancel'
      ? {
          description: t('formCancel.description'),
          confirm: t('formCancel.confirm'),
          cancel: t('formCancel.keep'),
        }
      : {
          description: t('unsavedChanges.description'),
          confirm: t('unsavedChanges.confirm'),
          cancel: t('unsavedChanges.cancel'),
        };

  return {
    leave,
    dialog: (
      <ConfirmDialog
        cancelLabel={copy.cancel}
        confirmLabel={copy.confirm}
        description={copy.description}
        onConfirm={() => {
          setReason('navigate');
          blocker.proceed();
        }}
        onOpenChange={(open) => {
          if (open) return;
          setReason('navigate');
          blocker.reset();
        }}
        open
        title={t('alert.title')}
      />
    ),
  };
}
