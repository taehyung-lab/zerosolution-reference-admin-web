import {
  useBulkActionDialogs,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MemberListActionRequest } from "./member-row";

/**
 * The bulk cascade as one value. `일반회원` carries no restrictions, so the union makes
 * "general with restrictions" unrepresentable and switching the target drops the second
 * level structurally instead of a guard rebuilding the payload on every submit.
 */
export type MemberBulkChange =
  | null
  | { readonly accountStatus: "general" }
  | {
      readonly accountStatus: "flagged";
      readonly restrictions: readonly string[];
    };

/** Returns the value only when the cascade is finished, so the caller narrows by using it. */
function completed(
  change: MemberBulkChange,
): Exclude<MemberBulkChange, null> | null {
  if (change === null) return null;
  if (change.accountStatus === "flagged" && change.restrictions.length === 0)
    return null;
  return change;
}

/**
 * Owns the toolbar workflow up to the request boundary: the cascade value, the prechecks
 * every action button shares, and which popup is open. Every precheck rejects into the one
 * selection alert, so no rule keeps its own error state that a corrected value fails to clear.
 */
export function useMemberListActions({
  selectedIds,
  onActionRequest,
}: {
  readonly selectedIds: readonly string[];
  readonly onActionRequest: (request: MemberListActionRequest) => void;
}) {
  const { t } = useTranslation("members");
  const { t: sharedT } = useTranslation("shared");
  const [change, setChange] = useState<MemberBulkChange>(null);

  const selectionGate = useSelectionGate(selectedIds.length);
  const bulk = useBulkActionDialogs({
    run: (request: MemberListActionRequest) => onActionRequest(request),
  });

  const requestBulkChange = () => {
    if (!selectionGate.requireSelection(sharedT("bulkAction.missingSelection")))
      return;
    // TRANSPLANT_PENDING_MEMBER_BULK_INCOMPLETE: the ledger states row-level missing selection
    // but never this cascade's unfinished value, so the wording is ours until it is contracted.
    const ready = completed(change);
    if (ready === null) return selectionGate.reject(t("bulk.incomplete"));
    bulk.requestConfirmation({
      type: "bulkChange",
      targetIds: [...selectedIds],
      values: {
        accountStatus: ready.accountStatus,
        restrictions:
          ready.accountStatus === "flagged" ? [...ready.restrictions] : [],
      },
    });
  };

  const requestMessage = (type: "sms" | "email") => {
    if (!selectionGate.requireSelection(t(`actions.${type}Missing`))) return;
    onActionRequest({ type, targetIds: [...selectedIds] });
  };

  return {
    bulk,
    selectionGate,
    change,
    setChange,
    requestBulkChange,
    requestMessage,
  };
}
