/**
 * 휴면 목록에서 허용하는 기간·검색 필드와 개별 필터를 공용 입력 컴포넌트에 연결한다.
 * 실제 API에서도 입력 UI는 필요하며 행 필터링이나 서버 조회는 수행하지 않는다.
 */
import { FilterPanel } from "@/shared/ui/filter/FilterPanel";
import { useTranslation } from "react-i18next";
import type { useMemberRecordFilter } from "../../../mechanics/record-list/model/useMemberRecordFilter";
import {
  MemberAccountStatusFilter,
  MemberRecordFilterFields,
  MemberSignupMethodFilter,
} from "../../../mechanics/record-list/ui/MemberRecordFilterFields";
export function DormantMemberListFilters({
  filter,
}: {
  readonly filter: ReturnType<typeof useMemberRecordFilter>;
}) {
  const { t } = useTranslation("members");
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
      <MemberRecordFilterFields
        filter={filter}
        periodOptions={[
          { value: "joinedAt", label: t("columns.joinedAt") },
          { value: "lastAccessedAt", label: t("columns.lastAccessedAt") },
          { value: "dormantAt", label: t("secondary.fields.dormantAt") },
        ]}
        keywordOptions={[
          { value: "email", label: t("columns.email") },
          { value: "name", label: t("columns.name") },
          { value: "phone", label: t("columns.phone") },
        ]}
      />
      <MemberSignupMethodFilter
        values={filter.draft.signupMethods}
        onChange={(signupMethods) => filter.patchDraft({ signupMethods })}
      />
      <MemberAccountStatusFilter
        values={filter.draft.accountStatuses}
        onChange={(accountStatuses) => filter.patchDraft({ accountStatuses })}
      />
    </FilterPanel>
  );
}
