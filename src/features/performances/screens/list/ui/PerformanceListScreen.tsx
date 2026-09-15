import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { useTranslation } from "react-i18next";
import {
  resolvePerformanceSearch,
  type PerformanceRouteSearch,
} from "../model/search-schema";
import { usePerformanceListData } from "../model/usePerformanceListData";
import { usePerformanceListFilter } from "../model/usePerformanceListFilter";
import { usePerformanceVenues } from "../../../api/usePerformanceVenues";
import { PerformanceListFilters } from "./PerformanceListFilters";
import { PerformanceListResult } from "./PerformanceListResult";
import { usePerformanceListResult } from "./usePerformanceListResult";

/**
 * 공연장 선택지는 목록 응답이 아니라 별도 조회에서 온다.
 * 아직 도착하지 않았거나 실패한 선택지를 "공연장 없음"으로 보이게 두지 않고, 그 조회 상태를 공연장 필드 안까지 전달한다.
 */
export function PerformanceListScreen({
  search,
  onSearchChange,
  onActivate,
}: {
  readonly search: PerformanceRouteSearch;
  readonly onSearchChange: (search: PerformanceRouteSearch) => void;
  readonly onActivate: (id: string) => void;
}) {
  const { t } = useTranslation("performances");
  const venueQuery = usePerformanceVenues();
  const resolved = resolvePerformanceSearch(search);
  const filter = usePerformanceListFilter(resolved, onSearchChange);
  const data = usePerformanceListData(resolved);
  const result = usePerformanceListResult(resolved, data, onSearchChange);

  return (
    <section>
      <PageHeader title={t("title")} />
      <PerformanceListFilters
        filter={filter}
        venues={venueQuery}
      />
      <PerformanceListResult
        data={data}
        result={result}
        onActivate={onActivate}
      />
    </section>
  );
}
