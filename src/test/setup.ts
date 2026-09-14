import '@testing-library/jest-dom/vitest'
import { registerAppI18nResources } from '@/app/i18n/resources'

// 앱 진입(LocaleProvider)과 같은 등록을 테스트 진입에서도 한 번 한다.
// 개별 test helper에 두지 않는 이유: feature 번역 import가 seed test closure로 새지 않게 한다.
registerAppI18nResources()

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const element = Element.prototype as unknown as Record<string, unknown>
element['hasPointerCapture'] ??= () => false
element['setPointerCapture'] ??= () => undefined
element['releasePointerCapture'] ??= () => undefined
element['scrollIntoView'] ??= () => undefined
