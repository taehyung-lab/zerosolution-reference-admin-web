/**
 * 기존 OpenAPI 계약으로 동작하는 운영자 목록의 필터·조회·결과·액션을 조립한다.
 * 제품용 ManagerListScreen과 검색/행 모델이 다르며 리허설 API 회귀 테스트의 소비자로 유지한다. 제품 route는 ManagerListScreen 한 경로를 사용한다.
 */
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useTranslation } from "react-i18next";
import { requestManagerBulkChange } from "../model/manager-list-requests";
import {
  resolveManagerSearch,
  type ManagerRouteSearch,
} from "../model/search-schema";
import { useManagerListData } from "../model/useManagerListData";
import { useManagerListFilter } from "../model/useManagerListFilter";
import { ManagerListActions } from "./ManagerListActions";
import { ManagerListFilters } from "./ManagerListFilters";
import { ManagerListResult } from "./ManagerListResult";
import { useManagerListResult } from "./useManagerListResult";

export function ManagerApiListScreen({
  search,
  onSearchChange,
}: {
  readonly search: ManagerRouteSearch;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const { t } = useTranslation("managers");
  const filter = useManagerListFilter({ search, onSearchChange });
  const data = useManagerListData(search);
  const resolvedSearch = resolveManagerSearch(search);
  const result = useManagerListResult({
    search: resolvedSearch,
    data,
    onSearchChange,
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t("path.settings"), t("path.managers")]}
        title={t("title")}
      />
      <ManagerListFilters filter={filter} />
      <ManagerListResult
        data={data}
        result={result}
        toolbarRight={
          <ManagerListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            rows={data.rows}
            onActionRequest={requestManagerBulkChange}
          />
        }
      />
    </section>
  );
}
