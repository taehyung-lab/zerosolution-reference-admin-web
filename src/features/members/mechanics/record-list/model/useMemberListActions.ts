/**
 * 활성 회원 일괄변경의 입력·선택 검증·확인할 대상과 메시지 작성 요청을 관리한다.
 * API 연결 후에도 필요한 상호작용이다. 실제 변경과 서버 성공 후 선택 해제는 최종 요청 workflow에 연결해야 한다.
 */
import { useConfirmation } from "@/shared/lib/use-confirmation";
import { useSelectionGate } from "@/shared/ui/patterns/BulkActionDialogs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MemberListActionRequest } from "../../../model/member-list-action";

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

/**
 * 일반/불량 상태와 종속 활동제한 선택이 완성됐을 때만 요청 입력을 반환한다.
 */
function completed(
  change: MemberBulkChange,
): Exclude<MemberBulkChange, null> | null {
  if (change === null) return null;
  if (change.accountStatus === "flagged" && change.restrictions.length === 0)
    return null;
  return change;
}

/**
 * 목록의 종속 변경값·선택 검증·열린 확인창을 요청 입력 경계까지 관리한다.
 * 모든 사전 검증은 하나의 선택 알림을 사용해 값을 고친 뒤 오래된 개별 오류가 남지 않게 한다.
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
  const bulk = useConfirmation({
    run: (request: MemberListActionRequest) => onActionRequest(request),
  });

  const requestBulkChange = () => {
    if (!selectionGate.requireSelection(sharedT("bulkAction.missingSelection")))
      return;
    // TRANSPLANT_PENDING_MEMBER_BULK_INCOMPLETE: 원장에 행 미선택 문구는 있지만
    // 변경값의 종속 선택이 미완성인 경우의 문구는 없어 현재 문구는 계약 확인 대상이다.
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
