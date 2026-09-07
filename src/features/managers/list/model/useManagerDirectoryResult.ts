import type { useManagerDirectoryData } from './useManagerDirectoryData';
/**
 * 제품 운영자 목록의 선택 수명·컬럼·보기 설정과 정렬·페이지의 URL 확정을 소유한다.
 * 조회 실행과 서버 행 정렬은 하지 않는다. 헤더 정렬은 같은 컬럼을 다시 누를 때만 방향을 뒤집고,
 * 보기 정렬 선택은 방향을 유지한다(Figma에 방향 컨트롤이 없다).
 */
import { useTranslation } from 'react-i18next';
import { usePageRowSelection } from '@/shared/lib/use-page-row-selection';
import { standardPageSizeOptions } from '@/shared/config/list';
import type { DataTableProps } from '@/shared/ui/patterns/DataTable';
import { buildManagerDirectoryColumns } from '../ui/manager-directory-columns';
import {
  managerListPageSize,
  managerListSearchSchema,
  managerListSorts,
  type ManagerListSearch,
  type ManagerListSort,
} from './manager-list-search';

export function useManagerDirectoryResult({
  search,
  data,
  onSearchChange,
}: {
  readonly search: ManagerListSearch;
  readonly data: ReturnType<typeof useManagerDirectoryData>;
  readonly onSearchChange: (next: ManagerListSearch) => void;
}) {
  const { t } = useTranslation('managers');
  const commit = (next: ManagerListSearch) => onSearchChange(managerListSearchSchema.parse(next));
  const sort = search.sort ?? 'joinedAt';
  const direction = search.direction ?? 'desc';
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const columns: DataTableProps<(typeof data.rows)[number]>['columns'] = buildManagerDirectoryColumns({
    t,
    sort,
    direction,
    selection,
    onSortChange: (field) =>
      commit({
        ...search,
        sort: field,
        direction: sort === field && direction === 'desc' ? 'asc' : 'desc',
        page: undefined,
      }),
  });

  return {
    columns,
    selectedIds: selection.selectedIds,
    pageSize: {
      value: managerListPageSize(search),
      options: standardPageSizeOptions,
      onValueChange: (pageSize: number) => commit({ ...search, pageSize, page: undefined }),
    },
    sort: {
      value: sort,
      options: managerListSorts.map((value) => ({ value, label: t(`scenarioSort.${value}`) })),
      onValueChange: (value: ManagerListSort) => commit({ ...search, sort: value, page: undefined }),
    },
    pagination: {
      page: data.page,
      totalPages: data.totalPages,
      onPageChange: (page: number) => commit({ ...search, page }),
    },
  };
}
