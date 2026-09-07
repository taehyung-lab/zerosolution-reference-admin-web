/**
 * 운영자 일괄변경의 선택·변경값·금지 상태 확인과 최종 확인 입력을 관리한다.
 * 실제 API에서도 입력 검증은 필요하지만 서버 처리 결과나 부분 성공을 자체적으로 만들지 않는다.
 */
import { useConfirmation } from "@/shared/lib/use-confirmation";
import { useSelectionGate } from "@/shared/ui/patterns/BulkActionDialogs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerListItem } from "../../../model/manager";

export interface ManagerListActionRequest {
  readonly type: "bulkChange";
  readonly targetIds: readonly string[];
  readonly values: { readonly accountStatus: "active" | "inactive" };
}

/**
 * Notion excludes 대기·거절·잠금 rows from changes, not from selection.
 * Mixed selections retain the exclusion confirmation; entirely blocked selections only alert.
 */
export function useManagerListActions({
  selectedIds,
  rows,
  onActionRequest,
}: {
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerListItem[];
  readonly onActionRequest: (intent: ManagerListActionRequest) => void;
}) {
  const { t } = useTranslation("shared");
  const { t: managerT } = useTranslation("managers");
  const [target, setTarget] = useState<
    null | ManagerListActionRequest["values"]["accountStatus"]
  >(null);
  const selectionGate = useSelectionGate(selectedIds.length);
  // TRANSPLANT_PENDING_MANAGER_BULK_REJECTED_STATUS: 확인 문구의 대기·거절·잠금 중
  // 기존 API 대응은 AWAITING/LOCKED만 확인됐다. INACTIVE를 거절로 추측하지 말고 거절 코드를 확인해야 한다.
  const eligibleIds = new Set(
    rows
      .filter((row) =>
        row.accountStatus
          ? row.accountStatus === "active" || row.accountStatus === "inactive"
          : row.status !== "AWAITING" && row.status !== "LOCKED",
      )
      .map((row) => row.id),
  );
  const bulk = useConfirmation({
    run: (intent: ManagerListActionRequest) => {
      const targetIds = intent.targetIds.filter((id) => eligibleIds.has(id));
      if (targetIds.length > 0) onActionRequest({ ...intent, targetIds });
    },
  });

  return {
    selectionGate,
    bulk,
    target,
    setTarget,
    requestBulkChange: () => {
      if (!selectionGate.requireSelection(t("bulkAction.missingSelection")))
        return;
      if (!selectedIds.some((id) => eligibleIds.has(id)))
        return selectionGate.reject(managerT("bulk.unavailable"));
      if (target === null) return;
      bulk.requestConfirmation({
        type: "bulkChange",
        targetIds: [...selectedIds],
        values: { accountStatus: target },
      });
    },
  };
}
