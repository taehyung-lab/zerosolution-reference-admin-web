/**
 * 신규 상담 초안의 초기값, 편집 대상, 두 폼의 dirty 여부와 삭제 확인 상태를 관리한다.
 * 이 client 상호작용은 API 연결 후에도 필요하다. 상담 레코드 자체와 저장 결과는 외부 데이터/요청 소유자가 제공한다.
 */
import { useState } from "react";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { useConfirmation } from "@/shared/lib/use-confirmation";
import {
  toCounselDraft,
  type MemberCounselValues,
} from "./member-counsel-schema";

export function useCounselRecords({
  operatorName,
  openedAt,
  onDelete,
}: {
  readonly operatorName: string;
  readonly openedAt: string;
  readonly onDelete: (id: string) => void;
}) {
  const [initialDraft] = useState<MemberCounselValues>(() => ({
    ...toCounselDraft({
      receivedAt: openedAt,
      answeredAt: openedAt,
      operatorName,
      inquiryType: "other",
      content: "",
    }),
    inquiryType: "",
  }));
  const [editing, setEditing] = useState<string>();
  const [createDirty, setCreateDirty] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const guard = useUnsavedChangesGuard({ when: createDirty || editDirty });
  const deletion = useConfirmation({ run: onDelete });
  return {
    initialDraft,
    editing,
    setCreateDirty,
    setEditDirty,
    guard,
    deletion,
    // 상세 안 편집 전환에는 취소 경고를 띄우지 않는다. 신규 상담 입력과 route 보호는 유지한다.
    edit: (id?: string) =>
      guard.close(() => setEditing(id), { when: false }),
  };
}
