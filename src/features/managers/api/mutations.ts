/**
 * 운영자 등록·수정의 생성 API 호출과 재시도 금지를 선언한다.
 * 실제 API에서도 필요한 요청 경계다. 캐시 갱신은 실행 훅, 확인창·이동·문구는 호출 화면이 소유한다.
 */
import { mutationOptions } from '@tanstack/react-query';
import { create7, update9 } from '@/api/generated/endpoints';
import type { ManagerCreateRequest, ManagerUpdateRequest } from './manager-form-contract';

/**
 * 서버 호출 선언만 둔다. 등록/수정은 재시도하지 않는다 — 서버가 이미 반영했는지 알 수 없는 요청을
 * 반복하면 중복 생성이나 덮어쓰기가 된다. cache consequence(invalidate)는 이 선언을 실행하는
 * workflow 훅(`form/use*ManagerMutation`)이 `useQueryClient`와 함께 소유한다.
 */
export function managerCreateMutation() {
  return mutationOptions({
    mutationFn: async (request: ManagerCreateRequest) => create7(request),
    retry: false,
  });
}

export function managerUpdateMutation(id: string) {
  return mutationOptions({
    mutationFn: async (request: ManagerUpdateRequest) => update9(id, request),
    retry: false,
  });
}
