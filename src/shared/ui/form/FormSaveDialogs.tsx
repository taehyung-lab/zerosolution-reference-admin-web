import { useTranslation } from 'react-i18next'
import { AlertDialog } from '../patterns/AlertDialog'
import { ConfirmDialog } from '../patterns/ConfirmDialog'

export type FormSaveStage = 'idle' | 'confirming' | 'saved' | 'failed'

/** Product-generic ways a save fails without a field to carry the message. */
export type FormSaveFailure = 'general' | 'validation' | 'connection'

/**
 * The save acknowledgement pair — confirm before writing, then acknowledge after the write
 * succeeds. `useSaveForm` renders it inside its `dialogs` node; a form that saves without this
 * pair (an inline section that saves and refreshes) does not use `useSaveForm`.
 *
 * The wording is product-generic and part of this interaction contract, so it lives in the
 * `shared` namespace. Everything domain-specific stays outside: which mutation runs, where the
 * user goes after acknowledging, and how failures are reported are all the caller's.
 */
export function FormSaveDialogs({
  stage,
  pending = false,
  onConfirm,
  onCancel,
  onAcknowledge,
}: {
  readonly stage: FormSaveStage
  readonly pending?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly onAcknowledge: () => void
}) {
  const { t } = useTranslation('shared')

  return (
    <>
      <ConfirmDialog
        cancelLabel={t('formSave.cancel')}
        confirmLabel={t('formSave.confirm')}
        onConfirm={onConfirm}
        onOpenChange={(open) => {
          if (!open) onCancel()
        }}
        open={stage === 'confirming'}
        pending={pending}
        description={t('formSave.confirmDescription')}
        title={t('alert.title')}
      />
      <AlertDialog
        acknowledgeLabel={t('formSave.acknowledge')}
        onAcknowledge={onAcknowledge}
        onOpenChange={() => undefined}
        open={stage === 'saved'}
        description={t('formSave.savedDescription')}
        title={t('alert.title')}
      />
    </>
  )
}

/** The root failure line above the form; the field-level server message is rendered by `FormField`. */
export function FormSaveFailureMessage({ failure }: { readonly failure: FormSaveFailure }) {
  const { t } = useTranslation('shared')
  return (
    <p className="mb-4 text-sm text-red-700" role="alert">
      {t(`formError.${failure}`)}
    </p>
  )
}
