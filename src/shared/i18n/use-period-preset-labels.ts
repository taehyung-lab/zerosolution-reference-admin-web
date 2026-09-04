import type { PeriodValue } from '@/shared/lib/use-period-draft';
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
