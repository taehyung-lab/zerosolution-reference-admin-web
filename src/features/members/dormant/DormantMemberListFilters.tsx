import { useTranslation } from "react-i18next";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { memberSignupMethods } from "../model/account";
import { MemberRecordFilterFields } from "../records/MemberRecordFilterFields";
import type { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import type { MemberRecordSearch } from "../records/member-record-search";
export function DormantMemberListFilters({
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
          { value: "joinedAt", label: t("columns.joinedAt") },
          { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
          { value: "dormantAt", label: t("secondary.fields.dormantAt") },
        ]}
        keywordOptions={[
          { value: "email", label: t("columns.email") },
          { value: "name", label: t("columns.name") },
          { value: "phone", label: t("columns.phone") },
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
    </FilterPanel>
  );
}
