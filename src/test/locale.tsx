import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { LocaleContextProvider } from '@/shared/i18n/locale-context'
import { i18n } from '@/shared/i18n/i18n'
import type { UiLocale } from '@/shared/i18n/locale'

export function TestLocaleProvider({
  children,
  locale = 'ko',
}: {
  readonly children: ReactNode
  readonly locale?: UiLocale
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContextProvider locale={locale} setLocale={() => undefined}>
        {children}
      </LocaleContextProvider>
    </I18nextProvider>
  )
}
