type SessionExpiryObserver = (isoString: string) => void

let observeSessionExpiry: SessionExpiryObserver = () => undefined

export function registerSessionExpiryObserver(observer: SessionExpiryObserver): void {
  observeSessionExpiry = observer
}

function isIsoInstant(value: string): boolean {
  const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
  return isoWithOffset.test(value) && Number.isFinite(Date.parse(value))
}

/** transport는 만료 시각을 사실로만 발행하고 타이머·표시·이동을 소유하지 않는다. */
export function emitSessionExpiry(value: string | undefined): void {
  if (value === undefined) return
  if (!isIsoInstant(value)) {
    if (import.meta.env.DEV) console.warn('Invalid X-Session-Expires header', value)
    return
  }
  observeSessionExpiry(value)
}
