/**
 * 활성 회원의 기간·검색어·가입 방식과 화면별 상태/활동제한 필터를 표시한다.
 * API 연결 뒤에도 입력 UI는 유지한다. 실제 조회는 입력마다 실행하지 않고 필터 훅이 확정한 조건을 따른다.
 */
import { standardPeriodPresetValues } from "@/shared/model/list-options";
import { usePeriodPresets } from "@/shared/i18n/use-period-presets";
import { FilterField } from "@/shared/ui/patterns/FilterField";
import { FilterPanel } from "@/shared/ui/patterns/FilterPanel";
import { KeywordFilterField } from "@/shared/ui/patterns/KeywordFilterField";
import { PeriodFilterField } from "@/shared/ui/patterns/PeriodFilterField";
import { CheckboxTree } from "@/shared/ui/primitives/CheckboxTree";
import { useTranslation } from "react-i18next";
import { type MemberSearch } from "../../../model/member-search";
import type { MemberListDefinition } from "../config/member-list-definition";
import { memberRestrictions } from "../model/search-schema";
import type { useMemberListFilter } from "../model/useMemberListFilter";

export function MemberListFilters({
  filter,
  definition,
}: {
  readonly filter: ReturnType<typeof useMemberListFilter>;
  readonly definition: MemberListDefinition;
}) {
  const { t } = useTranslation("members");
  const standardPresets = usePeriodPresets(standardPeriodPresetValues);
  const signupNodes = [
    { value: "direct", label: t("signup.direct") },
    { value: "kakao", label: t("signup.kakao") },
    { value: "naver", label: t("signup.naver") },
    { value: "apple", label: t("signup.apple") },
    { value: "melon", label: t("signup.melon") },
  ];
  const restrictionNodes = memberRestrictions.map((value) => ({
    value,
    label: t(`restriction.${value}`),
  }));
  return (
    <FilterPanel
      title={t("search")}
      collapseLabel={t("filters.collapse")}
      expandLabel={t("filters.expand")}
      submitLabel={t("search")}
      resetLabel={t("reset")}
      onSubmit={filter.submit}
      onReset={filter.reset}
    >
      <PeriodFilterField
        label={t("filters.period")}
        criterion={{
          label: t("filters.periodType"),
          value: filter.draft.periodType,
          options: [
            { value: "joinedAt", label: t("columns.joinedAt") },
            { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
          ],
          onValueChange: (periodType) => filter.patchDraft({ periodType }),
        }}
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
      <div>
        <KeywordFilterField
          label={t("filters.keyword")}
          field={{
            label: t("filters.keywordType"),
            value: filter.keyword.pending.field,
            options: [
              { value: "email", label: t("columns.email") },
              { value: "name", label: t("columns.name") },
              { value: "phone", label: t("columns.phone") },
            ],
            onValueChange: filter.keyword.setPendingField,
          }}
          items={filter.keyword.items}
          pendingValue={filter.keyword.pending.value}
          onPendingValueChange={filter.keyword.setPendingValue}
          onAdd={filter.addKeyword}
          onRemoveAt={filter.keyword.removeAt}
          addLabel={t("filters.add")}
          removeLabel={(item) => t("filters.remove", { value: item.value })}
          inputLabel={t("filters.keyword")}
          formatItem={(item) => `${t(`columns.${item.field}`)} : ${item.value}`}
        />
      </div>
      <FilterField label={t("filters.signupMethod")}>
        {({ labelId }) => (
          <CheckboxTree
            ariaLabelledby={labelId}
            selectAllLabel={t("filters.all")}
            nodes={signupNodes}
            values={filter.draft.signupMethods}
            emptyMeansAll
            onValueChange={(signupMethods) =>
              filter.patchDraft({
                signupMethods: signupMethods as MemberSearch["signupMethods"],
              })
            }
          />
        )}
      </FilterField>
      {definition.accountStatusFilter ? (
        <FilterField label={t("filters.accountStatus")}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t("filters.all")}
              nodes={[
                { value: "general", label: t("accountStatus.general") },
                { value: "flagged", label: t("accountStatus.flagged") },
              ]}
              values={filter.draft.accountStatuses}
              emptyMeansAll
              onValueChange={(accountStatuses) =>
                filter.patchDraft({
                  accountStatuses:
                    accountStatuses as MemberSearch["accountStatuses"],
                })
              }
            />
          )}
        </FilterField>
      ) : null}
      {definition.restrictionFilter ? (
        <FilterField label={t("filters.restrictions")}>
          {({ labelId }) => (
            <CheckboxTree
              ariaLabelledby={labelId}
              selectAllLabel={t("filters.all")}
              nodes={restrictionNodes}
              values={filter.draft.restrictions}
              emptyMeansAll
              onValueChange={(restrictions) =>
                filter.patchDraft({
                  restrictions: restrictions as MemberSearch["restrictions"],
                })
              }
            />
          )}
        </FilterField>
      ) : null}
    </FilterPanel>
  );
}
