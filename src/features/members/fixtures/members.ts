import { ApiError } from '@/api/error';
import type { MemberListPage, MemberListRequest, MemberProfile, MemberSortKey } from '../model/member';
import type { MemberActivityPage, MemberActivitySearch } from '../model/member-activity';
import type { MemberCounselRecord } from '../model/member-counsel';
import { recordFixtures } from './member-records';

/**
 * TRANSPLANT_PENDING_MEMBER_QUERY: 이 저장소에는 회원 조회 API 가 없다. 아래 행과 필터·정렬·페이지 계산은
 * 서버 페이지 응답을 흉내 내는 예시이며 endpoint·DTO·enum 을 확정 계약으로 표현하지 않는다.
 * 실제 계약이 확정되면 `api/queries.ts` 의 queryFn 과 함께 교체한다.
 */
const members: readonly MemberProfile[] = [
  {
    id: 'example-general',
    email: 'general@example.test',
    name: '예시회원',
    birthDate: '1995-05-05',
    phone: '010-2000-3000',
    accountStatus: 'general',
    restrictions: [],
    joinedAt: '2026-09-01T01:00:00Z',
    lastAccessedAt: '2026-09-05T01:00:00Z',
    signupMethod: 'direct',
  },
  {
    id: 'example-flagged',
    email: 'flagged@example.test',
    name: '예시불량',
    birthDate: '1990-03-03',
    phone: '010-4000-5000',
    accountStatus: 'flagged',
    restrictions: ['inquiry'],
    joinedAt: '2026-09-02T01:00:00Z',
    lastAccessedAt: '2026-09-05T02:00:00Z',
    signupMethod: 'kakao',
  },
];

function sortValue(member: MemberProfile, key: MemberSortKey): string {
  return member[key];
}

function matches(member: MemberProfile, request: MemberListRequest): boolean {
  const instant = Date.parse(member[request.periodType]);
  if (request.startDateTime !== undefined && instant < Date.parse(request.startDateTime)) return false;
  if (request.endDateTime !== undefined && instant > Date.parse(request.endDateTime)) return false;
  if (request.accountStatuses?.length && !request.accountStatuses.includes(member.accountStatus)) return false;
  if (request.signupMethods?.length && !request.signupMethods.includes(member.signupMethod)) return false;
  if (request.restrictions?.length && !request.restrictions.some((value) => member.restrictions.includes(value)))
    return false;
  if (
    request.keywords?.length &&
    !request.keywords.every(({ field, value }) => member[field].toLowerCase().includes(value.toLowerCase()))
  )
    return false;
  return true;
}

export function readMemberListPage(request: MemberListRequest): Promise<MemberListPage> {
  const rows = members.filter((member) => matches(member, request));
  const descending = request.sortDirection === 'desc';
  rows.sort((left, right) => {
    const order = sortValue(left, request.sortType).localeCompare(sortValue(right, request.sortType));
    return descending ? -order : order;
  });
  const start = (request.page - 1) * request.pageSize;
  return Promise.resolve({ rows: rows.slice(start, start + request.pageSize), total: rows.length });
}

/** 휴면 목록의 행도 회원 조회로 들어온다. 그 행에 없는 값은 예시로 채운다. */
export function readMemberDetail(memberId: string): Promise<MemberProfile> {
  const member = members.find((record) => record.id === memberId);
  if (member !== undefined) return Promise.resolve(member);
  const dormant = recordFixtures().dormant.find((record) => record.id === memberId);
  if (dormant === undefined) {
    return Promise.reject(new ApiError({ kind: 'not-found', message: `member ${memberId} not found` }));
  }
  return Promise.resolve({
    id: dormant.id,
    email: dormant.email,
    name: dormant.name,
    birthDate: '1995-05-05',
    phone: dormant.phone,
    accountStatus: dormant.accountStatus,
    restrictions: [],
    joinedAt: dormant.joinedAt,
    lastAccessedAt: dormant.lastAccessedAt,
    signupMethod: dormant.signupMethod,
  });
}

/** 101건은 페이지 이동을 확인하기 위한 개수다. 검색어는 공연명·예매번호·좌석번호를 본다. */
export function readMemberActivityPage(memberId: string, search: MemberActivitySearch): Promise<MemberActivityPage> {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `${memberId}:${search.tab}:${index + 1}`,
    occurredAt: '2026-09-03T01:00:00Z',
    performanceName: `REFERENCE ${search.tab}`,
    session: '1',
    performanceAt: '2026-09-03T02:00:00Z',
    bookingNumber: `EXAMPLE-${String(index + 1).padStart(3, '0')}`,
    seatNumber: `A-${index + 1}`,
  })).filter((row) =>
    [row.performanceName, row.bookingNumber, row.seatNumber].some((value) =>
      value.toLowerCase().includes(search.keyword.toLowerCase()),
    ),
  );
  const start = (search.page - 1) * search.pageSize;
  return Promise.resolve({ rows: rows.slice(start, start + search.pageSize), total: rows.length });
}

const counselRecords: readonly MemberCounselRecord[] = [
  {
    id: 'example-counsel',
    receivedAt: '2026-09-03T01:00:00Z',
    answeredAt: '2026-09-03T02:00:00Z',
    operatorName: 'REFERENCE',
    inquiryType: 'booking',
    content: 'REFERENCE',
    createdAt: '2026-09-03T02:00:00Z',
  },
];

/** 예시가 회원별로 갈라지지 않으므로 어떤 회원 ID 에도 같은 기록을 돌려준다. */
export function readMemberCounselRecords(memberId: string): Promise<readonly MemberCounselRecord[]> {
  return Promise.resolve(memberId === '' ? [] : counselRecords);
}
