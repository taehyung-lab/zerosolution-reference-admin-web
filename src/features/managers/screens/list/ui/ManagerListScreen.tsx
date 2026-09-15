/**
 * 제품 운영자 목록의 검색·표·선택·일괄변경 소유자를 연결하는 조립 화면이다.
 * 필터 초안과 확정은 useManagerDirectoryFilter, 목록 조회는 useManagerDirectoryData,
 * 선택·컬럼·보기 설정은 useManagerDirectoryResult가 소유한다. 실제 API에서는 응답 공급과 매핑을 교체한다.
 */
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { useTranslation } from "react-i18next";
import { managerListSearchSchema, resolveManagerListSearch, type ManagerListRouteSearch } from "../model/manager-list-search";
import { useManagerDirectoryData } from "../model/useManagerDirectoryData";
import { useManagerDirectoryFilter } from "../model/useManagerDirectoryFilter";
import type { ManagerListActionRequest } from "../model/useManagerListActions";
import { ManagerDirectoryFilters } from "./ManagerDirectoryFilters";
import { ManagerDirectoryResult } from "./ManagerDirectoryResult";
import { ManagerListActions } from "./ManagerListActions";
import { useManagerDirectoryResult } from "./useManagerDirectoryResult";

export function ManagerListScreen({
  search,
  onSearchChange,
  onActionRequest,
}: {
  readonly search: ManagerListRouteSearch;
  readonly onSearchChange: (search: ManagerListRouteSearch) => void;
  readonly onActionRequest: (request: ManagerListActionRequest) => void;
}) {
  const { t } = useTranslation("managers");
  const canonical = managerListSearchSchema.parse(search);
  const resolved = resolveManagerListSearch(canonical);
  const filter = useManagerDirectoryFilter({ search: resolved, searched: canonical.searched === true, onSearchChange });
  const data = useManagerDirectoryData(resolved, canonical.searched === true);
  const result = useManagerDirectoryResult({ search: resolved, data, onSearchChange });

  return (
    <section>
      <PageHeader
        title={t("title")}
        breadcrumbs={[t("path.settings"), t("path.managers")]}
      />
      <ManagerDirectoryFilters filter={filter} />
      <ManagerDirectoryResult
        data={data}
        result={result}
        toolbarRight={
          <ManagerListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            rows={data.rows}
            onActionRequest={onActionRequest}
          />
        }
      />
    </section>
  );
}
