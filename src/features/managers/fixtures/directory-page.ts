/** 제품 화면의 검색·정렬을 재현하는 mock이다. 실제 서버 검색 의미의 근거로 사용하지 않는다. */
import { type ManagerListSearch } from "../model/manager-list-search";
import { managerFixtures, managerRowFixtures } from "./managers";
export function readManagerDirectoryPage(search: ManagerListSearch) {
  const rows = managerRowFixtures.filter((row, index) => {
    const record = managerFixtures[index]!;
    const instant =
      search.periodType === "lastAccessAt" ? row.lastAccessAt : row.createdAt;
    return (
      (!search.startDateTime || instant >= search.startDateTime) &&
      (!search.endDateTime || instant <= search.endDateTime) &&
      (!search.types?.length ||
        search.types.includes(record.detail.type?.id ?? "")) &&
      (!search.permission ||
        search.permission === String(record.detail.permission?.id)) &&
      (!search.statuses?.length ||
        (row.accountStatus !== undefined &&
          search.statuses.includes(row.accountStatus))) &&
      (!search.registrationRoutes?.length ||
        search.registrationRoutes.some(
          (value) => value === row.registrationRoute,
        )) &&
      (search.keywords ?? []).every(({ field, value }) =>
        row[field].toLowerCase().includes(value.toLowerCase()),
      )
    );
  });
  const field =
    search.sort === "joinedAt" || search.sort === undefined
      ? "createdAt"
      : search.sort;
  rows.sort(
    (a, b) =>
      String(a[field] ?? "").localeCompare(String(b[field] ?? "")) *
      (search.direction === "asc" ? 1 : -1),
  );
  const pageSize = search.pageSize ?? 100;
  return {
    rows: rows.slice(
      ((search.page ?? 1) - 1) * pageSize,
      (search.page ?? 1) * pageSize,
    ),
    total: rows.length,
  };
}
