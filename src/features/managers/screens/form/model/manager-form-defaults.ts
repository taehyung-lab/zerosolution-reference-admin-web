/**
 * 등록의 빈 초기값과 수정 API 응답을 폼용 문자열 값으로 바꾸는 변환을 정의한다.
 * 실제 API에서도 필요하며 Query 응답 전체를 폼 상태에 복제하지 않는다.
 */
import type { ManagerEditDetail } from "../../../api/manager-form-contract";
import type {
  ManagerCreateInput,
  ManagerEditInput,
} from "./manager-form-schema";

/** 등록의 빈 값은 명시 상수다. 수정 defaults 와 공유하지 않는다. */
export const managerCreateDefaults: ManagerCreateInput = {
  type: "",
  agencyId: "",
  permissionId: "",
  id: "",
  password: "",
  passwordConfirm: "",
  name: "",
  phone: "",
  email: "",
  organization: "",
};

/**
 * 수정 조회 응답을 폼 입력 값으로 평탄화한다.
 *
 * 응답의 `type`/`permission`/`agency` 는 `{ id, name }` 객체이지만 `Select` 의 값 계약은 스칼라다.
 * `status`, `statusReason`, `registrationRoute`, `changeLogs`, 타임스탬프처럼 폼이 제출하지 않는
 * 값은 여기서 버린다. Query 응답을 form 값으로 그대로 보관하지 않는다.
 */
export function toManagerEditDefaults(
  detail: ManagerEditDetail,
): ManagerEditInput {
  return {
    type: detail.type?.id ?? "",
    agencyId: detail.agency?.id === undefined ? "" : String(detail.agency.id),
    permissionId:
      detail.permission?.id === undefined ? "" : String(detail.permission.id),
    name: detail.name ?? "",
    phone: detail.phone ?? "",
    email: detail.email ?? "",
    organization: detail.organization ?? "",
  };
}
