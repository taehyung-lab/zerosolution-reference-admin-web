import { useTranslation } from "react-i18next";
import { standardPageSizeOptions } from "@/shared/config/list";
import { PageSizeControl } from "@/shared/ui/patterns/PageSizeControl";
import { SortControl } from "@/shared/ui/patterns/SortControl";
import type { MemberRecordSearch } from "./member-record-search";

export function MemberRecordViewControls({
  search,
  onChange,
  sortOptions,
}: {
  readonly search: MemberRecordSearch;
  readonly onChange: (search: MemberRecordSearch) => void;
  readonly sortOptions: readonly { value: string; label: string }[];
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <PageSizeControl
        label={t("result.pageSize")}
        value={search.pageSize ?? 100}
        options={standardPageSizeOptions}
        onValueChange={(pageSize) =>
          onChange({
            ...search,
            pageSize: pageSize as MemberRecordSearch["pageSize"],
            page: undefined,
          })
        }
      />
      <SortControl
        label={t("result.sort")}
        value={search.sortType ?? sortOptions[0]?.value ?? ""}
        options={sortOptions}
        onValueChange={(sortType) =>
          onChange({ ...search, sortType, page: undefined })
        }
      />
    </>
  );
}
