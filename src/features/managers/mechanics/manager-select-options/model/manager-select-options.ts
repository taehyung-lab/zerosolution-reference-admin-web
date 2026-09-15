/**
 * 옵션 조회 하나를 선택 필드 하나의 표시 상태로 바꾼다. 목록 필터와 등록·수정 폼이 같은 표시 계약을 쓰므로
 * 두 소비자의 가장 가까운 공통 소유자에 둔다. 조회 출처·선행 조건·라벨 의미는 각 소비 훅이 소유한다.
 */
import type { AsyncFieldState } from "@/shared/ui/feedback/AsyncFieldBoundary";

export interface ManagerSelectOptions {
  readonly state: AsyncFieldState;
  readonly items: readonly { value: string; label: string }[];
  readonly retry: () => void;
}

/** 선행 조건이 충족되지 않아 아직 조회하지 않는 필드의 값이다. 조회 중인 필드에는 쓰지 않는다. */
export const noManagerSelectOptions: ManagerSelectOptions = {
  state: "ready",
  items: [],
  retry: () => undefined,
};

/** 실패를 빈 목록으로 접지 않고 로딩·실패·재시도를 필드까지 전달한다. 캐시된 값이 있으면 ready다. */
export function toManagerSelectOptions(query: {
  readonly data?: readonly { value: string; label: string }[];
  readonly isError: boolean;
  readonly refetch: () => unknown;
}): ManagerSelectOptions {
  return {
    state:
      query.data !== undefined ? "ready" : query.isError ? "error" : "loading",
    items: query.data ?? [],
    retry: () => void query.refetch(),
  };
}
