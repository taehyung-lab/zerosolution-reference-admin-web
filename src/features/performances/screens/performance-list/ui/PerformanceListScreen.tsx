import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import {
  performanceListSearch,
  type PerformanceListSearch,
  type PerformanceListView,
} from '../model/performance-list-search';
import { usePerformanceListData } from '../model/usePerformanceListData';
import { usePerformanceListFilter } from '../model/usePerformanceListFilter';
import { PerformanceListFilters } from './PerformanceListFilters';
import { PerformanceListResult } from './PerformanceListResult';
import { usePerformanceListResult } from './usePerformanceListResult';

/**
 * 5.2 공연 목록. 조립만 하고 상태는 각 소유자에 둔다.
 * route 는 검증한 sparse search 를 넘기고 화면이 한 번 해소한다. 모든 URL 전이는 `commit` 한 곳으로
 * 나가며 canonical 로 줄여 `onSearchChange` 에 넘긴다.
 */
export function PerformanceListScreen({
  search: sparse,
  onSearchChange,
  onActivate,
}: {
  readonly search: PerformanceListSearch;
  readonly onSearchChange: (next: PerformanceListSearch) => void;
  readonly onActivate: (performanceId: string) => void;
}) {
  const { t } = useTranslation('performances');
  const search = performanceListSearch.resolve(sparse);
  const commit = (next: PerformanceListView) => onSearchChange(performanceListSearch.canonical.parse(next));
  const filter = usePerformanceListFilter(search, commit);
  const { rows, total, totalPages, ...data } = usePerformanceListData(search);
  const result = usePerformanceListResult({ search, total, totalPages, commit });

  return (
    <section>
      <PageHeader title={t('title')} />
      <PerformanceListFilters filter={filter} />
      <PerformanceListResult data={{ rows, ...data }} total={total} result={result} onActivate={onActivate} />
    </section>
  );
}
