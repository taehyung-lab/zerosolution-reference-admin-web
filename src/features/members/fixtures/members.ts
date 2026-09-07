/**
 * 회원 목록·상세·활동·상담 시나리오를 연결하는 예시 데이터와 조회 계산이다.
 * 실제 제품의 데이터 저장소가 아니다. 서버 조회가 연결되면 화면의 직접 import를 제거하고 필요한 예시는 mock/테스트에만 유지한다.
 * 서버가 할 필터·정렬·페이지 계산만 재현하고 화면 표시값은 만들지 않는다. 행 변환은 feature 매퍼가 소유한다.
 */
import type { MemberActivitySearch } from '../detail/activity/MemberActivitySection';
import type { MemberSearch } from '../list/model/search-schema';
import { type MemberProfile } from '../model/member-profile';
import { memberRecordFixtures } from './member-records';

// TRANSPLANT_PENDING_MEMBER_REFERENCE_DATA: synthetic read-only inputs, never a server contract.
const members: readonly MemberProfile[] = [
  {
    id: 'example-general',
    email: 'general@example.test',
    values: {
      accountStatus: 'general',
      restrictions: [],
      name: '예시회원',
      birthDate: '1995-05-05',
      phone: '010-2000-3000',
    },
    joinedAt: '2026-09-01T01:00:00Z',
    lastAccessedAt: '2026-09-05T01:00:00Z',
    signupMethod: 'direct',
  },
  {
    id: 'example-flagged',
    email: 'flagged@example.test',
    values: {
      accountStatus: 'flagged',
      restrictions: ['inquiry'],
      name: '예시불량',
      birthDate: '1990-03-03',
      phone: '010-4000-5000',
    },
    joinedAt: '2026-09-02T01:00:00Z',
    lastAccessedAt: '2026-09-05T02:00:00Z',
    signupMethod: 'kakao',
  },
];

export function findMemberFixture(id: string): MemberProfile | undefined {
  const active = members.find((member) => member.id === id);
  if (active !== undefined) return active;
  const dormant = memberRecordFixtures().dormant.find(
    (member) => member.id === id
  );
  return dormant === undefined
    ? undefined
    : {
        id,
        email: dormant.email,
        joinedAt: dormant.joinedAt,
        lastAccessedAt: dormant.lastAccessedAt,
        signupMethod: dormant.signupMethod,
        values: {
          name: dormant.name,
          phone: dormant.phone,
          birthDate: '1995-05-05',
          accountStatus: dormant.accountStatus,
          restrictions: [],
        },
      };
}

/** 서버 목록 응답이 줄 한 페이지의 회원 모델이다. 마스킹·라벨·시각 표시는 여기서 만들지 않는다. */
export interface MemberProfilePage {
  readonly rows: readonly MemberProfile[];
  readonly total: number;
}

export function selectMemberProfilePage(
  search: MemberSearch,
  variant: 'all' | 'general' | 'flagged'
): MemberProfilePage {
  const filtered = members.filter((member) => {
    const values = member.values;
    const instant = member[search.periodType];
    return (
      (variant === 'all' || values.accountStatus === variant) &&
      (search.accountStatuses.length === 0 ||
        search.accountStatuses.includes(values.accountStatus)) &&
      (search.signupMethods.length === 0 ||
        search.signupMethods.includes(member.signupMethod)) &&
      (search.restrictions.length === 0 ||
        search.restrictions.some((restriction) =>
          values.restrictions.includes(restriction)
        )) &&
      (search.startDateTime === undefined ||
        Date.parse(instant) >= Date.parse(search.startDateTime)) &&
      (search.endDateTime === undefined ||
        Date.parse(instant) <= Date.parse(search.endDateTime)) &&
      (search.keywords.length === 0 ||
        search.keywords.some(({ field, value }) =>
          (field === 'email' ? member.email : values[field])
            .toLowerCase()
            .includes(value.toLowerCase())
        ))
    );
  });
  const value = (member: MemberProfile): string =>
    search.sortType === 'name' || search.sortType === 'phone'
      ? member.values[search.sortType]
      : member[search.sortType];
  filtered.sort(
    (a, b) =>
      value(a).localeCompare(value(b)) *
      (search.sortDirection === 'asc' ? 1 : -1)
  );
  return {
    total: filtered.length,
    rows: filtered.slice(
      (search.page - 1) * search.pageSize,
      search.page * search.pageSize
    ),
  };
}

export function selectMemberActivityFixture(
  memberId: string,
  query: MemberActivitySearch
) {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `${memberId}:${query.tab}:${index + 1}`,
    occurredAt: '2026-09-03T01:00:00Z',
    performanceName: `REFERENCE ${query.tab}`,
    session: '1',
    performanceAt: '2026-09-03T02:00:00Z',
    bookingNumber: `EXAMPLE-${String(index + 1).padStart(3, '0')}`,
    seatNumber: `A-${index + 1}`,
  })).filter((row) =>
    [row.performanceName, row.bookingNumber, row.seatNumber].some((value) =>
      value.toLowerCase().includes(query.keyword.toLowerCase())
    )
  );
  return {
    rows: rows.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize
    ),
    total: rows.length,
  };
}
/** 상세 상담 절의 예시 기록이다. 예시가 회원별로 달라지지 않으므로 어떤 회원 ID에도 같은 기록을 돌려준다. */
export const memberCounselFixtures = [
  {
    id: 'example-counsel',
    receivedAt: '2026-09-03T01:00:00Z',
    answeredAt: '2026-09-03T02:00:00Z',
    operatorName: 'REFERENCE',
    inquiryType: 'booking' as const,
    content: 'REFERENCE',
    createdAt: '2026-09-03T02:00:00Z',
  },
];
