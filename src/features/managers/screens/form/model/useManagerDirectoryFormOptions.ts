/**
 * 제품 운영자 등록·수정 폼의 유형·권한 옵션을 Query로 조회해 필드 상태로 넘긴다.
 * 권한은 선택한 유형에 종속되므로 유형 선택 전에는 조회하지 않는다(11-settings.md 11.1 운영자 등록).
 * 리허설 API용 useManagerFormOptions와 서버 어휘가 달라 조회 출처만 분리하고 필드 상태 변환은 공유한다.
 */
import { useLocale } from "@/shared/i18n/locale-context";
import { useQuery } from "@tanstack/react-query";
import {
  managerDirectoryPermissionOptionsQuery,
  managerDirectoryTypeOptionsQuery,
} from "../../../api/directory-queries";
import {
  noManagerSelectOptions,
  toManagerSelectOptions,
} from "../../../mechanics/manager-select-options/model/manager-select-options";
import type { ManagerFormOptions } from "./useManagerFormOptions";

export function useManagerDirectoryFormOptions(
  type: string,
): ManagerFormOptions {
  const { locale } = useLocale();
  const typeSelected = type !== "";
  const types = useQuery(managerDirectoryTypeOptionsQuery(locale));
  const permissions = useQuery(
    managerDirectoryPermissionOptionsQuery(
      locale,
      typeSelected ? { type } : undefined,
    ),
  );

  return {
    // TRANSPLANT_PENDING_MANAGER_DIRECTORY_OPTIONS: 제품 유형·권한 옵션 endpoint가 미확인이다.
    // 확인된 제품 유형 목록에 기획사 값이 없어 기획사 필드는 도달하지 않으므로 옵션 출처를 지어내지 않는다.
    isAgency: false,
    agency: noManagerSelectOptions,
    typeSelected,
    type: toManagerSelectOptions(types),
    permission: typeSelected
      ? toManagerSelectOptions(permissions)
      : noManagerSelectOptions,
  };
}
