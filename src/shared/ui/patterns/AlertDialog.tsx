import { Button } from '../primitives/Button'
import { Dialog } from '../primitives/Dialog'

/** Owns: single-acknowledgement layout. Rejects: copy, mutation, error handling and navigation. API: open,onOpenChange,title,description,acknowledgeLabel,onAcknowledge. Boundary: domain-neutral acknowledgement mechanics (shared-ui-contract `dialogs.md`). */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  acknowledgeLabel,
  onAcknowledge,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string
  readonly acknowledgeLabel: string
  readonly onAcknowledge?: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <Button
          onClick={() => {
            onAcknowledge?.()
            onOpenChange(false)
          }}
        >
          {acknowledgeLabel}
        </Button>
      }
    />
  )
}
