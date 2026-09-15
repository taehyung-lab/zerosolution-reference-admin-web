import type { PeriodPreset } from '@/shared/lib/datetime';

/** Provisional product-wide preset observed across standard list toolbars. Callers opt in. */
export const standardPageSizeOptions = [
  100, 200, 300, 400, 500, 700, 1000,
] as const;

/**
 * Provisional product-wide period presets: the same eight quick ranges appear on every list
 * and statistics filter in the design inventory. Callers opt in and own the default (lists
 * start at ALL, statistics at MONTH_1); labels come from `usePeriodPresetLabels`.
 */
export const standardPeriodPresetValues = [
  'ALL',
  'YEAR_1',
  'MONTH_6',
  'MONTH_3',
  'MONTH_1',
  'DAY_7',
  'YESTERDAY',
  'TODAY',
] as const satisfies readonly PeriodPreset[];
