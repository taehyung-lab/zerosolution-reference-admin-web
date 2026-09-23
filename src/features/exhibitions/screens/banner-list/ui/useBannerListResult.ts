import { useTranslation } from 'react-i18next';
import type { BannerRow } from '@/features/exhibitions/model/banner';
import { listViewControls } from '@/shared/lib/list-view';
import { usePageRowSelection } from '@/shared/hooks/use-page-row-selection';
import type { BannerListView } from '../model/banner-list-search';
import { bannerListColumns } from './banner-list-columns';

/**
 * 결과 영역이 그대로 렌더할 선택·보기 컨트롤·컬럼. 보기 전이 규칙은 공용 `list-view` 가 소유한다.
 * 선택은 확정된 한 화면(committed search)의 현재 페이지에 한정되고, 검색이 바뀌면 사라진다.
 */
export function useBannerListResult({
  search,
  rows,
  totalPages,
  commit,
}: {
  readonly search: BannerListView;
  readonly rows: readonly BannerRow[];
  readonly totalPages: number;
  readonly commit: (next: BannerListView) => void;
}) {
  const { t } = useTranslation('exhibitions');
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const view = listViewControls({ search, totalPages, commit });

  return {
    selection,
    view,
    columns: bannerListColumns({ t, search, selection, onHeaderSort: view.sort.onHeaderSort }),
  };
}
