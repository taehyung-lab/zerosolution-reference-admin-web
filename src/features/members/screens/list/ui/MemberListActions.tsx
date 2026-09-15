import {
  BulkActionDialogs,
  SelectionAlert,
} from "@/shared/ui/dialog/BulkActionDialogs";
import { FilterField } from "@/shared/ui/filter/FilterField";
import { Button } from "@/shared/ui/primitives/Button";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { Select } from "@/shared/ui/primitives/Select";
import { useTranslation } from "react-i18next";
import { useMemberListActions } from "../../../mechanics/record-list/model/useMemberListActions";
import type { MemberListActionRequest } from "../../../model/member-list-action";
import { memberRestrictions } from "../model/search-schema";

/**
 * 목록 도구 모음과 액션 팝업의 수명을 소유한다. 조회 상태가 바뀌어도 확인 중인 팝업이 사라지지 않도록
 * 버튼만 searched로 감추고 팝업 소유자는 계속 마운트한다. 실제 API의 로딩 전환에서도 필요한 경계다.
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
  // 아래 분기에서 변경값의 판별 유니온을 좁히기 위한 지역 참조다.
  const change = actions.change;
  // TRANSPLANT_PENDING_MEMBER_PERMISSION: 현재는 액션이 가능한 기준선이다.
  // 제품 권한 식별자가 확정되면 해당 권한 판정에 연결한다.
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
