import { i18n } from "@/shared/i18n/i18n";
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";
import {
  maskMemberEmail,
  maskMemberPhone,
  type MemberProfile,
} from "../model/member-profile";
import type { MemberListRow } from "../list/member-row";
import type { MemberSearch } from "../list/search-schema";
import type { MemberActivitySearch } from "../detail/activity/MemberActivitySection";
import { memberRecordFixtures } from "./member-records";

// TRANSPLANT_PENDING_MEMBER_REFERENCE_DATA: synthetic read-only inputs, never a server contract.
const members: readonly MemberProfile[] = [
  {
    id: "example-general",
    email: "general@example.test",
    values: {
      accountStatus: "general",
      restrictions: [],
      name: "예시회원",
      birthDate: "1995-05-05",
      phone: "010-2000-3000",
    },
    joinedAt: "2026-09-01T01:00:00Z",
    lastAccessedAt: "2026-09-05T01:00:00Z",
    signupMethod: "direct",
  },
  {
    id: "example-flagged",
    email: "flagged@example.test",
    values: {
      accountStatus: "flagged",
      restrictions: ["inquiry"],
      name: "예시불량",
      birthDate: "1990-03-03",
      phone: "010-4000-5000",
    },
    joinedAt: "2026-09-02T01:00:00Z",
    lastAccessedAt: "2026-09-05T02:00:00Z",
    signupMethod: "kakao",
  },
];

export function findMemberFixture(id: string): MemberProfile | undefined {
  const active = members.find((member) => member.id === id);
  if (active !== undefined) return active;
  const dormant = memberRecordFixtures().dormant.find(
    (member) => member.id === id,
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
          birthDate: "1995-05-05",
          accountStatus: dormant.accountStatus,
          restrictions: [],
        },
      };
}

export function selectMemberFixtures(
  search: MemberSearch,
  variant: "all" | "general" | "flagged",
): { rows: readonly MemberListRow[]; total: number } {
  const filtered = members.filter((member) => {
    const values = member.values;
    const instant = member[search.periodType];
    return (
      (variant === "all" || values.accountStatus === variant) &&
      (search.accountStatuses.length === 0 ||
        search.accountStatuses.includes(values.accountStatus)) &&
      (search.signupMethods.length === 0 ||
        search.signupMethods.includes(member.signupMethod)) &&
      (search.restrictions.length === 0 ||
        search.restrictions.some((restriction) =>
          values.restrictions.includes(restriction),
        )) &&
      (search.startDateTime === undefined ||
        Date.parse(instant) >= Date.parse(search.startDateTime)) &&
      (search.endDateTime === undefined ||
        Date.parse(instant) <= Date.parse(search.endDateTime)) &&
      (search.keywords.length === 0 ||
        search.keywords.some(({ field, value }) =>
          (field === "email" ? member.email : values[field])
            .toLowerCase()
            .includes(value.toLowerCase()),
        ))
    );
  });
  const value = (member: MemberProfile): string =>
    search.sortType === "name" || search.sortType === "phone"
      ? member.values[search.sortType]
      : member[search.sortType];
  filtered.sort(
    (a, b) =>
      value(a).localeCompare(value(b)) *
      (search.sortDirection === "asc" ? 1 : -1),
  );
  return {
    total: filtered.length,
    rows: filtered
      .slice((search.page - 1) * search.pageSize, search.page * search.pageSize)
      .map((member) => ({
        key: member.id,
        grade: "—",
        signupMethod: i18n.t(`members:signup.${member.signupMethod}`),
        email: maskMemberEmail(member.email),
        name: member.values.name,
        phone: maskMemberPhone(member.values.phone),
        accountStatus: i18n.t(
          `members:accountStatus.${member.values.accountStatus}`,
        ),
        joinedAt: `${formatDate(member.joinedAt)} ${formatTimeInTimeZone(member.joinedAt, displayTimeZone())}`,
        lastAccessedAt: `${formatDate(member.lastAccessedAt)} ${formatTimeInTimeZone(member.lastAccessedAt, displayTimeZone())}`,
        restrictions: member.values.restrictions.map((restriction) =>
          i18n.t(`members:restriction.${restriction}`),
        ),
      })),
  };
}

export function selectMemberActivityFixture(
  memberId: string,
  query: MemberActivitySearch,
) {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `${memberId}:${query.tab}:${index + 1}`,
    occurredAt: "2026-09-03T01:00:00Z",
    performanceName: `REFERENCE ${query.tab}`,
    session: "1",
    performanceAt: "2026-09-03T02:00:00Z",
    bookingNumber: `EXAMPLE-${String(index + 1).padStart(3, "0")}`,
    seatNumber: `A-${index + 1}`,
  })).filter((row) =>
    [row.performanceName, row.bookingNumber, row.seatNumber].some((value) =>
      value.toLowerCase().includes(query.keyword.toLowerCase()),
    ),
  );
  return {
    rows: rows.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: rows.length,
  };
}
export const memberCounselFixtures = [
  {
    id: "example-counsel",
    receivedAt: "2026-09-03T01:00:00Z",
    answeredAt: "2026-09-03T02:00:00Z",
    operatorName: "REFERENCE",
    inquiryType: "booking" as const,
    content: "REFERENCE",
    createdAt: "2026-09-03T02:00:00Z",
  },
];
