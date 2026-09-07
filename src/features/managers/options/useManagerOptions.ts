/**
 * 운영자 유형·권한·기획사 옵션을 각각 조회하고 서버 레코드를 선택 UI 값/라벨로 변환한다.
 * 실제 API에서도 필요한 feature 연결부다. 옵션 의미·선행 유형·locale별 캐시를 도메인 없는 공용 훅으로 숨기지 않는다.
 */
import { useLocale } from '@/shared/i18n/locale-context';
import { useQuery } from '@tanstack/react-query';
import type { ManagerPermissionScope } from '../api/manager-form-contract';
import { managerTypes } from '../api/manager-list-contract';
import {
  managerAgencyOptionsQuery,
  managerPermissionOptionsQuery,
  managerTypeOptionsQuery,
} from '../api/queries';

interface StringIdNameOptionSource {
  readonly id?: string;
  readonly name?: string;
}

interface IdNameOptionSource {
  readonly id?: string | number;
  readonly name?: string;
}

function toManagerTypeOptions(options: readonly StringIdNameOptionSource[]) {
  return options.flatMap(({ id, name }) =>
    id && Object.hasOwn(managerTypes, id) ? [{ value: id, label: name ?? '' }] : [],
  );
}

function toIdNameOptions(options: readonly IdNameOptionSource[]) {
  return options.flatMap(({ id, name }) =>
    id === undefined ? [] : [{ value: String(id), label: name ?? String(id) }],
  );
}

export function useManagerTypeOptions() {
  const { locale } = useLocale();
  return useQuery({
    ...managerTypeOptionsQuery(locale),
    select: toManagerTypeOptions,
  });
}

export function useManagerPermissionOptions(type: ManagerPermissionScope | undefined) {
  const { locale } = useLocale();
  return useQuery({
    ...managerPermissionOptionsQuery(locale, type),
    select: toIdNameOptions,
  });
}

export function useManagerAgencyOptions() {
  const { locale } = useLocale();
  return useQuery({
    ...managerAgencyOptionsQuery(locale),
    select: toIdNameOptions,
  });
}
