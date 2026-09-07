/**
 * 운영자 등록 mutation을 실행하고 성공 뒤 영향받는 목록 캐시를 갱신한다.
 * 실제 API에서도 필요한 서버 상태 workflow다. 폼 값·확인창·성공 이동은 화면이 소유한다.
 */
import type { UiLocale } from "@/shared/i18n/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managerKeys } from "../../../api/keys";
import { managerCreateMutation } from "../../../api/mutations";

/**
 * Manager 계열 전체를 무효화하는 이유는 목록·상세·수정 조회가 모두 같은 계정 데이터를 읽기 때문이고,
 * 부분 갱신 규칙은 신규 제품 계약이 없어 미확인이다.
 */
export function useCreateManagerMutation(locale: UiLocale) {
  const queryClient = useQueryClient();
  return useMutation({
    ...managerCreateMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: managerKeys.all(locale),
      });
    },
  });
}
