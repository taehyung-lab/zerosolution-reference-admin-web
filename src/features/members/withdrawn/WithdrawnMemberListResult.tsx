import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/shared/ui/patterns/DataTable";
import { ListResult } from "@/shared/ui/patterns/ListResult";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { ResultToolbar } from "@/shared/ui/patterns/ResultToolbar";
import { MemberRecordViewControls } from "../records/MemberRecordViewControls";
import type { withdrawnData } from "../records/member-record-data";
import type { useWithdrawnMemberListResult } from "./useWithdrawnMemberListResult";
export function WithdrawnMemberListResult({
  data,
  searched,
  result,
  toolbarRight,
  onActivate,
}: {
  readonly data: ReturnType<typeof withdrawnData>;
  readonly searched: boolean;
  readonly result: ReturnType<typeof useWithdrawnMemberListResult>;
  readonly toolbarRight: ReactNode;
  readonly onActivate: (id: string) => void;
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <ResultToolbar
        left={
          searched ? (
            <MemberRecordViewControls {...result.viewControls} />
          ) : null
        }
        right={toolbarRight}
      />
      {searched ? <p>{t("result.total", { count: data.total })}</p> : null}
      <ListResult
        data={{
          rows: data.rows,
          searched,
          isPending: false,
          isFetching: false,
          isError: false,
          retry: () => Promise.resolve(),
        }}
        copy={{
          notSearched: t("result.notSearched"),
          empty: t("result.empty"),
        }}
        footer={
          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onPageChange={result.pagination.onPageChange}
            ariaLabel={t("result.paginationLabel")}
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
