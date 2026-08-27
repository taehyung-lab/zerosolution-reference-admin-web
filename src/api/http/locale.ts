type LocaleGetter = () => string

let getLocale: LocaleGetter = () => 'ko'

/** app locale 소유권을 transport로 역-import하지 않기 위한 읽기 전용 port. */
export function registerLocaleGetter(getter: LocaleGetter): void {
  getLocale = getter
}

export function readLocale(): string {
  return getLocale()
}

/**
 * X-Locale은 격리된 리허설 계약 고유 헤더다. 서버가 선언한 ko/ja만 보낸다.
 * en은 서버 미지원이므로 값을 발명하지 않고 생략한다.
 * @see docs/decisions/0001-rehearsal-api-contract.md
 */
export function readRehearsalLocale(locale: string): 'ko' | 'ja' | undefined {
  if (locale === 'ko' || locale === 'ja') return locale
  return undefined
}
