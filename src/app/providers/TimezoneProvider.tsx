import { createContext, useContext, type ReactNode } from 'react'

export const APP_TIMEZONE = 'UTC'

const TimezoneContext = createContext<typeof APP_TIMEZONE | undefined>(undefined)

/** ADR 0003이 확정한 앱 수명주기 timezone을 소유한다. 브라우저 zone은 읽지 않는다. */
export function TimezoneProvider({ children }: { children: ReactNode }) {
  return <TimezoneContext value={APP_TIMEZONE}>{children}</TimezoneContext>
}

export function useTimezone(): typeof APP_TIMEZONE {
  const timeZone = useContext(TimezoneContext)
  if (timeZone === undefined) throw new Error('TimezoneProvider가 필요합니다.')
  return timeZone
}
