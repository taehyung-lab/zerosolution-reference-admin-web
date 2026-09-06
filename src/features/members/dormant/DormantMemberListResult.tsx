import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/shared/ui/patterns/DataTable";
import { ListResult } from "@/shared/ui/patterns/ListResult";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { ResultToolbar } from "@/shared/ui/patterns/ResultToolbar";
import { MemberRecordViewControls } from "../records/MemberRecordViewControls";
import type { MemberRecordSearch } from "../records/member-record-search";
import type { useDormantMemberListData } from "./useDormantMemberListData";
import type { useDormantMemberListResult } from "./useDormantMemberListResult";
export function DormantMemberListResult({
  search,
  data,
  result,
  onSearchChange,
  onActivate,
  actions,
}: {
  search: MemberRecordSearch;
  data: ReturnType<typeof useDormantMemberListData>;
  result: ReturnType<typeof useDormantMemberListResult>;
  onSearchChange: (next: MemberRecordSearch) => void;
  onActivate: (id: string) => void;
  actions: ReactNode;
}) {
  const { t } = useTranslation("members");
  const { searched } = data;
  const { columns } = result;
  const sorts = [
    { value: "joinedAt", label: t("columns.joinedAt") },
    { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
    { value: "dormantAt", label: t("secondary.fields.dormantAt") },
    { value: "signupMethod", label: t("columns.signupMethod") },
    { value: "email", label: t("columns.email") },
    { value: "name", label: t("columns.name") },
    { value: "phone", label: t("columns.phone") },
  ];

  return (
    <>
      <ResultToolbar
        left={
          searched ? (
            <MemberRecordViewControls
              search={search}
              onChange={onSearchChange}
              sortOptions={sorts}
            />
          ) : null
        }
        right={actions}
      />

      {searched ? <p>{t("result.total", { count: data.total })}</p> : null}
      <ListResult
        data={data}
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
          columns={columns}
          getRowId={(row) => row.id}
          onRowActivate={(row) => onActivate(row.id)}
        />
      </ListResult>
    </>
  );
}
