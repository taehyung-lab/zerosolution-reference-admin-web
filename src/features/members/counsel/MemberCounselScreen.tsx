import { useState } from "react";
import type { MemberRecordSearch } from "../records/member-record-search";
import type { MemberDownloadRequest } from "../records/MemberDownloadAction";
import type { MemberCounselInput } from "../detail/counsel/member-counsel-schema";
import { useMemberCounselData } from "./useMemberCounselData";
import { MemberCounselListScreen } from "./MemberCounselListScreen";
import { CounselDetailDialog } from "./CounselDetailDialog";
import { ReissueDialog } from "./ReissueDialog";

export type MemberCounselRequest =
  | { readonly type: "download"; readonly input: MemberDownloadRequest }
  | {
      readonly type: "create";
      readonly counselId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly type: "update";
      readonly counselId: string;
      readonly noteId: string;
      readonly input: MemberCounselInput;
    }
  | {
      readonly type: "delete";
      readonly counselId: string;
      readonly noteId: string;
    }
  | {
      readonly type: "reissue";
      readonly counselId: string;
      readonly noteId: string;
      readonly printerId: string;
      readonly test: boolean;
    };

export function MemberCounselScreen({
  search,
  onSearchChange,
  onRequest,
}: {
  readonly search: MemberRecordSearch;
  readonly onSearchChange: (search: MemberRecordSearch) => void;
  readonly onRequest: (request: MemberCounselRequest) => void;
}) {
  const [opened, setOpened] = useState<{ id: string; at: string }>();
  const [reissue, setReissue] = useState<{
    counselId: string;
    noteId: string;
  }>();
  const { detail, inquiryOptions, operatorName, printing } =
    useMemberCounselData(opened?.id);
  // TRANSPLANT_PENDING_MEMBER_COUNSEL_POPUP_CONTRACT: replace fixture reads and validated callbacks with contracted queries/mutations.
  return (
    <>
      <MemberCounselListScreen
        search={search}
        onSearchChange={onSearchChange}
        onActivate={(id) => setOpened({ id, at: new Date().toISOString() })}
        onDownload={(input) => onRequest({ type: "download", input })}
        inquiryOptions={inquiryOptions}
      />
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
