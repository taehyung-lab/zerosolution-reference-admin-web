import { ApiError } from '@/api/error';
import type {
  ManagerAccountStatus,
  ManagerDetail,
  ManagerListPage,
  ManagerListRequest,
  ManagerOption,
  ManagerRow,
  ManagerSortKey,
} from '../model/manager';

/**
 * TRANSPLANT_PENDING_MANAGER_QUERY: 이 저장소에는 운영자 조회 API 가 없다(AGENTS 1절). 아래 행과
 * 필터·정렬·페이지 계산은 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로
 * 표현하지 않는다. 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체한다.
 */
export const managerTypeFixtures: readonly ManagerOption[] = [
  { value: 'INTERNAL', label: 'Example type' },
  { value: 'SITE', label: 'Example site type' },
];

/** 권한마다 어떤 유형에서 쓰이는지를 함께 둔다. 목록 필터는 전체를, 등록·수정은 선택 유형의 권한만 쓴다. */
export const managerPermissionFixtures: readonly (ManagerOption & { readonly type: string })[] = [
  { value: '1', label: 'Example permission', type: 'INTERNAL' },
  { value: '2', label: 'Example site permission', type: 'SITE' },
];

const statuses: readonly ManagerAccountStatus[] = ['awaiting', 'rejected', 'active', 'inactive', 'locked'];

const managers: readonly ManagerDetail[] = Array.from({ length: 105 }, (_, index) => {
  const accountStatus = statuses[index % statuses.length]!;
  return {
    id: index < 5 ? `example-${accountStatus}` : `example-${accountStatus}-${index + 1}`,
    name: `Example${index + 1}`,
    type: managerTypeFixtures[0]!,
    permission: managerPermissionFixtures[0]!,
    organization: 'Example',
    phone: '010-0000-0000',
    email: `operator${index + 1}@example.com`,
    registrationRoute: 'WEB',
    accountStatus,
    ...(accountStatus === 'rejected' ? { statusReason: 'Example reason' } : {}),
    joinedAt: '2026-08-01T00:00:00Z',
    lastAccessAt: '2026-08-03T00:00:00Z',
    changeLogs:
      index === 2
        ? [
            {
              id: 'example-active-log-2',
              updatedAt: '2026-08-28T00:00:00Z',
              kind: 'UPDATE',
              changes: [
                { field: 'name', before: 'Example', after: 'Example3' },
                { field: 'permission', before: 'Example permission', after: 'Example permission' },
              ],
              manager: 'Admin',
            },
            {
              id: 'example-active-log-1',
              updatedAt: '2026-08-01T00:00:00Z',
              kind: 'CREATE',
              changes: [],
              manager: 'Admin',
            },
          ]
        : [],
  };
});

function toRow(detail: ManagerDetail): ManagerRow {
  return {
    id: detail.id,
    name: detail.name,
    type: detail.type.label,
    organization: detail.organization,
    phone: detail.phone,
    email: detail.email,
    permission: detail.permission.label,
    registrationRoute: detail.registrationRoute,
    accountStatus: detail.accountStatus,
    joinedAt: detail.joinedAt,
    lastAccessAt: detail.lastAccessAt,
  };
}

function sortValue(row: ManagerRow, key: ManagerSortKey): string {
  return row[key];
}

function matches(detail: ManagerDetail, request: ManagerListRequest): boolean {
  const instant = request.periodType === 'joinedAt' ? detail.joinedAt : detail.lastAccessAt;
  if (request.startDateTime !== undefined && Date.parse(instant) < Date.parse(request.startDateTime)) return false;
  if (request.endDateTime !== undefined && Date.parse(instant) > Date.parse(request.endDateTime)) return false;
  if (request.types?.length && !request.types.includes(detail.type.value)) return false;
  if (request.permission !== undefined && request.permission !== detail.permission.value) return false;
  if (request.statuses?.length && !request.statuses.includes(detail.accountStatus)) return false;
  if (request.registrationRoutes?.length && !request.registrationRoutes.includes(detail.registrationRoute)) return false;
  if (
    request.keywords?.length &&
    !request.keywords.every(({ field, value }) => detail[field].toLowerCase().includes(value.toLowerCase()))
  )
    return false;
  return true;
}

export function readManagerListPage(request: ManagerListRequest): Promise<ManagerListPage> {
  const rows = managers.filter((detail) => matches(detail, request)).map(toRow);
  const descending = request.sortDirection === 'desc';
  rows.sort((left, right) => {
    const order = sortValue(left, request.sortType).localeCompare(sortValue(right, request.sortType));
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({ rows: rows.slice(start, start + request.pageSize), total: rows.length });
}

export function readManagerDetail(managerId: string): Promise<ManagerDetail> {
  const detail = managers.find((record) => record.id === managerId);
  if (detail === undefined) {
    return Promise.reject(new ApiError({ kind: 'not-found', message: `manager ${managerId} not found` }));
  }
  return Promise.resolve(detail);
}

export function readManagerTypeOptions(): Promise<readonly ManagerOption[]> {
  return Promise.resolve(managerTypeFixtures);
}

/**
 * 목록 필터는 유형과 무관하게 사용 중인 전체 권한에서 하나를 고르고, 등록·수정만 선택한 유형에 종속된
 * 권한을 쓴다(`docs/reference/zero-sol/11-settings.md` 11.1). `type === undefined` 가 목록 필터의 전체 범위다.
 */
export function readManagerPermissionOptions(type: string | undefined): Promise<readonly ManagerOption[]> {
  return Promise.resolve(
    managerPermissionFixtures
      .filter((permission) => type === undefined || permission.type === type)
      .map(({ value, label }) => ({ value, label })),
  );
}
