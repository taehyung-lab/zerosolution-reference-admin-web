import { renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { standardPeriodPresetValues } from '@/shared/lib/list-options';
import { i18n } from './i18n';
import { usePeriodPresetLabels, usePeriodPresets } from './use-period-presets';

const localeWrapper = (locale: string) => {
  const localized = i18n.cloneInstance({ lng: locale });
  return ({ children }: { readonly children: ReactNode }) => (
    <I18nextProvider i18n={localized}>{children}</I18nextProvider>
  );
};

describe('usePeriodPresetLabels', () => {
  it.each([
    ['ko', { ALL: '전체', TODAY: '오늘', CUSTOM: '직접입력' }],
    ['en', { ALL: 'All', TODAY: 'Today', CUSTOM: 'Custom' }],
    ['ja', { ALL: 'すべて', TODAY: '今日', CUSTOM: '直接入力' }],
  ] as const)('returns the complete shared preset vocabulary in %s', (locale, expected) => {
    const { result } = renderHook(() => usePeriodPresetLabels(), {
      wrapper: localeWrapper(locale),
    });

    expect(Object.keys(result.current)).toHaveLength(9);
    expect(result.current).toMatchObject(expected);
  });
});

describe('usePeriodPresets', () => {
  it('pairs the values it was given with their labels, in the order given', () => {
    const { result } = renderHook(
      () => usePeriodPresets(standardPeriodPresetValues),
      { wrapper: localeWrapper('ko') },
    );

    expect(result.current.presets.map(({ value }) => value)).toEqual([
      ...standardPeriodPresetValues,
    ]);
    expect(result.current.presets[0]).toEqual({ value: 'ALL', label: '전체' });
  });

  // The caller declares which values it adopts, so a screen may take a subset of the standard set.
  it('projects only the adopted subset', () => {
    const { result } = renderHook(
      () => usePeriodPresets(['DAY_7', 'TODAY']),
      { wrapper: localeWrapper('ko') },
    );

    expect(result.current.presets).toEqual([
      { value: 'DAY_7', label: '7일전' },
      { value: 'TODAY', label: '오늘' },
    ]);
  });

  // CUSTOM is a control state, so it names the calendar surface instead of joining the radios.
  it('keeps CUSTOM out of the options and returns it as the calendar label', () => {
    const { result } = renderHook(
      () => usePeriodPresets(standardPeriodPresetValues),
      { wrapper: localeWrapper('ko') },
    );

    expect(result.current.presets.map(({ value }) => value)).not.toContain(
      'CUSTOM',
    );
    expect(result.current.customLabel).toBe('직접입력');
  });

  it.each([
    ['en', 'All', 'Custom'],
    ['ja', 'すべて', '直接入力'],
  ] as const)('follows the active locale in %s', (locale, first, custom) => {
    const { result } = renderHook(
      () => usePeriodPresets(standardPeriodPresetValues),
      { wrapper: localeWrapper(locale) },
    );

    expect(result.current.presets[0]?.label).toBe(first);
    expect(result.current.customLabel).toBe(custom);
  });
});
