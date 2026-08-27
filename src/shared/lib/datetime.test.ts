import { describe, expect, it, vi } from 'vitest'
import {
  endOfLocalDayAsUtc,
  formatDateInTimeZone,
  formatTimeInTimeZone,
  startOfLocalDayAsUtc,
  subtractCalendarDays,
  subtractCalendarMonths,
} from './datetime'

function utcResults() {
  return {
    start: startOfLocalDayAsUtc('2026-08-27', 'UTC'),
    end: endOfLocalDayAsUtc('2026-08-27', 'UTC'),
    previousWeek: subtractCalendarDays('2026-08-27', 7, 'UTC'),
    previousMonth: subtractCalendarMonths('2026-03-31', 1, 'UTC'),
    date: formatDateInTimeZone('2026-08-27T15:04:00Z', 'UTC'),
    time: formatTimeInTimeZone('2026-08-27T15:04:00Z', 'UTC'),
  }
}

describe('datetime 순수 변환', () => {
  it('UTC local day의 시작과 끝을 Z instant로 변환한다', () => {
    expect(startOfLocalDayAsUtc('2026-08-27', 'UTC')).toBe('2026-08-27T00:00:00.000Z')
    expect(endOfLocalDayAsUtc('2026-08-27', 'UTC')).toBe('2026-08-27T23:59:59.999Z')
  })

  it('DST 경계의 local day를 지정 zone 기준 instant로 변환한다', () => {
    expect(startOfLocalDayAsUtc('2026-03-08', 'America/New_York')).toBe(
      '2026-03-08T05:00:00.000Z',
    )
    expect(endOfLocalDayAsUtc('2026-03-08', 'America/New_York')).toBe(
      '2026-03-09T03:59:59.999Z',
    )
  })

  it('N일 전과 N개월 전을 calendar 경계에 맞게 계산한다', () => {
    expect(subtractCalendarDays('2026-03-01', 1, 'UTC')).toBe('2026-02-28')
    expect(subtractCalendarMonths('2026-03-31', 1, 'UTC')).toBe('2026-02-28')
    expect(subtractCalendarMonths('2024-03-31', 1, 'UTC')).toBe('2024-02-29')
    expect(subtractCalendarMonths('2024-02-29', 12, 'UTC')).toBe('2023-02-28')
  })

  it('instant를 YYYY-MM-DD와 HH:mm으로 포맷한다', () => {
    expect(formatDateInTimeZone('2026-08-27T15:04:00Z', 'UTC')).toBe('2026-08-27')
    expect(formatTimeInTimeZone('2026-08-27T15:04:00Z', 'UTC')).toBe('15:04')
    expect(formatDateInTimeZone('2026-08-27T02:04:00Z', 'America/New_York')).toBe('2026-08-26')
    expect(formatTimeInTimeZone('2026-08-27T02:04:00Z', 'America/New_York')).toBe('22:04')
  })

  it('process.env.TZ가 달라도 명시한 zone의 결과가 동일하다', () => {
    try {
      vi.stubEnv('TZ', 'America/Los_Angeles')
      const losAngelesProcess = utcResults()
      vi.stubEnv('TZ', 'Asia/Seoul')
      const seoulProcess = utcResults()
      expect(losAngelesProcess).toEqual(seoulProcess)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
