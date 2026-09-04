import { Button } from '../primitives/Button'
import { Dialog } from '../primitives/Dialog'

/** Owns: consequential yes/no layout and pending close guard. Rejects: copy, mutation, error handling, toast and navigation. API: open,onOpenChange,title,description,confirmLabel,cancelLabel,onConfirm,pending. Boundary: domain-neutral confirm mechanics (shared-ui-contract `dialogs.md`). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly onConfirm: () => void
  readonly pending?: boolean
}) {
  // The handler stays present while pending so Escape/outside-click cannot bypass an
  // indivisible action; removing it would silently become the close policy.
  const requestOpenChange = (next: boolean) => {
    if (pending && !next) return
    onOpenChange(next)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={requestOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button disabled={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button
            className="border border-neutral-300 bg-white text-neutral-900"
            disabled={pending}
            onClick={() => requestOpenChange(false)}
          >
            {cancelLabel}
          </Button>
        </>
      }
    />
  )
}
