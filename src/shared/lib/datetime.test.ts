import { describe, expect, it, vi } from 'vitest'
import {
  endOfLocalDayAsUtc,
  formatDate,
  formatDateInTimeZone,
  formatTimeInTimeZone,
  inferPeriodPreset,
  periodPresetRange,
  REQUEST_TIMEZONE,
  startOfLocalDayAsUtc,
  subtractCalendarDays,
  subtractCalendarMonths,
  utcRangeToDateRange,
} from './datetime'

function utcResults() {
  return {
    start: startOfLocalDayAsUtc('2026-08-27', 'UTC'),
    end: endOfLocalDayAsUtc('2026-08-27', 'UTC'),
    previousWeek: subtractCalendarDays('2026-08-27', 7),
    previousMonth: subtractCalendarMonths('2026-03-31', 1),
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
    expect(subtractCalendarDays('2026-03-01', 1)).toBe('2026-02-28')
    expect(subtractCalendarMonths('2026-03-31', 1)).toBe('2026-02-28')
    expect(subtractCalendarMonths('2024-03-31', 1)).toBe('2024-02-29')
    expect(subtractCalendarMonths('2024-02-29', 12)).toBe('2023-02-28')
  })

  it('instant를 YYYY-MM-DD와 HH:mm으로 포맷한다', () => {
    expect(formatDateInTimeZone('2026-08-27T15:04:00Z', 'UTC')).toBe('2026-08-27')
    expect(formatTimeInTimeZone('2026-08-27T15:04:00Z', 'UTC')).toBe('15:04')
    expect(formatDateInTimeZone('2026-08-27T02:04:00Z', 'America/New_York')).toBe('2026-08-26')
    expect(formatTimeInTimeZone('2026-08-27T02:04:00Z', 'America/New_York')).toBe('22:04')
  })

  it('uses the browser display timezone and keeps invalid values empty', () => {
    vi.stubEnv('TZ', 'Asia/Seoul');
    expect(formatDate('2026-08-27T15:30:00Z')).toBe('2026-08-28');

    vi.stubEnv('TZ', 'UTC');
    expect(formatDate('2026-08-27T15:30:00Z')).toBe('2026-08-27');
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(REQUEST_TIMEZONE).toBe('UTC');
    vi.unstubAllEnvs();
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

describe('period range mechanics', () => {
  const now = new Date('2026-08-28T12:00:00Z')

  it('infers a known preset and keeps an unmatched range custom', () => {
    expect(inferPeriodPreset(periodPresetRange('DAY_7', 'UTC', now), 'UTC', now)).toBe('DAY_7')
    expect(inferPeriodPreset({ from: '2026-08-01', to: '2026-08-02' }, 'UTC', now)).toBe('CUSTOM')
  })

  it('converts UTC boundaries back to display dates', () => {
    expect(utcRangeToDateRange({ startDateTime: '2026-08-01T00:00:00.000Z', endDateTime: '2026-08-02T23:59:59.999Z' }, 'UTC')).toEqual({ from: '2026-08-01', to: '2026-08-02' })
  })
})
