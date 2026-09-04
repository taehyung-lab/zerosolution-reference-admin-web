import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export function Button({
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
