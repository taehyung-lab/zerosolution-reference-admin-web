/**
 * 기존 API 목록의 요약·보기 설정·테이블·페이지와 조회 상태를 표시하는 컴포넌트다.
 * 실제 API에서도 유지할 표시 책임이며 action 노드는 외부에서 받아 확인창 소유자의 수명을 보존한다.
 */
import { DataTable } from "@/shared/ui/patterns/DataTable";
import { ListResult } from "@/shared/ui/patterns/ListResult";
import { PageSizeControl } from "@/shared/ui/patterns/PageSizeControl";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { ResultToolbar } from "@/shared/ui/patterns/ResultToolbar";
import { ResultTotal } from "@/shared/ui/patterns/ResultTotal";
import { SortControl } from "@/shared/ui/patterns/SortControl";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerListData } from "../model/useManagerListData";
import type { useManagerListResult } from "./useManagerListResult";

/**
 * 건수·보기 설정·테이블·페이지와 조회 상태를 표시한다. API 연결 후에도 유지할 UI 책임이다.
 * 액션은 조립된 toolbarRight로 받아 표시하며, 요청 callback이나 액션 확인창은 이 결과 컴포넌트가 소유하지 않는다.
 */
export function ManagerListResult({
  result,
  data,
  toolbarRight,
}: {
  readonly result: ReturnType<typeof useManagerListResult>;
  readonly data: ManagerListData;
  readonly toolbarRight: ReactNode;
}) {
  const { t } = useTranslation("managers");
  const pagination = (
    <Pagination
      page={result.pagination.page}
      totalPages={result.pagination.totalPages}
      onPageChange={result.pagination.onPageChange}
      ariaLabel={t("result.paginationLabel")}
      previousLabel={t("result.previous")}
      nextLabel={t("result.next")}
    />
  );
  // Before the first search the design shows only the register action; summary and view
  // controls describe a result that does not exist yet (Figma 11.1 검색전).
  return (
    <section>
      <ResultTotal
        searched={data.searched && !data.isPending}
        total={data.total}
      />
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
        footer={pagination}
      >
        <DataTable
          rows={data.rows}
          columns={result.columns}
          getRowId={(row) => row.id}
        />
      </ListResult>
    </section>
  );
}
