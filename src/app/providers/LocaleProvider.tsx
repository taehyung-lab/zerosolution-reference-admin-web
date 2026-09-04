import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { registerLocaleGetter } from '@/api/http/locale'
import { registerAppI18nResources } from '@/app/i18n/resources'
import { i18n } from '@/shared/i18n/i18n'
import { DEFAULT_UI_LOCALE, type UiLocale } from '@/shared/i18n/locale'
import { LocaleContextProvider } from '@/shared/i18n/locale-context'

registerAppI18nResources()

export function LocaleProvider({ children }: { readonly children: ReactNode }) {
  // 브라우저 언어는 확인된 제품 정책이 아니다. 초기 UI locale은 명시적으로 ko로 고정한다.
  const [locale, setLocale] = useState<UiLocale>(DEFAULT_UI_LOCALE)

  useEffect(() => {
    registerLocaleGetter(() => locale)
    i18n.changeLanguage(locale).catch((error: unknown) => {
      console.error('UI locale change failed', error)
    })
    return () => registerLocaleGetter(() => DEFAULT_UI_LOCALE)
  }, [locale])

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContextProvider locale={locale} setLocale={setLocale}>
        {children}
      </LocaleContextProvider>
    </I18nextProvider>
  )
}
