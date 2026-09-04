import type { ComponentProps } from 'react'
import { clsx } from 'clsx'

export type InputProps = ComponentProps<'input'>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'min-h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300 aria-invalid:border-red-600',
        className,
      )}
      {...props}
    />
  )
}
