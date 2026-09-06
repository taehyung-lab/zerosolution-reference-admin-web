import { env } from "@/env";
import {
  matchesMemberRecordSearch,
  memberRecordFixtures,
  sortMemberRecords,
} from "../fixtures/member-records";
import type { MemberRecordSearch } from "./member-record-search";

function page<T>(rows: readonly T[], search: MemberRecordSearch) {
  const pageSize = search.pageSize ?? 100;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(search.page ?? 1, totalPages);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    total: rows.length,
    totalPages,
    page: current,
  };
}
export function dormantData(search: MemberRecordSearch) {
  const rows = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().dormant.filter((row) =>
        matchesMemberRecordSearch({ ...row }, search),
      )
    : [];
  return page(
    sortMemberRecords(
      rows,
      (row) => row[search.sortType as keyof typeof row] ?? row.joinedAt,
      search.sortDirection,
    ),
    search,
  );
}
export function withdrawnData(search: MemberRecordSearch) {
  const rows = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().withdrawn.filter((row) =>
        matchesMemberRecordSearch({ ...row }, search),
      )
    : [];
  return page(
    sortMemberRecords(
      rows,
      (row) => row[search.sortType as keyof typeof row] ?? row.withdrawnAt,
      search.sortDirection,
    ),
    search,
  );
}
export function accessData(search: MemberRecordSearch) {
  const rows = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().access.filter((row) =>
        matchesMemberRecordSearch({ ...row }, search),
      )
    : [];
  return page(
    sortMemberRecords(
      rows,
      (row) => row[search.sortType as keyof typeof row] ?? row.accessedAt,
      search.sortDirection,
    ),
    search,
  );
}
export function counselData(search: MemberRecordSearch) {
  const rows = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().counsel.filter((row) =>
        matchesMemberRecordSearch({ ...row }, search),
      )
    : [];
  return page(
    sortMemberRecords(
      rows,
      (row) => row[search.sortType as keyof typeof row] ?? row.receivedAt,
      search.sortDirection,
    ),
    search,
  );
}
export function appealData(search: MemberRecordSearch) {
  const rows = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().appeals.filter(
        ({ restrictions, ...row }) =>
          matchesMemberRecordSearch(row, search) &&
          (!search.restrictions?.length ||
            search.restrictions.some((value) => restrictions.includes(value))),
      )
    : [];
  return page(
    sortMemberRecords(
      rows,
      (row) => {
        const value = row[search.sortType as keyof typeof row] ?? row.appliedAt;
        return typeof value === "string" ? value : value.join(",");
      },
      search.sortDirection,
    ),
    search,
  );
}
