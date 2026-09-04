import { useDraftCommit } from './use-draft-commit';
import {
  displayTimeZone,
  inferPeriodPreset,
  periodPresetRange,
  utcDayBoundary,
  utcRangeToDateRange,
  type DateRange,
  type PeriodValue,
} from './datetime';

export type { PeriodPreset, PeriodValue } from './datetime';

export type DisplayDateRange = DateRange;

export interface UtcPeriodRange {
  readonly startDateTime?: string;
  readonly endDateTime?: string;
}

export interface PeriodDraft extends UtcPeriodRange {
  readonly preset: PeriodValue;
}

export function createPeriodDraft(
  committed: UtcPeriodRange,
  timezone: string,
): PeriodDraft {
  return {
    ...committed,
    preset: inferPeriodPreset(utcRangeToDateRange(committed, timezone), timezone),
  };
}

/**
 * Owns the uncommitted period lifecycle: preset inference, CUSTOM, and the display/UTC
 * boundary round trip. The caller passes committed values in and reads `utcRange` back at
 * the request boundary.
 */
export function usePeriodDraft({
  committed,
  resetKey,
}: {
  readonly committed: UtcPeriodRange;
  readonly resetKey: unknown;
}) {
  const timezone = displayTimeZone();
  const { draft, setDraft, resetDraft } = useDraftCommit({
    committed,
    keyOf: () => resetKey,
    createDraft: (value) => createPeriodDraft(value, timezone),
  });
  const range = utcRangeToDateRange(draft, timezone);

  const setPreset = (preset: PeriodValue) => {
    if (preset === 'CUSTOM') {
      setDraft((current) => ({ ...current, preset }));
      return;
    }

    const nextRange = periodPresetRange(preset, timezone);
    setDraft({
      preset,
      ...(nextRange.from
        ? { startDateTime: utcDayBoundary(nextRange.from, 'start', timezone) }
        : {}),
      ...(nextRange.to
        ? { endDateTime: utcDayBoundary(nextRange.to, 'end', timezone) }
        : {}),
    });
  };

  const setRange = (nextRange: DisplayDateRange) =>
    setDraft({
      preset: 'CUSTOM',
      ...(nextRange.from
        ? { startDateTime: utcDayBoundary(nextRange.from, 'start', timezone) }
        : {}),
      ...(nextRange.to
        ? { endDateTime: utcDayBoundary(nextRange.to, 'end', timezone) }
        : {}),
    });

  return {
    preset: draft.preset,
    range,
    utcRange: {
      startDateTime: draft.startDateTime,
      endDateTime: draft.endDateTime,
    } satisfies UtcPeriodRange,
    setPreset,
    setRange,
    reset: resetDraft,
  };
}
