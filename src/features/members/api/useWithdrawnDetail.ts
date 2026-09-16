import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { withdrawnDetailQueryOptions } from './queries';

export function useWithdrawnDetail(memberId: string) {
  const { locale } = useLocale();
  return useDetailQuery(withdrawnDetailQueryOptions(locale, memberId));
}
