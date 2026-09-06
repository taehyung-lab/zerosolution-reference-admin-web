import { useTranslation } from "react-i18next";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { MemberRecordFilterFields } from "../records/MemberRecordFilterFields";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import type { MemberRecordSearch } from "../records/member-record-search";
import { memberSignupMethods } from "../model/account";
import { Select } from "@/shared/ui/primitives/Select";

export function MemberCounselListFilters({
  search,
  onSearchChange,
  inquiryOptions,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
  readonly inquiryOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(search, onSearchChange, "receivedAt");
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
      <FilterField label={t("filters.signupMethod")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={memberSignupMethods.map((value) => ({
              value,
              label: t(`signup.${value}`),
            }))}
            values={filter.draft.signupMethods ?? []}
            emptyMeansAll
            onValueChange={(signupMethods) =>
              filter.patchDraft({
                signupMethods:
                  signupMethods as MemberRecordSearch["signupMethods"],
              })
            }
          />
        )}
      </FilterField>
      <FilterField label={t("filters.accountStatus")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={["general", "flagged"].map((value) => ({
              value,
              label: t(`accountStatus.${value}`),
            }))}
            values={filter.draft.accountStatuses ?? []}
            emptyMeansAll
            onValueChange={(accountStatuses) =>
              filter.patchDraft({
                accountStatuses:
                  accountStatuses as MemberRecordSearch["accountStatuses"],
              })
            }
          />
        )}
      </FilterField>
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
