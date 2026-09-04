import type { ComponentProps } from 'react'

export function FileInput({ onFileChange, ...props }: Omit<ComponentProps<'input'>, 'type' | 'multiple' | 'value' | 'onChange'> & { readonly onFileChange: (file: File | undefined) => void }) {
  return <input {...props} type="file" onChange={(event) => onFileChange(event.target.files?.[0])} />
}
