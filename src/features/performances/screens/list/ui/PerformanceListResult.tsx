import { DataTable } from "@/shared/ui/list/DataTable";
import { ListResult } from "@/shared/ui/list/ListResult";
import { PageSizeControl } from "@/shared/ui/list/PageSizeControl";
import { Pagination } from "@/shared/ui/list/Pagination";
import { ResultToolbar } from "@/shared/ui/list/ResultToolbar";
import { ResultTotal } from "@/shared/ui/list/ResultTotal";
import { SortControl } from "@/shared/ui/list/SortControl";
import { useTranslation } from "react-i18next";
import type { usePerformanceListData } from "../model/usePerformanceListData";
import type { usePerformanceListResult } from "./usePerformanceListResult";

export function PerformanceListResult({
  data,
  result,
  onActivate,
}: {
  readonly data: ReturnType<typeof usePerformanceListData>;
  readonly result: ReturnType<typeof usePerformanceListResult>;
  readonly onActivate: (id: string) => void;
}) {
  const { t } = useTranslation("performances");
  return (
    <>
      <ResultToolbar
        left={
          <>
            <PageSizeControl
              label={t("result.pageSize")}
              value={result.pageSize.value}
              options={result.pageSize.options}
              onValueChange={result.pageSize.onValueChange}
            />
            <SortControl
              label={t("result.sort")}
              value={result.sort.value}
              options={result.sort.options}
              onValueChange={result.sort.onValueChange}
            />
          </>
        }
      />
      <ResultTotal searched={data.searched} total={data.total} />
      <ListResult
        data={data}
        copy={{
          notSearched: t("result.notSearched"),
          empty: t("result.empty"),
        }}
        footer={
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={result.pagination.onPageChange}
            ariaLabel={t("result.pagination")}
            previousLabel={t("result.previous")}
            nextLabel={t("result.next")}
          />
        }
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => onActivate(row.id)}
        />
      </ListResult>
    </>
  );
}
