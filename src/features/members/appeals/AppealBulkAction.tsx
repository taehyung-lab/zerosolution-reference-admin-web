import { useTranslation } from "react-i18next";
import { Select } from "@/shared/ui/primitives/Select";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { Button } from "@/shared/ui/primitives/Button";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import {
  BulkActionDialogs,
  SelectionAlert,
} from "@/shared/ui/patterns/BulkActionDialogs";
import { useMemberListActions } from "../list/useMemberListActions";

export interface AppealBulkChange {
  readonly ids: readonly string[];
  readonly accountStatus: "general" | "flagged";
  readonly restrictions: readonly string[];
}
export function AppealBulkAction({
  ids,
  onChange,
}: {
  readonly ids: readonly string[];
  readonly onChange: (input: AppealBulkChange) => void;
}) {
  const { t } = useTranslation("members");
  const actions = useMemberListActions({
    selectedIds: ids,
    onActionRequest: (request) => {
      if (request.type === "bulkChange")
        onChange({ ids: request.targetIds, ...request.values });
    },
  });
  const status = actions.change?.accountStatus ?? null;
  return (
    <>
      <SelectionAlert controller={actions.selectionGate} />
      <BulkActionDialogs
        controller={actions.bulk}
        confirmDescription={t("shared:bulkAction.confirm")}
      />
      <Select
        aria-label={t("filters.accountStatus")}
        value={status}
        onValueChange={(value) =>
          actions.setChange(
            value === "general"
              ? { accountStatus: "general" }
              : value === "flagged"
                ? { accountStatus: "flagged", restrictions: [] }
                : null,
          )
        }
        placeholder={t("secondary.choose")}
        options={[
          { value: "general", label: t("accountStatus.general") },
          { value: "flagged", label: t("accountStatus.flagged") },
        ]}
      />
      {status === "flagged" ? (
        <FilterField label={t("filters.restrictions")}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t("filters.all")}
              nodes={["specialContent", "inquiry"].map((value) => ({
                value,
                label: t(`restriction.${value}`),
              }))}
              values={
                actions.change?.accountStatus === "flagged"
                  ? actions.change.restrictions
                  : []
              }
              onValueChange={(restrictions) =>
                actions.setChange({ accountStatus: "flagged", restrictions })
              }
            />
          )}
        </FilterField>
      ) : null}
      <Button type="button" onClick={actions.requestBulkChange}>
        {t("bulk.change")}
      </Button>
    </>
  );
}
