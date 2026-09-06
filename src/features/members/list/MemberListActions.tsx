import {
  BulkActionDialogs,
  SelectionAlert,
} from "@/shared/ui/patterns/BulkActionDialogs";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { Button } from "@/shared/ui/primitives/Button";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { Select } from "@/shared/ui/primitives/Select";
import { useTranslation } from "react-i18next";
import type { MemberListActionRequest } from "./member-row";
import { memberRestrictions } from "./search-schema";
import { useMemberListActions } from "./useMemberListActions";

/**
 * Owns the toolbar actions and the dialogs they open. The dialogs are mounted outside the
 * `searched` branch on purpose: `ListResult` renders children only when ready, so an owner
 * inside it unmounts on the loading transition that follows a confirmed change and the
 * dialog disappears mid-workflow. Gate the buttons, never the owner.
 */
export function MemberListActions({
  searched,
  selectedIds,
  onActionRequest,
  onRegister,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly onActionRequest: (request: MemberListActionRequest) => void;
  readonly onRegister: () => void;
}) {
  const { t } = useTranslation("members");
  const { t: sharedT } = useTranslation("shared");
  const actions = useMemberListActions({ selectedIds, onActionRequest });
  // A local binding so the cascade union narrows inside the branch below.
  const change = actions.change;
  // TRANSPLANT_PENDING_MEMBER_PERMISSION: replace the visible-action baseline when the
  // product permission identifiers are contracted.
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <div>
              <Select
                aria-label={t("bulk.field")}
                value={change?.accountStatus ?? null}
                placeholder={t("bulk.select")}
                options={[
                  { value: "general", label: t("accountStatus.general") },
                  { value: "flagged", label: t("accountStatus.flagged") },
                ]}
                onValueChange={(value) => {
                  if (value === "general")
                    actions.setChange({ accountStatus: "general" });
                  else if (value === "flagged")
                    actions.setChange({
                      accountStatus: "flagged",
                      restrictions: [],
                    });
                  else actions.setChange(null);
                }}
              />
              {change?.accountStatus === "flagged" ? (
                <FilterField label={t("filters.restrictions")}>
                  {({ labelId }) => (
                    <CheckboxTree
                      ariaLabelledby={labelId}
                      selectAllLabel={t("filters.all")}
                      nodes={memberRestrictions.map((value) => ({
                        value,
                        label: t(`restriction.${value}`),
                      }))}
                      values={change.restrictions}
                      onValueChange={(restrictions) =>
                        actions.setChange({
                          accountStatus: "flagged",
                          restrictions,
                        })
                      }
                    />
                  )}
                </FilterField>
              ) : null}
            </div>
            <Button onClick={actions.requestBulkChange}>
              {t("bulk.change")}
            </Button>
            <Button onClick={() => actions.requestMessage("sms")}>
              {t("actions.sms")}
            </Button>
            <Button onClick={() => actions.requestMessage("email")}>
              {t("actions.email")}
            </Button>
          </>
        ) : null}
        <Button onClick={onRegister}>{t("actions.register")}</Button>
      </div>
      <BulkActionDialogs
        controller={actions.bulk}
        confirmDescription={sharedT("bulkAction.confirm")}
      />
      <SelectionAlert controller={actions.selectionGate} />
    </>
  );
}
