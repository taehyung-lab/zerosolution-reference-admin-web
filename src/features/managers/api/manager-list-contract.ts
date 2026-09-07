/**
 * 기존 OpenAPI의 운영자 목록 enum을 feature가 사용할 이름으로 노출하는 경계다.
 * 실제 API에서도 계약 경계는 필요하지만 현재 enum을 신규 제품의 상태/유형 정책으로 복사하지 않는다.
 */
export {
  GetList8PeriodType as managerPeriodTypes,
  GetList8RegistrationRouteTypesItem as managerRegistrationRouteTypes,
  GetList8SortDirection as managerSortDirections,
  GetList8SortType as managerApiSortTypes,
  GetList8StatusesItem as managerStatuses,
  GetList8TypesItem as managerTypes,
} from '@/api/generated/models';

/**
 * 전체 생성 정렬 enum은 API 어휘다. 화면 URL·정렬 선택·컬럼이 노출하는 부분집합은
 * list/manager-sort.ts가 소유하며 생성 enum 전체를 화면 기능으로 확대하지 않는다.
 */
export type {
  GetList8PeriodType as ManagerPeriodType,
  GetList8RegistrationRouteTypesItem as ManagerRegistrationRouteType,
  GetList8SortDirection as ManagerSortDirection,
  GetList8SortType as ManagerApiSortType,
  GetList8StatusesItem as ManagerStatus,
  GetList8TypesItem as ManagerType,
} from '@/api/generated/models';
