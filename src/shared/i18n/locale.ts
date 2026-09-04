export const UI_LOCALES = ['ko', 'en', 'ja'] as const

export type UiLocale = (typeof UI_LOCALES)[number]

export const DEFAULT_UI_LOCALE: UiLocale = 'ko'
