import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { PagedListResult } from '@/shared/ui/list/PagedListResult';
import { standardPageSizeOptions } from '@/shared/lib/list-options';
import { bannerSortKeys } from '@/features/exhibitions/model/banner';
import {
  bannerListSearch,
  type BannerListSearch,
  type BannerListView,
} from '../model/banner-list-search';
import { useBannerListData } from '../model/useBannerListData';
import { useBannerListFilter } from '../model/useBannerListFilter';
import { BannerListActions } from './BannerListActions';
import { BannerListFilters } from './BannerListFilters';
import { useBannerListResult } from './useBannerListResult';

/**
 * 7.1 전시 > 배너 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 *
 * frame 의 제목 옆 ⓘ 는 `배너를 조회 및 관리할 수 있습니다.` tooltip 이다(2026-09-23 실측).
 */
export function BannerListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
  onCreate,
}: {
  readonly search: BannerListSearch;
  readonly onSearchChange: (next: BannerListSearch) => void;
  readonly onActivate: (bannerId: string) => void;
  readonly onCreate: () => void;
}) {
  const { t } = useTranslation('exhibitions');
  const search = bannerListSearch.resolve(sparse);
  const commit = (next: BannerListView) => onSearchChange(bannerListSearch.canonical.parse(next));
  const filter = useBannerListFilter(search, commit);
  const { rows, total, totalPages, ...data } = useBannerListData(search);
  const result = useBannerListResult({ search, rows, totalPages, commit });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t('banner.breadcrumb.exhibitions'), t('banner.breadcrumb.banners')]}
        title={t('banner.title')}
        tooltip={{ content: t('banner.tooltip'), label: t('banner.tooltipLabel') }}
      />
      <BannerListFilters filter={filter} />
      <PagedListResult
        data={{ rows, ...data }}
        total={total}
        view={result.view}
        columns={result.columns}
        getRowId={(row) => row.id}
        onRowActivate={(row) => onActivate(row.id)}
        actions={
          <BannerListActions
            selectedIds={result.selection.selectedIds}
            onChanged={result.selection.clear}
            onCreate={onCreate}
          />
        }
        copy={{ empty: t('banner.result.empty') }}
        pageSizeOptions={standardPageSizeOptions}
        sortOptions={bannerSortKeys.map((value) => ({ value, label: t(`banner.sort.${value}`) }))}
      />
    </section>
  );
}
