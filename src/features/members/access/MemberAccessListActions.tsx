/**
 * 접속 목록의 등록 진입과 다운로드 입력 액션을 조립한다.
 * API 이후에도 버튼/입력 연결은 유지하며 실제 파일 요청은 onDownload가 연결하는 업무 경계다.
 */
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import {
  MemberDownloadAction,
  type MemberDownloadRequest,
} from "../records/MemberDownloadAction";
import type { MemberRecordSearch } from "../records/member-record-search";
export function MemberAccessListActions({
  searched,
  selectedIds,
  search,
  onRegister,
  onDownload,
}: {
  readonly searched: boolean;
  readonly selectedIds: readonly string[];
  readonly search: MemberRecordSearch;
  readonly onRegister: () => void;
  readonly onDownload: (request: MemberDownloadRequest) => void;
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <Button type="button" onClick={onRegister}>
        {t("actions.register")}
      </Button>
      <MemberDownloadAction
        visible={searched}
        ids={selectedIds}
        search={search}
        onDownload={onDownload}
      />
    </>
  );
}
