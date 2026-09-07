/**
 * 수정 화면에 필요한 원본 초기값 조회를 useDetailQuery에 연결한다.
 * 실제 API에서도 마스킹된 표시 상세와 수정용 응답을 구분할 수 있으므로 목록 행을 수정 초기값으로 대신하지 않는다.
 */
import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { managerEditDetailQuery } from "./queries";

export function useManagerEditDetail(managerId: string) {
  const { locale } = useLocale();
  return useDetailQuery(managerEditDetailQuery(locale, managerId));
}
