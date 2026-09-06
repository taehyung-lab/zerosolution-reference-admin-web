import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UiLocale } from '@/shared/i18n/locale';
import { managerKeys } from '../api/keys';
import { managerCreateMutation } from '../api/mutations';

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
