/**
 * 전체·일반·불량 회원의 동일한 목록 workflow를 화면 정의로 조립한다.
 * 필터·데이터·결과·액션 소유자를 연결하는 역할은 API 연결 후에도 유지하고 조회 방식의 차이를 화면 종류로 만들지 않는다.
 */
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { useTranslation } from "react-i18next";
import type { MemberListActionRequest } from "../../../model/member-list-action";
import {
  memberListDefinitions,
  type MemberListDefinition,
} from "../config/member-list-definition";
import {
  resolveMemberSearch,
  memberCanonicalSearchSchemas,
  type MemberRouteSearch,
} from "../model/search-schema";
import { useMemberListData } from "../model/useMemberListData";
import { useMemberListFilter } from "../model/useMemberListFilter";
import { MemberListActions } from "./MemberListActions";
import { MemberListFilters } from "./MemberListFilters";
import { MemberListResult } from "./MemberListResult";
import { useMemberListResult } from "./useMemberListResult";

export interface MemberListScreenProps {
  readonly search: MemberRouteSearch;
  readonly onSearchChange: (next: MemberRouteSearch) => void;
  readonly onMemberActivate: (memberId: string) => void;
  readonly onRegister: () => void;
  readonly onActionRequest: (request: MemberListActionRequest) => void;
}

export function AllMemberListScreen(props: MemberListScreenProps) {
  return <MemberListScreen definition={memberListDefinitions.all} {...props} />;
}

export function GeneralMemberListScreen(props: MemberListScreenProps) {
  return (
    <MemberListScreen definition={memberListDefinitions.general} {...props} />
  );
}

export function FlaggedMemberListScreen(props: MemberListScreenProps) {
  return (
    <MemberListScreen definition={memberListDefinitions.flagged} {...props} />
  );
}

function MemberListScreen({
  definition,
  search,
  onSearchChange,
  onMemberActivate,
  onRegister,
  onActionRequest,
}: MemberListScreenProps & { readonly definition: MemberListDefinition }) {
  const { t } = useTranslation("members");
  const canonical = memberCanonicalSearchSchemas[definition.identity].parse(search);
  const resolved = resolveMemberSearch(canonical, definition.identity);
  const filter = useMemberListFilter({
    search: resolved,
    searched: canonical.searched === true,
    onSearchChange,
  });
  const data = useMemberListData(resolved, definition.identity, canonical.searched === true);
  const result = useMemberListResult({
    search: resolved,
    data,
    definition,
    onSearchChange,
  });
  const title = t(definition.titleKey);

  return (
    <section>
      <PageHeader
        breadcrumbs={[t("path.members"), t("path.active"), title]}
        tooltip={
          definition.tooltip
            ? {
                content: t("screens.allTooltip"),
                label: t("screens.help"),
              }
            : undefined
        }
        title={title}
      />
      <MemberListFilters filter={filter} definition={definition} />
      <MemberListResult
        data={data}
        result={result}
        toolbarRight={
          <MemberListActions
            searched={data.searched}
            selectedIds={result.selectedIds}
            onActionRequest={onActionRequest}
            onRegister={onRegister}
          />
        }
        onMemberActivate={onMemberActivate}
      />
    </section>
  );
}
