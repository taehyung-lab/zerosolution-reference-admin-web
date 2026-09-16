import jaPerformances from '@/features/performances/i18n/locales/ja/performances.json'
import enPerformances from '@/features/performances/i18n/locales/en/performances.json'
import koPerformances from '@/features/performances/i18n/locales/ko/performances.json'
import { i18n } from '@/shared/i18n/i18n'
import { UI_LOCALES, type UiLocale } from '@/shared/i18n/locale'
import enApp from '@/app/i18n/locales/en/app.json'
import enAuth from '@/features/auth/i18n/locales/en/auth.json'
import enCommunity from '@/features/community/i18n/locales/en/community.json'
import enManagers from '@/features/managers/i18n/locales/en/managers.json'
import enMembers from '@/features/members/i18n/locales/en/members.json'
import enMessaging from '@/features/messaging/i18n/locales/en/messaging.json'
import enTicketing from '@/features/ticketing/i18n/locales/en/ticketing.json'
import jaApp from '@/app/i18n/locales/ja/app.json'
import jaAuth from '@/features/auth/i18n/locales/ja/auth.json'
import jaCommunity from '@/features/community/i18n/locales/ja/community.json'
import jaManagers from '@/features/managers/i18n/locales/ja/managers.json'
import jaMembers from '@/features/members/i18n/locales/ja/members.json'
import jaMessaging from '@/features/messaging/i18n/locales/ja/messaging.json'
import jaTicketing from '@/features/ticketing/i18n/locales/ja/ticketing.json'
import koApp from '@/app/i18n/locales/ko/app.json'
import koAuth from '@/features/auth/i18n/locales/ko/auth.json'
import koCommunity from '@/features/community/i18n/locales/ko/community.json'
import koManagers from '@/features/managers/i18n/locales/ko/managers.json'
import koMembers from '@/features/members/i18n/locales/ko/members.json'
import koMessaging from '@/features/messaging/i18n/locales/ko/messaging.json'
import koTicketing from '@/features/ticketing/i18n/locales/ko/ticketing.json'

/**
 * shared i18n runtime은 `shared` namespace만 안다. app shell/route 카피(`app`), 로그인 feature(`auth`),
 * 도메인 feature(`managers`) namespace는 화면을 조립하는 app 층이 여기서 등록한다.
 * 각 namespace resource 는 그 namespace 를 소유한 곳에 둔다(`app` 은 `src/app/i18n/locales`,
 * feature namespace 는 `src/features/<domain>/i18n/locales`). `pnpm i18n:check` 가 `src` 아래
 * 모든 `i18n/locales` root 를 찾아 parity 와 소유자 일치를 함께 검사한다.
 */
export const appI18nNamespaces = ['app', 'auth', 'community', 'managers', 'members', 'messaging', 'performances', 'ticketing'] as const
export type AppI18nNamespace = (typeof appI18nNamespaces)[number]

const resources: Record<UiLocale, Record<AppI18nNamespace, object>> = {
  ko: { app: koApp, auth: koAuth, community: koCommunity, managers: koManagers, members: koMembers, messaging: koMessaging, performances: koPerformances, ticketing: koTicketing },
  en: { app: enApp, auth: enAuth, community: enCommunity, managers: enManagers, members: enMembers, messaging: enMessaging, performances: enPerformances, ticketing: enTicketing },
  ja: { app: jaApp, auth: jaAuth, community: jaCommunity, managers: jaManagers, members: jaMembers, messaging: jaMessaging, performances: jaPerformances, ticketing: jaTicketing },
}

export function registerAppI18nResources(): void {
  for (const locale of UI_LOCALES) {
    for (const namespace of appI18nNamespaces) {
      i18n.addResourceBundle(locale, namespace, resources[locale][namespace], true, true)
    }
  }
}
