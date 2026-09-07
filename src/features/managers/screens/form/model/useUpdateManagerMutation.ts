/**
 * 운영자 수정 mutation을 실행하고 목록·상세·수정 초기값 캐시의 결과 처리를 연결한다.
 * 실제 API에서도 필요하며 어떤 캐시가 바뀌는지는 해당 업무 계약이 소유한다.
 */
import type { UiLocale } from "@/shared/i18n/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managerKeys } from "../../../api/keys";
import { managerUpdateMutation } from "../../../api/mutations";

/** 무효화 범위의 근거는 useCreateManagerMutation 과 같다. */
export function useUpdateManagerMutation(locale: UiLocale, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...managerUpdateMutation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: managerKeys.all(locale),
      });
    },
  });
}
