/**
 * 기록 목록이 공유하는 기간·검색어 및 계정 상태·가입 방식 입력 컴포넌트다.
 * 값과 변경 callback을 연결하는 UI는 유지하며, 옵션이 서버 조회 대상인지 여부는 각 필드 계약에서 결정한다.
 */
import { standardPeriodPresetValues } from "@/shared/config/list";
import { usePeriodPresets } from "@/shared/i18n/use-period-presets";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { KeywordFilterField } from "@/shared/ui/patterns/KeywordFilterField";
import { PeriodFilterField } from "@/shared/ui/patterns/PeriodFilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { useTranslation } from "react-i18next";
import {
  memberAccountStatuses,
  memberSignupMethods,
} from "../../../model/account";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import type { useMemberRecordFilter } from "../model/useMemberRecordFilter";

export function MemberRecordFilterFields({
  filter,
  periodOptions,
  keywordOptions,
}: {
  readonly filter: ReturnType<typeof useMemberRecordFilter>;
  readonly periodOptions: readonly { value: string; label: string }[];
  readonly keywordOptions: readonly {
    value: "email" | "name" | "phone" | "content";
    label: string;
  }[];
}) {
  const { t } = useTranslation("members");
  const standardPresets = usePeriodPresets(standardPeriodPresetValues);
  return (
    <>
      <PeriodFilterField
        label={
          periodOptions.length === 1
            ? (periodOptions[0]?.label ?? t("filters.period"))
            : t("filters.period")
        }
        criterion={
          periodOptions.length === 1
            ? undefined
            : {
                label: t("filters.periodType"),
                value: filter.draft.periodType,
                options: periodOptions,
                onValueChange: (periodType) =>
                  filter.patchDraft({ periodType }),
              }
        }
        preset={filter.period.preset}
        presets={standardPresets.presets}
        customLabel={standardPresets.customLabel}
        presetGroupLabel={t("filters.periodPreset")}
        range={filter.period.range}
        onPresetChange={filter.period.setPreset}
        onRangeChange={filter.period.setRange}
        fromLabel={t("filters.startDate")}
        toLabel={t("filters.endDate")}
        calendarLabel={t("filters.calendar")}
      />
      <KeywordFilterField
        label={t("filters.keyword")}
        field={{
          label: t("filters.keywordType"),
          value: filter.keyword.pending.field,
          options: keywordOptions,
          onValueChange: filter.keyword.setPendingField,
        }}
        items={filter.keyword.items}
        pendingValue={filter.keyword.pending.value}
        onPendingValueChange={filter.keyword.setPendingValue}
        onAdd={filter.keyword.addPending}
        onRemoveAt={filter.keyword.removeAt}
        addLabel={t("filters.add")}
        removeLabel={(item) => t("filters.remove", { value: item.value })}
        inputLabel={t("filters.keyword")}
        formatItem={(item) =>
          `${keywordOptions.find((option) => option.value === item.field)?.label ?? item.field}: ${item.value}`
        }
      />
    </>
  );
}

export function MemberAccountStatusFilter({
  values,
  onChange,
}: {
  readonly values: MemberRecordSearch["accountStatuses"];
  readonly onChange: (
    values: NonNullable<MemberRecordSearch["accountStatuses"]>,
  ) => void;
}) {
  const { t } = useTranslation("members");
  return (
    <FilterField label={t("filters.accountStatus")}>
      {({ labelId }) => (
        <CheckboxTree
          ariaLabelledby={labelId}
          selectAllLabel={t("filters.all")}
          nodes={memberAccountStatuses.map((value) => ({
            value,
            label: t(`accountStatus.${value}`),
          }))}
          values={values ?? []}
          emptyMeansAll
          onValueChange={(next) =>
            onChange(next as NonNullable<MemberRecordSearch["accountStatuses"]>)
          }
        />
      )}
    </FilterField>
  );
}

export function MemberSignupMethodFilter({
  values,
  onChange,
}: {
  readonly values: MemberRecordSearch["signupMethods"];
  readonly onChange: (
    values: NonNullable<MemberRecordSearch["signupMethods"]>,
  ) => void;
}) {
  const { t } = useTranslation("members");
  return (
    <FilterField label={t("filters.signupMethod")}>
      {({ labelId }) => (
        <CheckboxTree
          ariaLabelledby={labelId}
          selectAllLabel={t("filters.all")}
          nodes={memberSignupMethods.map((value) => ({
            value,
            label: t(`signup.${value}`),
          }))}
          values={values ?? []}
          emptyMeansAll
          onValueChange={(next) =>
            onChange(next as NonNullable<MemberRecordSearch["signupMethods"]>)
          }
        />
      )}
    </FilterField>
  );
}
