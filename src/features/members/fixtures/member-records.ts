import { ApiError } from '@/api/error';
import type {
  AccessListRequest,
  AppealListRequest,
  AppealRecord,
  AppealRow,
  CounselDetail,
  CounselListRequest,
  CounselOption,
  CounselReissueInput,
  CounselRow,
  DormantListRequest,
  DormantMemberRow,
  MemberAccessRow,
  RecordPage,
  WithdrawnListRequest,
  WithdrawnMemberRow,
} from '../model/member-records';

/**
 * TRANSPLANT_PENDING_MEMBER_RECORDS_QUERY: 다섯 기록 목록과 상세·재발권 입력의 예시. 서버 페이지 응답을 흉내 내는
 * 필터·정렬·페이지 계산이며 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체한다. 101건은 페이지 이동 확인용이다.
 */
const base = {
  email: 'reference@example.com',
  name: 'Example member',
  phone: '01012345678',
  accountStatus: 'general' as const,
};

export function recordFixtures() {
  const dormant: DormantMemberRow[] = Array.from({ length: 101 }, (_, index) => ({
    ...base,
    id: `dormant-${index + 1}`,
    signupMethod: 'direct',
    joinedAt: '2024-01-01T00:00:00Z',
    lastAccessedAt: '2024-06-01T00:00:00Z',
    dormantAt: '2025-06-01T00:00:00Z',
  }));
  const withdrawn: WithdrawnMemberRow[] = [
    {
      id: 'withdrawn-1',
      email: base.email,
      signupMethod: 'direct',
      accountStatus: 'general',
      joinedAt: '2024-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
      withdrawnAt: '2025-06-01T00:00:00Z',
      reason: 'Example withdrawal reason',
    },
  ];
  const access: MemberAccessRow[] = Array.from({ length: 101 }, (_, index) => ({
    ...base,
    grade: '—',
    id: `access-${index + 1}`,
    accessedAt: '2026-09-01T00:00:00Z',
    accessPath: 'app',
  }));
  const counsel: CounselRow[] = [
    {
      ...base,
      id: 'counsel-1',
      memberId: 'example-general',
      signupMethod: 'direct',
      receivedAt: '2026-09-01T00:00:00Z',
      answeredAt: '2026-09-01T01:00:00Z',
      inquiryType: 'reference',
      content: 'Example inquiry',
      status: 'waiting',
    },
  ];
  const appeals: AppealRow[] = [
    {
      ...base,
      id: 'appeal-1',
      memberId: 'example-flagged',
      accountStatus: 'flagged',
      appliedAt: '2026-09-01T00:00:00Z',
      flaggedAt: '2026-08-01T00:00:00Z',
      restrictions: ['inquiry'],
      status: 'held',
      result: 'completed',
    },
  ];
  return { dormant, withdrawn, access, counsel, appeals };
}

/** 다섯 요청 타입의 공통 읽기 방식. 없는 필드는 조건이 아니다. */
interface AnyRecordRequest {
  readonly page: number;
  readonly pageSize: number;
  readonly sortType: string;
  readonly sortDirection: 'asc' | 'desc';
  readonly periodType: string;
  readonly startDateTime?: string;
  readonly endDateTime?: string;
  readonly keywords?: readonly { readonly field: string; readonly value: string }[];
  readonly signupMethods?: readonly string[];
  readonly accountStatuses?: readonly string[];
  readonly statuses?: readonly string[];
  readonly results?: readonly string[];
  readonly inquiryType?: string;
  readonly accessPaths?: readonly string[];
  readonly restrictions?: readonly string[];
}

/** 예시 행의 값은 문자열 또는 문자열 배열이다. 그 밖의 값은 비교 대상이 아니다. */
function cellText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(',');
  return '';
}

