import { useTranslation } from 'react-i18next'

export function ManagerListScreen() {
  const { t } = useTranslation('common')
  return <section>{t('title')}</section>
}
