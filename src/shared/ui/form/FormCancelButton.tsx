import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../primitives/Button'

export function FormCancelButton({ onClick, children, disabled = false }: { readonly onClick: () => void; readonly children?: ReactNode; readonly disabled?: boolean }) {
  const { t } = useTranslation('shared')
  return <Button className="border border-neutral-300 bg-white text-neutral-900" disabled={disabled} onClick={onClick} type="button">{children ?? t('formAction.cancel')}</Button>
}
