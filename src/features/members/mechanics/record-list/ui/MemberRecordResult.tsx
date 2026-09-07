import { ResultTotal } from "@/shared/ui/patterns/ResultTotal";
import type { MemberRecordListData } from "../model/member-record-data";
/** 회원 기록 목록의 결과 조립이다. 조회 상태는 데이터 훅이 소유하며 이 컴포넌트는 그대로 표시한다. */
import { DataTable, type DataTableProps } from "@/shared/ui/patterns/DataTable";
import { ListResult } from "@/shared/ui/patterns/ListResult";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { ResultToolbar } from "@/shared/ui/patterns/ResultToolbar";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { MemberRecordViewControls } from "./MemberRecordViewControls";

export function MemberRecordResult<TRow extends { readonly id: string }>({
  data,
  columns,
  search,
  onSearchChange,
  sortOptions,
  toolbarRight,
  beforeResult,
  onActivate,
}: {
  readonly data: MemberRecordListData<TRow>;
  readonly columns: DataTableProps<TRow>["columns"];
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly sortOptions: readonly { value: string; label: string }[];
  readonly toolbarRight: ReactNode;
  readonly beforeResult?: ReactNode;
  readonly onActivate?: (id: string) => void;
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <ResultToolbar
        left={
          data.searched ? (
            <MemberRecordViewControls
              search={search}
              onChange={onSearchChange}
              sortOptions={sortOptions}
            />
          ) : null
        }
        right={toolbarRight}
      />
      {beforeResult}
      <ResultTotal searched={data.searched} total={data.total} />
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
          onRowActivate={
            onActivate === undefined ? undefined : (row) => onActivate(row.id)
          }
        />
      </ListResult>
    </>
  );
}
