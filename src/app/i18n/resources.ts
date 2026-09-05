import { i18n } from '@/shared/i18n/i18n'
import { UI_LOCALES, type UiLocale } from '@/shared/i18n/locale'
import enApp from '@/shared/i18n/locales/en/app.json'
import enAuth from '@/shared/i18n/locales/en/auth.json'
import enManagers from '@/shared/i18n/locales/en/managers.json'
import enMembers from '@/shared/i18n/locales/en/members.json'
import jaApp from '@/shared/i18n/locales/ja/app.json'
import jaAuth from '@/shared/i18n/locales/ja/auth.json'
import jaManagers from '@/shared/i18n/locales/ja/managers.json'
import jaMembers from '@/shared/i18n/locales/ja/members.json'
import koApp from '@/shared/i18n/locales/ko/app.json'
import koAuth from '@/shared/i18n/locales/ko/auth.json'
import koManagers from '@/shared/i18n/locales/ko/managers.json'
import koMembers from '@/shared/i18n/locales/ko/members.json'

/**
 * shared i18n runtime은 `shared` namespace만 안다. app shell/route 카피(`app`), 로그인 feature(`auth`),
 * 도메인 feature(`managers`) namespace는 화면을 조립하는 app 층이 여기서 등록한다.
 * 파일은 `pnpm i18n:check`가 읽는 단일 root(`src/shared/i18n/locales`)에 남긴다.
 */
export const appI18nNamespaces = ['app', 'auth', 'managers', 'members'] as const
export type AppI18nNamespace = (typeof appI18nNamespaces)[number]

const resources: Record<UiLocale, Record<AppI18nNamespace, object>> = {
  ko: { app: koApp, auth: koAuth, managers: koManagers, members: koMembers },
  en: { app: enApp, auth: enAuth, managers: enManagers, members: enMembers },
  ja: { app: jaApp, auth: jaAuth, managers: jaManagers, members: jaMembers },
}

export function registerAppI18nResources(): void {
  for (const locale of UI_LOCALES) {
    for (const namespace of appI18nNamespaces) {
      i18n.addResourceBundle(locale, namespace, resources[locale][namespace], true, true)
    }
  }
}
