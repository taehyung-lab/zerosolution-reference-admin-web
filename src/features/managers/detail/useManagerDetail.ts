import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { managerDetailQuery } from '../api/queries';

export function useManagerDetail(managerId: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerDetailQuery(locale, managerId));
}
