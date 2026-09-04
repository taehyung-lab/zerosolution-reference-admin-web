import { useTranslation } from 'react-i18next'

export function ResourcePage() {
  const { t } = useTranslation('common')
  return <section>{t('title')}</section>
}
