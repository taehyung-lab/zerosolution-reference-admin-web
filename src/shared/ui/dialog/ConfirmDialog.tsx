import type { ReactNode } from 'react'
import { Button } from '../primitives/Button'
import { Dialog } from '../primitives/Dialog'

/** Consequential yes/no layout with a pending close guard. Copy, what runs, and where the user goes afterwards are the caller's; `children` is the slot for a failure line between the question and the buttons. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  children,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly onConfirm: () => void
  readonly pending?: boolean
  readonly children?: ReactNode
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
      children={children}
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
