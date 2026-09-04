import { createContext, useContext, type ReactNode } from 'react'
import type { UiLocale } from './locale'

interface LocaleContextValue {
  readonly locale: UiLocale
  readonly setLocale: (locale: UiLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function LocaleContextProvider({
  children,
  locale,
  setLocale,
}: LocaleContextValue & { readonly children: ReactNode }) {
  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (value === undefined) throw new Error('useLocale must be used within LocaleContextProvider')
  return value
}
