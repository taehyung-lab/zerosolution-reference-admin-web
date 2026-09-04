import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { managerEditDetailQuery } from '../api/queries';

export function useManagerEditDetail(managerId: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerEditDetailQuery(locale, managerId));
}
