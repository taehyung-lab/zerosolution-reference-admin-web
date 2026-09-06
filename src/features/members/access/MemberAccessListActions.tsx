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
