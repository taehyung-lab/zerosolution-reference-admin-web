import { type AppealBulkChange } from "../model/appeal-bulk-change";
/**
 * 소명 목록의 선택 대상과 일괄변경 값을 검증하고 확인 뒤 업무 요청을 전달한다.
 * 실제 API에서도 이 입력 절차는 유지하며 서버의 부분 성공·상태 변경 결과는 현재 구현하지 않았다.
 */
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
