import { createInstance } from 'i18next'
import enShared from './locales/en/shared.json'
import jaShared from './locales/ja/shared.json'
import koShared from './locales/ko/shared.json'
import { DEFAULT_UI_LOCALE, UI_LOCALES } from './locale'

export const i18n = createInstance()

// shared는 feature·app을 알 수 없으므로 여기서는 `shared` namespace만 등록한다.
// `app`·`auth`·feature namespace는 app 조립(`src/app/i18n/resources.ts`)이 addResourceBundle로 붙인다.
await i18n.init({
  lng: DEFAULT_UI_LOCALE,
  fallbackLng: false,
  supportedLngs: UI_LOCALES,
  ns: ['shared'],
  defaultNS: 'shared',
  resources: {
    ko: { shared: koShared },
    en: { shared: enShared },
    ja: { shared: jaShared },
  },
  interpolation: { escapeValue: false },
  saveMissing: true,
  missingKeyHandler: (_languages, namespace, key) => {
    throw new Error(`Missing translation key: ${namespace}:${key}`)
  },
})
