import { useTranslation } from 'react-i18next'

export function ExampleListScreen() {
  const { t } = useTranslation('common')
  return <section>{t('title')}</section>
}
