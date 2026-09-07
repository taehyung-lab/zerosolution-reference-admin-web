/**
 * 접속 목록에서 허용하는 기간·검색 필드와 개별 필터를 공용 입력 컴포넌트에 연결한다.
 * 실제 API에서도 입력 UI는 필요하며 행 필터링이나 서버 조회는 수행하지 않는다.
 */
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { useTranslation } from "react-i18next";
import type { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import {
  MemberAccountStatusFilter,
  MemberRecordFilterFields,
} from "../../../mechanics/record-list/ui/MemberRecordFilterFields";
import type { MemberRecordSearch } from "../../../model/member-record-search";

export function MemberAccessListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useMemberRecordFilter>;
}) {
  const { t } = useTranslation("members");
  return (
    <FilterPanel
      title={t("search")}
      collapseLabel={t("filters.collapse")}
      expandLabel={t("filters.expand")}
      submitLabel={t("search")}
      resetLabel={t("reset")}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <MemberRecordFilterFields
        filter={filter}
        periodOptions={[
          { value: "accessedAt", label: t("secondary.fields.accessedAt") },
        ]}
        keywordOptions={[
          { value: "email", label: t("columns.email") },
          { value: "name", label: t("columns.name") },
          { value: "phone", label: t("columns.phone") },
        ]}
      />
      <MemberAccountStatusFilter
        values={filter.draft.accountStatuses}
        onChange={(accountStatuses) => filter.patchDraft({ accountStatuses })}
      />
      <FilterField label={t("secondary.fields.accessPath")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={[{ value: "app", label: t("secondary.fields.app") }]}
            values={filter.draft.accessPaths ?? []}
            emptyMeansAll
            onValueChange={(accessPaths) =>
              filter.patchDraft({
                accessPaths: accessPaths as MemberRecordSearch["accessPaths"],
              })
            }
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
