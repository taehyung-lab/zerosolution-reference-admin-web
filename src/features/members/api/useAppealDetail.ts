/** 대상 ID와 locale를 상세 캐시에 연결한다. 로딩·오류·없는 대상 판정은 공용 훅이 소유한다. */
import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { appealDetailQuery } from "./detail-queries";
export function useAppealDetail(id: string) {
  const { locale } = useLocale();
  return useDetailQuery(appealDetailQuery(locale, id));
}
