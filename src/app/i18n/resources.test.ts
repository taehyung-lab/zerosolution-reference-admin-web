import { describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n/i18n'
import { UI_LOCALES } from '@/shared/i18n/locale'
import { appI18nNamespaces, registerAppI18nResources } from './resources'

describe('app i18n resources', () => {
  it.each(UI_LOCALES)('registers app, auth and managers bundles for %s', (locale) => {
    registerAppI18nResources()
    for (const namespace of appI18nNamespaces) {
      expect(i18n.hasResourceBundle(locale, namespace)).toBe(true)
    }
    expect(i18n.exists('app:shell.copyright', { lng: locale })).toBe(true)
    expect(i18n.exists('app:bootstrap.title', { lng: locale })).toBe(true)
    expect(i18n.exists('auth:title', { lng: locale })).toBe(true)
    expect(i18n.exists('managers:title', { lng: locale })).toBe(true)
  })

  it.each(UI_LOCALES)('manager type server labels are not duplicated in %s translations', (locale) => {
    registerAppI18nResources()
    expect(i18n.exists('managers:filterOptions.agency', { lng: locale })).toBe(false)
    expect(i18n.exists('managers:filterOptions.vendor', { lng: locale })).toBe(false)
  })

  it('is idempotent', () => {
    registerAppI18nResources()
    registerAppI18nResources()
    expect(i18n.t('app:shell.copyright', { lng: 'ko' })).toBe('Copyright 2026 © BOOSTER LAB.')
  })
})
