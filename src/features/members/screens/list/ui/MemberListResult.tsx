import { DataTable } from "@/shared/ui/list/DataTable";
import { ListResult } from "@/shared/ui/list/ListResult";
import { PageSizeControl } from "@/shared/ui/list/PageSizeControl";
import { Pagination } from "@/shared/ui/list/Pagination";
import { ResultToolbar } from "@/shared/ui/list/ResultToolbar";
import { ResultTotal } from "@/shared/ui/list/ResultTotal";
import { SortControl } from "@/shared/ui/list/SortControl";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MemberListData } from "../model/useMemberListData";
import type { useMemberListResult } from "./useMemberListResult";

/**
 * 건수·보기 설정·테이블·페이지와 조회 상태를 표시한다. API 연결 후에도 유지할 UI 책임이다.
 * 액션은 조립된 toolbarRight로 받아 표시하며, 요청 callback이나 액션 확인창은 이 결과 컴포넌트가 소유하지 않는다.
 */
export function MemberListResult({
  data,
  result,
  toolbarRight,
  onMemberActivate,
}: {
  readonly data: MemberListData;
  readonly result: ReturnType<typeof useMemberListResult>;
  readonly toolbarRight: ReactNode;
  readonly onMemberActivate: (memberId: string) => void;
}) {
  const { t } = useTranslation("members");

  return (
    <section>
      <ResultTotal searched={data.searched} total={data.total} />
      <ResultToolbar
        left={
          data.searched ? (
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
          ) : null
        }
        right={toolbarRight}
      />
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
            ariaLabel={t("result.paginationLabel")}
            previousLabel={t("result.previous")}
            nextLabel={t("result.next")}
          />
        }
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.key}
          onRowActivate={(row) => onMemberActivate(row.key)}
        />
      </ListResult>
    </section>
  );
}
