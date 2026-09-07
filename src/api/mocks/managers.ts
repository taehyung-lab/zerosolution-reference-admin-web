import { http, HttpResponse } from 'msw';
import type {
  get8, getForEdit1, getList8, getManagerTypes, getPermissions, getAgencies,
} from '../generated/endpoints';

// 현재 snapshot의 응답 예시다. 신규 제품의 유형·권한·상태 전이를 정의하지 않는다.
const types = [
  { id: 'INTERNAL', name: '내부 운영자' },
  { id: 'AGENCY', name: '기획사' },
] satisfies Awaited<ReturnType<typeof getManagerTypes>>;
const agencies = [{ id: 1, name: '테스트 기획사' }] satisfies Awaited<ReturnType<typeof getAgencies>>;
const permissions = types.map((type, index) => ({
  id: index + 1, name: `테스트 권한 ${index + 1}`, type, active: true,
})) satisfies Awaited<ReturnType<typeof getPermissions>>;

const records = types.map((type, index) => ({
  id: `mock-manager-${index + 1}`,
  name: `테스트 운영자 ${index + 1}`,
  organization: '테스트 조직',
  type,
  ...(type.id === 'AGENCY' ? { agency: agencies[0] } : {}),
  permission: permissions[index],
  status: { id: 'ACTIVE', name: '활성' },
  registrationRoute: { id: 'ADMIN', name: '관리자 등록' },
  phone: `010-0000-000${index + 1}`,
  email: `manager-${index + 1}@example.test`,
  createdAt: `2026-08-0${index + 1}T00:00:00Z`,
  updatedAt: `2026-09-0${index + 1}T00:00:00Z`,
  changeLogs: [],
})) satisfies Awaited<ReturnType<typeof getForEdit1>>[];

function response<T>(data: T) {
  return HttpResponse.json({ header: { resultCode: 200 }, data });
}

function notFound() {
  return new HttpResponse(null, { status: 404 });
}

// 실서버의 개인정보 표시 규칙을 확대하지 않고 목록의 마스킹 계약만 재현한다.
function masked(record: (typeof records)[number]) {
  return { ...record, phone: record.phone.replace(/-\d{4}-/, '-****-'), email: 'mana****@example.test' };
}

export const managerHandlers = [
  http.get('*/api/v1/options/manager-types', () => response(types)),
  http.get('*/api/v1/options/agencies', () => response(agencies)),
  http.get('*/api/v1/options/permissions', ({ request }) => {
    const type = new URL(request.url).searchParams.get('type');
    return response(permissions.filter((permission) => type === null || permission.type.id === type));
  }),
  http.get('*/api/v1/managers', ({ request }) => {
    const params = new URL(request.url).searchParams;
    // 지원하지 않는 조건을 무시해 검색 성공처럼 보이게 하지 않는다.
    const supported = new Set(['periodType', 'pageNo', 'pageSize', 'sortType', 'sortDirection', 'types[]', 'statuses[]']);
    if ([...params.keys()].some((key) => !supported.has(key))) {
      return new HttpResponse(null, { status: 501 });
    }
    const pageNo = Number(params.get('pageNo') ?? 1);
    const pageSize = Number(params.get('pageSize') ?? 100);
    if (!Number.isSafeInteger(pageNo) || pageNo < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1) {
      return new HttpResponse(null, { status: 400 });
    }
    const selectedTypes = params.getAll('types[]');
    const statuses = params.getAll('statuses[]');
    const rows = records.filter((row) =>
      (selectedTypes.length === 0 || selectedTypes.includes(row.type.id)) &&
      (statuses.length === 0 || statuses.includes(row.status.id)),
    );
    const sortType = params.get('sortType') ?? 'CREATED_AT';
    const sortDirection = params.get('sortDirection') ?? 'DESC';
    const sortValue = (row: (typeof records)[number]): string | undefined => {
      const values: Record<string, string> = {
      CREATED_AT: row.createdAt, UPDATED_AT: row.updatedAt, TYPE: row.type.name,
      ID: row.id, NAME: row.name, ORGANIZATION: row.organization,
      PERMISSION: row.permission?.name ?? '', STATUS: row.status.name, AGENCY: row.agency?.name ?? '',
      };
      return values[sortType];
    };
    if (records[0] === undefined || sortValue(records[0]) === undefined || !['ASC', 'DESC'].includes(sortDirection)) {
      return new HttpResponse(null, { status: 400 });
    }
    rows.sort((left, right) => (sortValue(left) ?? '').localeCompare(sortValue(right) ?? '') * (sortDirection === 'ASC' ? 1 : -1));
    const data = {
      pageNo, pageSize, totalCount: rows.length,
      list: rows.slice((pageNo - 1) * pageSize, pageNo * pageSize).map(masked),
    } satisfies Awaited<ReturnType<typeof getList8>>;
    return response(data);
  }),
  http.get('*/api/v1/managers/:id/edit', ({ params }) => {
    const record = records.find((row) => row.id === params.id);
    return record === undefined ? notFound() : response(record);
  }),
  http.get('*/api/v1/managers/:id', ({ params }) => {
    const record = records.find((row) => row.id === params.id);
    return record === undefined ? notFound() : response(masked(record) satisfies Awaited<ReturnType<typeof get8>>);
  }),
];
