import { useDetailQuery } from '@/api/required-query';
import { useLocale } from '@/shared/i18n/locale-context';
import { counselDetailQueryOptions } from './queries';

/** 상담 팝업이 연 상담 한 건. 어떤 ID 를 열지는 목록 화면이 소유한다. */
export function useCounselDetail(counselId: string) {
  const { locale } = useLocale();
  return useDetailQuery(counselDetailQueryOptions(locale, counselId));
}
