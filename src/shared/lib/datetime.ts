export const REQUEST_TIMEZONE = 'UTC';

/**
 * 서버가 준 instant를 화면에 그릴 브라우저 IANA timezone을 반환한다.
 * 언어로 timezone을 추정하지 않는다. 나중에 표시 기준이 공연장 timezone으로 바뀌면
 * 호출부가 아니라 이 함수만 교체할 수 있도록 함수 경계로 남긴다.
 */
export function displayTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function parts(instant: number, timezone: string) {
  const resolved = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(resolved.find((part) => part.type === type)?.value);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timezone: string
): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0, second = 0] = time.split(':').map(Number);
  let instant = Date.UTC(year, month - 1, day, hour, minute, second);
  // The formatter gives the zone's wall-clock value for a candidate instant; two passes handle DST offset.
  for (let index = 0; index < 2; index += 1) {
    const local = parts(instant, timezone);
    const wanted = Date.UTC(year, month - 1, day, hour, minute, second);
    const actual = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    );
    instant += wanted - actual;
  }
  return new Date(instant).toISOString();
}

export function startOfLocalDayAsUtc(date: string, timezone: string) {
  return zonedDateTimeToUtc(date, '00:00:00', timezone);
}
export function endOfLocalDayAsUtc(date: string, timezone: string) {
  return zonedDateTimeToUtc(date, '23:59:59', timezone).replace(
    '.000Z',
    '.999Z'
  );
}
export function utcDayBoundary(
  date: string,
  boundary: 'start' | 'end',
  timezone: string
) {
  return boundary === 'start'
    ? startOfLocalDayAsUtc(date, timezone)
    : endOfLocalDayAsUtc(date, timezone);
}
export function formatDateInTimeZone(
  instant: string | null | undefined,
  timezone: string,
) {
  if (!instant) return '';
  const milliseconds = Date.parse(instant);
  if (!Number.isFinite(milliseconds)) return '';
  const value = parts(milliseconds, timezone);
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
}
export function formatDate(instant: string | null | undefined): string {
  return formatDateInTimeZone(instant, displayTimeZone());
}
export function formatTimeInTimeZone(instant: string, timezone: string, precision: 'minute' | 'second' = 'minute') {
  const value = parts(Date.parse(instant), timezone);
  const time = `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
  return precision === 'second' ? `${time}:${String(value.second).padStart(2, '0')}` : time;
}
export function subtractCalendarDays(date: string, days: number) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day - days));
  return result.toISOString().slice(0, 10);
}
export function subtractCalendarMonths(date: string, months: number) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - months, 0)).getUTCDate();
  const result = new Date(
    Date.UTC(year, month - months - 1, Math.min(day, end))
  );
  return result.toISOString().slice(0, 10);
}
export function utcPresetRange(months: number, now = new Date()) {
  const today = formatDateInTimeZone(now.toISOString(), REQUEST_TIMEZONE);
  return {
    startDateTime: startOfLocalDayAsUtc(
      months === 0
        ? subtractCalendarDays(today, 1)
        : subtractCalendarMonths(today, months),
      REQUEST_TIMEZONE
    ),
    endDateTime: endOfLocalDayAsUtc(today, REQUEST_TIMEZONE),
  };
}
export function periodPresetRange(
  preset:
    | 'ALL'
    | 'YEAR_1'
    | 'MONTH_6'
    | 'MONTH_3'
    | 'MONTH_1'
    | 'DAY_7'
    | 'YESTERDAY'
    | 'TODAY',
  timezone: string,
  now = new Date()
): { from?: string; to?: string } {
  const today = formatDateInTimeZone(now.toISOString(), timezone);
  if (preset === 'ALL') return {};
  if (preset === 'TODAY') return { from: today, to: today };
  if (preset === 'YESTERDAY') {
    const day = subtractCalendarDays(today, 1);
    return { from: day, to: day };
  }
  const amount =
    preset === 'YEAR_1'
      ? 12
      : preset === 'MONTH_6'
        ? 6
        : preset === 'MONTH_3'
          ? 3
          : preset === 'MONTH_1'
            ? 1
            : 0;
  return {
    from:
      preset === 'DAY_7'
        ? subtractCalendarDays(today, 7)
        : subtractCalendarMonths(today, amount),
    to: today,
  };
}

export type PeriodPreset =
  | 'ALL'
  | 'YEAR_1'
  | 'MONTH_6'
  | 'MONTH_3'
  | 'MONTH_1'
  | 'DAY_7'
  | 'YESTERDAY'
  | 'TODAY';
export type PeriodValue = PeriodPreset | 'CUSTOM';
export type DateRange = { readonly from?: string; readonly to?: string };

export function utcRangeToDateRange(
  range: { readonly startDateTime?: string; readonly endDateTime?: string },
  timezone: string
): DateRange {
  return {
    from: range.startDateTime
      ? formatDateInTimeZone(range.startDateTime, timezone)
      : undefined,
    to: range.endDateTime
      ? formatDateInTimeZone(range.endDateTime, timezone)
      : undefined,
  };
}

export function inferPeriodPreset(
  range: DateRange,
  timezone: string,
  now = new Date()
): PeriodValue {
  const values: readonly PeriodPreset[] = [
    'ALL',
    'YEAR_1',
    'MONTH_6',
    'MONTH_3',
    'MONTH_1',
    'DAY_7',
    'YESTERDAY',
    'TODAY',
  ];
  return (
    values.find((value) => {
      const candidate = periodPresetRange(value, timezone, now);
      return candidate.from === range.from && candidate.to === range.to;
    }) ?? 'CUSTOM'
  );
}
