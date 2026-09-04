import { renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { i18n } from './i18n';
import { usePeriodPresetLabels } from './use-period-preset-labels';

describe('usePeriodPresetLabels', () => {
  it.each([
    ['ko', { ALL: '전체', TODAY: '오늘', CUSTOM: '직접입력' }],
    ['en', { ALL: 'All', TODAY: 'Today', CUSTOM: 'Custom' }],
    ['ja', { ALL: 'すべて', TODAY: '今日', CUSTOM: '直接入力' }],
  ] as const)('returns the complete shared preset vocabulary in %s', (locale, expected) => {
    const localized = i18n.cloneInstance({ lng: locale });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <I18nextProvider i18n={localized}>{children}</I18nextProvider>
    );
    const { result } = renderHook(() => usePeriodPresetLabels(), { wrapper });

    expect(Object.keys(result.current)).toHaveLength(9);
    expect(result.current).toMatchObject(expected);
  });
});
