/** 제품 상세/수정은 같은 ID 캐시를 사용하며 조회 상태 판정은 공용 훅이 맡는다. */
import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { managerDirectoryDetailQuery } from "./directory-queries";
export function useManagerDirectoryDetail(id: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerDirectoryDetailQuery(locale, id));
}
