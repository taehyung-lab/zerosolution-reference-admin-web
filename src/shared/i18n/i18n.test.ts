import { describe, expect, it } from 'vitest'
import { i18n } from './i18n'

describe('i18n runtime contract', () => {
  it('등록되지 않은 번역 키를 명시적으로 실패시킨다', () => {
    expect(() => i18n.t('shared:this.key.does.not.exist')).toThrow(/Missing translation key/)
  })

  it.each(['ko', 'en', 'ja'] as const)('shared runtime registers only the shared namespace for %s', (locale) => {
    expect(i18n.hasResourceBundle(locale, 'shared')).toBe(true)
    expect(i18n.exists('shared:shell.copyright', { lng: locale })).toBe(false)
    expect(i18n.exists('shared:bootstrap.title', { lng: locale })).toBe(false)
  })
})
