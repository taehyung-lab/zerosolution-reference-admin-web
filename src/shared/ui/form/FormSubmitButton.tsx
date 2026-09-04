import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../primitives/Button'

export function FormSubmitButton({ pending, children }: { readonly pending: boolean; readonly children?: ReactNode }) {
  const { t } = useTranslation('shared')
  return <Button disabled={pending} type="submit">{children ?? t('formAction.save')}</Button>
}
