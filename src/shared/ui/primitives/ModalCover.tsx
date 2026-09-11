import type { ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { cn } from '@/shared/lib/cn'

/**
 * Owns: a full-screen modal surface — focus moves inside, the rest of the document becomes inert and
 * aria-hidden, Escape and outside interaction do nothing, and it stacks above dialogs and the
 * progress overlay. Rejects: copy, the reason it is open, and how it closes (the caller unmounts it).
 * First consumer: the app's access-denied cover (Figma 1.4.3, a full grey screen).
 */
export function ModalCover({
  labelledBy,
  describedBy,
  children,
  className,
}: {
  readonly labelledBy: string
  readonly describedBy?: string
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <RadixDialog.Root open onOpenChange={() => undefined}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          role="alertdialog"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          className={cn('fixed inset-0 z-[60] overflow-auto focus:outline-none', className)}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
