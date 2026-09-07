import type { PeriodPreset, PeriodValue } from '@/shared/lib/datetime';
import { useTranslation } from 'react-i18next';

export function usePeriodPresetLabels(): Readonly<
  Record<PeriodValue, string>
> {
  const { t } = useTranslation('shared');
  return {
    ALL: t('list.periodPresets.ALL'),
    YEAR_1: t('list.periodPresets.YEAR_1'),
    MONTH_6: t('list.periodPresets.MONTH_6'),
    MONTH_3: t('list.periodPresets.MONTH_3'),
    MONTH_1: t('list.periodPresets.MONTH_1'),
    DAY_7: t('list.periodPresets.DAY_7'),
    YESTERDAY: t('list.periodPresets.YESTERDAY'),
    TODAY: t('list.periodPresets.TODAY'),
    CUSTOM: t('list.periodPresets.CUSTOM'),
  };
}

/**
 * 채택한 preset 값을 공용 번역과 짝지어 `PeriodField`가 받는 형태로 돌려준다. `values`에
 * 기본값을 두지 않는 이유는 어느 집합을 채택했는지가 call site에 남아야 하기 때문이다
 * (표준 전체는 `standardPeriodPresetValues`를 넘긴다).
 *
 * 값이 아니라 **문구**가 다른 화면은 이 훅을 쓰지 않는다. 그런 문구는 공용 문장이 아니라
 * 그 화면 namespace의 도메인 의미이므로 화면이 자기 `t`로 직접 조립한다.
 *
 * `CUSTOM`은 선택지가 아니라 상태이므로 목록에 섞이지 않고 calendar surface 이름으로만 나간다.
 */
export function usePeriodPresets(values: readonly PeriodPreset[]): {
  readonly presets: readonly {
    readonly value: PeriodPreset;
    readonly label: string;
  }[];
  readonly customLabel: string;
} {
  const labels = usePeriodPresetLabels();

  return {
    presets: values.map((value) => ({ value, label: labels[value] })),
    customLabel: labels.CUSTOM,
  };
}
