/**
 * 다운로드 사유와 비밀번호 등 화면에서 요구하는 입력을 검증해 검색 범위와 함께 전달한다.
 * 이 폼은 실제 API에서도 필요하지만 비밀번호의 진위·파일 생성·다운로드 성공은 서버 연결 이후에 판정한다.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/primitives/Button";
import { Select } from "@/shared/ui/primitives/Select";
import {
  SelectionAlert,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";
import type { MemberRecordSearch } from "./member-record-search";

export type MemberDownloadRequest =
  | { readonly scope: "selected"; readonly ids: readonly string[] }
  | { readonly scope: "all"; readonly search: MemberRecordSearch };
export function MemberDownloadAction({
  ids,
  search,
  onDownload,
  visible = true,
}: {
  readonly ids: readonly string[];
  readonly search: MemberRecordSearch;
  readonly onDownload: (request: MemberDownloadRequest) => void;
  readonly visible?: boolean;
}) {
  const { t } = useTranslation("members");
  const [scope, setScope] = useState<string | null>(null);
  const gate = useSelectionGate(ids.length);
  return (
    <>
      <SelectionAlert controller={gate} />
      {visible ? (
        <>
          <Select
            aria-label={t("secondary.downloadScope")}
            value={scope}
            onValueChange={setScope}
            placeholder={t("secondary.choose")}
            options={[
              { value: "selected", label: t("secondary.selected") },
              { value: "all", label: t("secondary.allResults") },
            ]}
          />
          <Button
            type="button"
            disabled={scope === null}
            onClick={() => {
              if (scope === "selected") {
                if (gate.requireSelection(t("secondary.downloadRequired")))
                  onDownload({ scope: "selected", ids: [...ids] });
              }
              if (scope === "all") {
                const conditions = { ...search };
                delete conditions.page;
                delete conditions.pageSize;
                onDownload({ scope: "all", search: conditions });
              }
            }}
          >
            {t("secondary.download")}
          </Button>
        </>
      ) : null}
    </>
  );
}
