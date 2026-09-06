import { useTranslation } from 'react-i18next'

export function ManagerApiListScreen() {
  const { t } = useTranslation('common')
  return <section>{t('title')}</section>
}
