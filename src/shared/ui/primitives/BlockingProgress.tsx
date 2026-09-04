import type { ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'

export function BlockingProgress({ open, message, children }: { readonly open: boolean; readonly message: string; readonly children: ReactNode }) {
  return (
    <>
      <div aria-busy={open ? true : undefined} inert={open ? true : undefined}>{children}</div>
      <RadixDialog.Root open={open} onOpenChange={() => undefined}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-neutral-900/40" />
          <RadixDialog.Content
            aria-atomic="true"
            aria-describedby={undefined}
            aria-live="polite"
            className="fixed left-1/2 top-1/2 z-50 flex w-[466px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg bg-white p-10 shadow-sm"
            onCloseAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            role="status"
          >
            <span aria-hidden="true" className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
            <RadixDialog.Title className="mt-5 text-center text-sm font-medium text-neutral-900">{message}</RadixDialog.Title>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  )
}
