import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/shared/ui/patterns/DataTable";
import { ListResult } from "@/shared/ui/patterns/ListResult";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { ResultToolbar } from "@/shared/ui/patterns/ResultToolbar";
import { MemberRecordViewControls } from "../records/MemberRecordViewControls";
import type { appealData } from "../records/member-record-data";
import type { useMemberAppealListResult } from "./useMemberAppealListResult";
import type { MemberRecordSearch } from "../records/member-record-search";

export function MemberAppealListResult({
  data,
  result,
  search,
  onSearchChange,
  onActivate,
  toolbarRight,
  bulkAction,
}: {
  readonly data: ReturnType<typeof appealData>;
  readonly result: ReturnType<typeof useMemberAppealListResult>;
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly onActivate: (id: string) => void;
  readonly toolbarRight: ReactNode;
  readonly bulkAction: ReactNode;
}) {
  const { t } = useTranslation("members");
  const searched = true;
  return (
    <>
      <ResultToolbar
        left={
          searched ? (
            <MemberRecordViewControls
              search={search}
              onChange={onSearchChange}
              sortOptions={result.sorts}
            />
          ) : null
        }
        right={toolbarRight}
      />
      {bulkAction}
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
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(page) => onSearchChange({ ...search, page })}
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
