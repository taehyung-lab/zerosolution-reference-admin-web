import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { appealDetailQueryOptions } from './queries';

export function useAppealDetail(appealId: string) {
  const { locale } = useLocale();
  return useDetailQuery(appealDetailQueryOptions(locale, appealId));
}
