/**
 * 기존 API 운영자 목록의 일괄변경 버튼과 확인/미선택 알림을 표시한다.
 * 실제 API에서도 상호작용은 유지하며 변경 요청 실행과 서버 성공 후 처리는 액션 workflow에 연결한다.
 */
import {
  BulkActionDialogs,
  SelectionAlert,
} from "@/shared/ui/dialog/BulkActionDialogs";
import { Button } from "@/shared/ui/primitives/Button";
import { Select } from "@/shared/ui/primitives/Select";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ManagerListItem } from "../../../model/manager";
import {
  useManagerListActions,
  type ManagerListActionRequest,
} from "../model/useManagerListActions";

/**
 * 목록 도구 모음과 액션 팝업의 수명을 소유한다. 조회 상태가 바뀌어도 확인 중인 팝업이 사라지지 않도록
 * 버튼만 searched로 감추고 팝업 소유자는 계속 마운트한다. 실제 API의 로딩 전환에서도 필요한 경계다.
 */
export function ManagerListActions({
  searched,
  selectedIds,
  rows,
  onActionRequest,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly rows: readonly ManagerListItem[];
  readonly onActionRequest: (intent: ManagerListActionRequest) => void;
}) {
  const { t } = useTranslation("managers");
  const actions = useManagerListActions({ selectedIds, rows, onActionRequest });
  const registerAction = (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white"
      to="/managers/new"
    >
      {t("form.createAction")}
    </Link>
  );
  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        {searched ? (
          <>
            <Select
              aria-label={t("bulk.field")}
              className="w-auto"
              value={actions.target}
              placeholder={t("bulk.select")}
              options={[
                { value: "active", label: t("bulk.active") },
                { value: "inactive", label: t("bulk.inactive") },
              ]}
              onValueChange={(value) => {
                if (
                  value === null ||
                  value === "active" ||
                  value === "inactive"
                )
                  actions.setTarget(value);
              }}
            />
            <Button onClick={actions.requestBulkChange}>
              {t("bulk.change")}
            </Button>
          </>
        ) : null}
        {registerAction}
      </div>
      <SelectionAlert controller={actions.selectionGate} />
      <BulkActionDialogs
        controller={actions.bulk}
        confirmDescription={t("bulk.confirm")}
      />
    </>
  );
}