function matches(row: Record<string, unknown>, request: AnyRecordRequest): boolean {
  const text = (key: string) => cellText(row[key]);
  const includes = (values: readonly string[] | undefined, key: string) => !values?.length || values.includes(text(key));
  const instant = Date.parse(text(request.periodType));
  const restrictions = Array.isArray(row.restrictions) ? (row.restrictions as string[]) : [];
  return (
    (request.keywords ?? []).every(({ field, value }) => text(field).toLowerCase().includes(value.toLowerCase())) &&
    (request.startDateTime === undefined || instant >= Date.parse(request.startDateTime)) &&
    (request.endDateTime === undefined || instant <= Date.parse(request.endDateTime)) &&
    includes(request.signupMethods, 'signupMethod') &&
    includes(request.accountStatuses, 'accountStatus') &&
    includes(request.statuses, 'status') &&
    includes(request.results, 'result') &&
    includes(request.accessPaths, 'accessPath') &&
    (request.inquiryType === undefined || request.inquiryType === text('inquiryType')) &&
    (!request.restrictions?.length || request.restrictions.some((value) => restrictions.includes(value)))
  );
}

function page<TRow extends object>(rows: readonly TRow[], request: AnyRecordRequest): Promise<RecordPage<TRow>> {
  const value = (row: TRow) => cellText((row as Record<string, unknown>)[request.sortType]);
  const filtered = rows.filter((row) => matches(row as Record<string, unknown>, request));
  filtered.sort((left, right) => value(left).localeCompare(value(right)) * (request.sortDirection === 'asc' ? 1 : -1));
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({ rows: filtered.slice(start, start + request.pageSize), total: filtered.length });
}

export const readDormantListPage = (request: DormantListRequest) => page(recordFixtures().dormant, request);
export const readWithdrawnListPage = (request: WithdrawnListRequest) => page(recordFixtures().withdrawn, request);
export const readAccessListPage = (request: AccessListRequest) => page(recordFixtures().access, request);
export const readCounselListPage = (request: CounselListRequest) => page(recordFixtures().counsel, request);
export const readAppealListPage = (request: AppealListRequest) => page(recordFixtures().appeals, request);

function required<T>(value: T | undefined, label: string): Promise<T> {
  return value === undefined
    ? Promise.reject(new ApiError({ kind: 'not-found', message: `${label} not found` }))
    : Promise.resolve(value);
}

export function readWithdrawnDetail(memberId: string): Promise<WithdrawnMemberRow> {
  return required(recordFixtures().withdrawn.find((row) => row.id === memberId), `withdrawn member ${memberId}`);
}

export function readAppealDetail(appealId: string): Promise<AppealRecord> {
  const row = recordFixtures().appeals.find((item) => item.id === appealId);
  return required(
    row === undefined
      ? undefined
      : {
          ...row,
          birthDate: '1990-03-03',
          joinedAt: '2024-01-01T00:00:00Z',
          signupMethod: 'direct',
          application: 'Example appeal statement',
          attachments: [],
          processing: { status: row.status, result: row.result, reason: '', direct: '', opinion: '' },
          notified: false,
        },
    `appeal ${appealId}`,
  );
}

export function readCounselDetail(counselId: string): Promise<CounselDetail> {
  const row = recordFixtures().counsel.find((item) => item.id === counselId);
  return required(
    row === undefined
      ? undefined
      : {
          ...row,
          records: [
            {
              id: 'counsel-note-1',
              createdAt: row.receivedAt,
              receivedAt: row.receivedAt,
              answeredAt: row.answeredAt,
              operatorName: 'Example operator',
              inquiryType: 'reprintLost',
              content: row.content,
            },
          ],
          booking: { performance: 'Example performance', booking: 'REFERENCE-001', booker: row.name },
        },
    `counsel ${counselId}`,
  );
}

export function readCounselInquiryOptions(): Promise<readonly CounselOption[]> {
  return Promise.resolve([{ value: 'reference', label: 'Example inquiry type' }]);
}

/** 프린터 선택과 미리보기 UI 를 확인하는 예시다. 실제 프린터 연결·가용 상태·인쇄 성공은 검증하지 않는다. */
export function readCounselReissueInput(): Promise<CounselReissueInput> {
  return Promise.resolve({
    printers: [{ id: 'reference-printer', name: 'Example printer', enabled: true, busy: false }],
    preview: 'REFERENCE-001 · Example performance · A-1',
  });
}
