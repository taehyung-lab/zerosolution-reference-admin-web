import { useTranslation } from "react-i18next";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { MemberRecordFilterFields } from "../records/MemberRecordFilterFields";
import { useMemberRecordFilter } from "../records/useMemberRecordFilter";
import type { MemberRecordSearch } from "../records/member-record-search";

export function MemberAppealListFilters({
  search,
  onSearchChange,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (next: MemberRecordSearch) => void;
}) {
  const { t } = useTranslation("members");
  const filter = useMemberRecordFilter(search, onSearchChange, "appliedAt");
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
          { value: "appliedAt", label: t("secondary.fields.appliedAt") },
          { value: "flaggedAt", label: t("secondary.fields.flaggedAt") },
        ]}
        keywordOptions={[
          { value: "email", label: t("columns.email") },
          { value: "name", label: t("columns.name") },
          { value: "phone", label: t("columns.phone") },
        ]}
      />
      <FilterField label={t("filters.restrictions")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={["specialContent", "inquiry"].map((value) => ({
              value,
              label: t(`restriction.${value}`),
            }))}
            values={filter.draft.restrictions ?? []}
            emptyMeansAll
            onValueChange={(restrictions) =>
              filter.patchDraft({
                restrictions:
                  restrictions as MemberRecordSearch["restrictions"],
              })
            }
          />
        )}
      </FilterField>
      <FilterField label={t("secondary.fields.status")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={["waiting", "reviewing", "held", "completed"].map(
              (value) => ({ value, label: t(`secondary.states.${value}`) }),
            )}
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
      <FilterField label={t("secondary.fields.result")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={["waiting", "completed", "rejected"].map((value) => ({
              value,
              label: t(`secondary.states.${value}`),
            }))}
            values={filter.draft.results ?? []}
            emptyMeansAll
            onValueChange={(results) =>
              filter.patchDraft({
                results: results as MemberRecordSearch["results"],
              })
            }
          />
        )}
      </FilterField>
    </FilterPanel>
  );
}
