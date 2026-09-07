import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { useTranslation } from "react-i18next";
import { type MemberCounselRequest } from "../model/member-counsel-request";
/**
 * 상담 목록에서 상세 팝업과 재발행 팝업을 열고 대상 ID를 업무 요청에 결합하는 화면이다.
 * 팝업 전환 책임은 API 이후에도 유지한다. 현재 상세가 없으면 팝업이 열리지 않으므로 비동기 전환 시 로딩·오류·없는 대상 표시도 연결해야 한다.
 */
import { useState } from "react";
import type { MemberRecordSearch } from "../../../model/member-record-search";
import { useMemberCounselData } from "../model/useMemberCounselData";
import { CounselDetailDialog } from "./CounselDetailDialog";
import { MemberCounselListScreen } from "./MemberCounselListScreen";
import { ReissueDialog } from "./ReissueDialog";

export function MemberCounselScreen({
  search,
  onSearchChange,
  onRequest,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (search: MemberRecordSearch) => void;
  readonly onRequest: (request: MemberCounselRequest) => void;
}) {
  const { t: shared } = useTranslation("shared");
  const [opened, setOpened] = useState<{ id: string; at: string }>();
  const [reissue, setReissue] = useState<{
    counselId: string;
    noteId: string;
  }>();
  const { detail, inquiryOptions, operatorName, printing, state, retry } =
    useMemberCounselData(opened?.id);
  // TRANSPLANT_PENDING_MEMBER_COUNSEL_POPUP_CONTRACT: 예시 조회와 입력 callback을 계약이 확인된 Query/mutation에 연결할 지점이다.
  return (
    <>
      <MemberCounselListScreen
        search={search}
        onSearchChange={onSearchChange}
        onActivate={(id) => setOpened({ id, at: new Date().toISOString() })}
        onDownload={(input) => onRequest({ type: "download", input })}
        inquiryOptions={inquiryOptions}
      />
      {opened ? (
        <DetailStateBoundary
          state={state}
          labels={{
            error: shared("error.unexpected.body"),
            notFound: shared("error.kind.notFound"),
          }}
          retryLabel={shared("error.unexpected.retry")}
          onRetry={() => {
            void retry();
          }}
        >
          {null}
        </DetailStateBoundary>
      ) : null}
      {detail && opened ? (
        <CounselDetailDialog
          key={detail.id}
          detail={detail}
          openedAt={opened.at}
          operatorName={operatorName}
          onClose={() => setOpened(undefined)}
          onCreate={(input) => onRequest({ type: "create", ...input })}
          onUpdate={(input) => onRequest({ type: "update", ...input })}
          onDelete={(input) => onRequest({ type: "delete", ...input })}
          onReissue={(noteId) => setReissue({ counselId: detail.id, noteId })}
        />
      ) : null}
      {reissue ? (
        <ReissueDialog
          {...printing}
          onClose={() => setReissue(undefined)}
          onRequest={(input) =>
            onRequest({ type: "reissue", ...reissue, ...input })
          }
        />
      ) : null}
    </>
  );
}
