import { useRef, type ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'

/** Owns: Radix modal focus/dismiss/tokens and title–description association. Rejects: copy, intent, pending policy, mutation and navigation. API: open,onOpenChange,title,description,children,footer. Boundary: primitive keyboard/focus mechanics (§promotion). */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: string
  readonly children?: ReactNode
  readonly footer?: ReactNode
  readonly closeLabel?: string
}) {
  const opener = useRef<HTMLElement | null>(null)
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-neutral-900/40" />
        <RadixDialog.Content
          onOpenAutoFocus={() => {
            opener.current = document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
          }}
          onCloseAutoFocus={(event) => {
            if (!opener.current?.isConnected) return
            event.preventDefault()
            opener.current.focus()
          }}
          // Radix warns when no Description is rendered; opting out is explicit, not accidental.
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed left-1/2 top-1/2 w-[466px] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <RadixDialog.Title className="text-lg font-semibold text-neutral-900">
            {title}
          </RadixDialog.Title>
          {closeLabel ? (
            <RadixDialog.Close aria-label={closeLabel} className="absolute right-4 top-4" type="button">
              <span aria-hidden>×</span>
            </RadixDialog.Close>
          ) : null}
          {description ? (
            <RadixDialog.Description className="mt-4 text-sm text-neutral-700">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? (
            <div className="mt-6 flex justify-end gap-2">{footer}</div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
