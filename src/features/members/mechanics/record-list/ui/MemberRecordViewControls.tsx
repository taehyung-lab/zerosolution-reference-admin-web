import type { ResolvedMemberRecordSearch } from "../model/member-record-search";
/**
 * 페이지 크기와 정렬 항목을 선택해 확정 검색 조건을 바꾸는 UI다.
 * 실제 API에서도 유지한다. 데이터를 직접 자르거나 정렬하지 않고 변경된 조건의 재조회는 데이터 흐름에 맡긴다.
 */
import { standardPageSizeOptions } from "@/shared/model/list-options";
import { PageSizeControl } from "@/shared/ui/patterns/PageSizeControl";
import { SortControl } from "@/shared/ui/patterns/SortControl";
import { useTranslation } from "react-i18next";
import type { MemberRecordSearch } from "../../../model/member-record-search";

export function MemberRecordViewControls({
  search,
  onChange,
  sortOptions,
}: {
  readonly search: ResolvedMemberRecordSearch;
  readonly onChange: (search: MemberRecordSearch) => void;
  readonly sortOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <PageSizeControl
        label={t("result.pageSize")}
        value={search.pageSize}
        options={standardPageSizeOptions}
        onValueChange={(pageSize) =>
          onChange({
            ...search,
            pageSize: pageSize as MemberRecordSearch["pageSize"],
            page: undefined,
          })
        }
      />
      <SortControl
        label={t("result.sort")}
        value={search.sortType}
        options={sortOptions}
        onValueChange={(sortType) =>
          onChange({ ...search, sortType, page: undefined })
        }
      />
    </>
  );
}
