interface CalendarDate {
  readonly year: number
  readonly month: number
  readonly day: number
}

interface CalendarDateTime extends CalendarDate {
  readonly hour: number
  readonly minute: number
  readonly second: number
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatCalendarDate(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${pad(date.month)}-${pad(date.day)}`
}

function parseCalendarDate(value: string): CalendarDate {
  const match = DATE_ONLY.exec(value)
  if (match === null) throw new Error(`Invalid YYYY-MM-DD value: ${value}`)
  const yearText = match[1]
  const monthText = match[2]
  const dayText = match[3]
  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    throw new Error(`Invalid YYYY-MM-DD value: ${value}`)
  }
  const date = { year: Number(yearText), month: Number(monthText), day: Number(dayText) }
  const roundTrip = new Date(Date.UTC(date.year, date.month - 1, date.day))
  if (
    roundTrip.getUTCFullYear() !== date.year ||
    roundTrip.getUTCMonth() + 1 !== date.month ||
    roundTrip.getUTCDate() !== date.day
  ) {
    throw new Error(`Invalid calendar date: ${value}`)
  }
  return date
}

function createFormatter(timeZone: string, includeTime: boolean): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' as const }
      : {}),
  })
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const part = parts.find((candidate) => candidate.type === type)
  if (part === undefined) throw new Error(`Intl formatter omitted ${type}`)
  return Number(part.value)
}

function partsInTimeZone(epochMs: number, timeZone: string): CalendarDateTime {
  const parts = createFormatter(timeZone, true).formatToParts(epochMs)
  return {
    year: readPart(parts, 'year'),
    month: readPart(parts, 'month'),
    day: readPart(parts, 'day'),
    hour: readPart(parts, 'hour'),
    minute: readPart(parts, 'minute'),
    second: readPart(parts, 'second'),
  }
}

function localMidnightEpochMs(date: CalendarDate, timeZone: string): number {
  const desired = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0)
  let candidate = desired
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsInTimeZone(candidate, timeZone)
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    )
    const adjustment = desired - actualAsUtc
    candidate += adjustment
    if (adjustment === 0) return candidate
  }
  const actual = partsInTimeZone(candidate, timeZone)
  if (
    actual.year !== date.year ||
    actual.month !== date.month ||
    actual.day !== date.day ||
    actual.hour !== 0 ||
    actual.minute !== 0 ||
    actual.second !== 0
  ) {
    throw new Error(`Local day has no resolvable midnight in ${timeZone}`)
  }
  return candidate
}

function addUtcCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  }
}

function assertWholeNonNegative(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`)
}

function parseInstant(value: string): number {
  const epochMs = Date.parse(value)
  if (!ISO_INSTANT.test(value) || !Number.isFinite(epochMs)) {
    throw new Error(`Invalid ISO instant: ${value}`)
  }
  return epochMs
}

/** 지정 local day의 시작을 UTC Z instant 문자열로 변환한다. */
export function startOfLocalDayAsUtc(date: string, timeZone: string): string {
  return new Date(localMidnightEpochMs(parseCalendarDate(date), timeZone)).toISOString()
}

/** 지정 local day 다음 날 시작의 1ms 전을 UTC Z instant 문자열로 변환한다. */
export function endOfLocalDayAsUtc(date: string, timeZone: string): string {
  const nextDay = addUtcCalendarDays(parseCalendarDate(date), 1)
  return new Date(localMidnightEpochMs(nextDay, timeZone) - 1).toISOString()
}

export function subtractCalendarDays(date: string, days: number, timeZone: string): string {
  assertWholeNonNegative(days, 'days')
  createFormatter(timeZone, false)
  return formatCalendarDate(addUtcCalendarDays(parseCalendarDate(date), -days))
}

export function subtractCalendarMonths(date: string, months: number, timeZone: string): string {
  assertWholeNonNegative(months, 'months')
  createFormatter(timeZone, false)
  const parsed = parseCalendarDate(date)
  const targetMonthIndex = parsed.year * 12 + parsed.month - 1 - months
  const targetYear = Math.floor(targetMonthIndex / 12)
  const targetMonth = targetMonthIndex - targetYear * 12 + 1
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  return formatCalendarDate({ year: targetYear, month: targetMonth, day: Math.min(parsed.day, lastDay) })
}

export function formatDateInTimeZone(instant: string, timeZone: string): string {
  const parts = partsInTimeZone(parseInstant(instant), timeZone)
  return formatCalendarDate(parts)
}

export function formatTimeInTimeZone(instant: string, timeZone: string): string {
  const parts = partsInTimeZone(parseInstant(instant), timeZone)
  return `${pad(parts.hour)}:${pad(parts.minute)}`
}
