import { managerOptionFixtures, managerPermissionFixtures, managerRowFixtures } from '../fixtures/managers';
import type { ManagerListSearch } from './manager-list-search';

// TRANSPLANT_PENDING_MANAGER_DIRECTORY_QUERY: replace development reads with the confirmed list and option queries.
export function useManagerDirectoryData(search: ManagerListSearch) {
  const pageSize = search.pageSize ?? 100;
  const total = managerRowFixtures.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(search.page ?? 1, totalPages);
  return {
    rows: search.periodType === undefined ? [] : managerRowFixtures.slice((page - 1) * pageSize, page * pageSize),
    total,
    totalPages,
    page,
    typeOptions: managerOptionFixtures('').type.items,
    permissionOptions: managerPermissionFixtures,
  };
}
