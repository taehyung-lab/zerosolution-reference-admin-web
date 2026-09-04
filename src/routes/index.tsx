import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')({
  component: BootstrapIndex,
})

function BootstrapIndex() {
  const { t } = useTranslation('app')
  return (
    <section>
      <h1 className="text-lg font-semibold">{t('bootstrap.title')}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t('bootstrap.description')}</p>
    </section>
  )
}
