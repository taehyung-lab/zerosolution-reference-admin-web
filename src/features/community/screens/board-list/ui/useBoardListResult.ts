import { useTranslation } from 'react-i18next';
import { boardSortKeys } from '@/features/community/model/board';
import type { BoardSortKey } from '@/features/community/model/board';
import {
  toHeaderSortSearch,
  toPageSearch,
  toPageSizeSearch,
  toSortSearch,
} from '../model/board-list-policy';
import { boardPageSizes } from '../model/board-list-search';
import type { BoardListSearch, ResolvedBoardListSearch } from '../model/board-list-search';
import { boardListColumns } from './board-list-columns';

/** 결과 영역이 그대로 렌더할 컬럼과 controls. 전이 규칙은 board-list-policy 가 소유한다. */
export function useBoardListResult(
  search: ResolvedBoardListSearch,
  totalPages: number,
  onSearchChange: (next: BoardListSearch) => void,
) {
  const { t } = useTranslation('community');

  return {
    columns: boardListColumns({
      t,
      search,
      offset: (search.page - 1) * search.pageSize,
      onHeaderSort: (sortType: BoardSortKey) =>
        onSearchChange(toHeaderSortSearch(search, sortType)),
    }),
    pageSize: {
      value: search.pageSize,
      options: boardPageSizes,
      onValueChange: (pageSize: number) => onSearchChange(toPageSizeSearch(search, pageSize)),
    },
    sort: {
      value: search.sortType,
      options: boardSortKeys.map((value) => ({ value, label: t(`board.sort.${value}`) })),
      onValueChange: (sortType: BoardSortKey) => onSearchChange(toSortSearch(search, sortType)),
    },
    pagination: {
      page: search.page,
      totalPages,
      onPageChange: (page: number) => onSearchChange(toPageSearch(search, page)),
    },
  };
}
