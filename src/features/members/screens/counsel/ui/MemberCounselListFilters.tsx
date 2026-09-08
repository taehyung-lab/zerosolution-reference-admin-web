import type { ResolvedMemberRecordSearch } from "../../../mechanics/record-list/model/member-record-search";
import { counselSearchContract } from "../../../mechanics/record-list/model/member-record-search";
/**
 * 상담 목록에서 허용하는 기간·검색 필드와 개별 필터를 공용 입력 컴포넌트에 연결한다.
 * 실제 API에서도 입력 UI는 필요하며 행 필터링이나 서버 조회는 수행하지 않는다.
 */
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { Select } from "@/shared/ui/primitives/Select";
import { useTranslation } from "react-i18next";
import { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import {
  MemberAccountStatusFilter,
  MemberRecordFilterFields,
  MemberSignupMethodFilter,
} from "../../../mechanics/record-list/ui/MemberRecordFilterFields";
import type { MemberRecordSearch } from "../../../model/member-record-search";

export function MemberCounselListFilters({
  search,
  onSearchChange,
  inquiryOptions,
}: {
  readonly search: ResolvedMemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly inquiryOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(
    search,
    onSearchChange,
    counselSearchContract,
    true,
  );
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
          { value: "receivedAt", label: t("secondary.fields.receivedAt") },
          { value: "answeredAt", label: t("secondary.fields.answeredAt") },
        ]}
        keywordOptions={[
          { value: "email", label: t("columns.email") },
          { value: "name", label: t("columns.name") },
          { value: "phone", label: t("columns.phone") },
          { value: "content", label: t("secondary.fields.content") },
        ]}
      />
      <MemberSignupMethodFilter
        values={filter.draft.signupMethods}
        onChange={(signupMethods) => filter.patchDraft({ signupMethods })}
      />
      <MemberAccountStatusFilter
        values={filter.draft.accountStatuses}
        onChange={(accountStatuses) => filter.patchDraft({ accountStatuses })}
      />
      <FilterField label={t("secondary.fields.inquiryType")}>
        {({ labelId }) => (
          <Select
            aria-labelledby={labelId}
            value={filter.draft.inquiryType ?? "all"}
            options={[
              { value: "all", label: t("filters.all") },
              ...inquiryOptions,
            ]}
            onValueChange={(inquiryType) =>
              filter.patchDraft({
                inquiryType:
                  inquiryType === "all"
                    ? undefined
                    : (inquiryType ?? undefined),
              })
            }
          />
        )}
      </FilterField>
      <FilterField label={t("secondary.fields.progress")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={["waiting", "reviewing", "completed"].map((value) => ({
              value,
              label: t(`secondary.states.${value}`),
            }))}
            values={filter.draft.statuses ?? []}
            emptyMeansAll
            onValueChange={(statuses) =>
              filter.patchDraft({
                statuses: statuses as MemberRecordSearch["statuses"],
              })
            }
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
