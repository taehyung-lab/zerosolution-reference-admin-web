import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";
import { usePageRowSelection } from "@/shared/lib/use-page-row-selection";
import {
  BulkActionDialogs,
  SelectionAlert,
  useBulkActionDialogs,
  useSelectionGate,
} from "@/shared/ui/patterns/BulkActionDialogs";
import { Pagination } from "@/shared/ui/patterns/Pagination";
import { Button } from "@/shared/ui/primitives/Button";
import { Checkbox } from "@/shared/ui/primitives/Checkbox";
import { Input } from "@/shared/ui/primitives/Input";
import { Table, TableCell, TableHead } from "@/shared/ui/primitives/Table";

export const memberActivityTabs = [
  "ticket",
  "attendance",
  "rewatch",
  "entry",
] as const;
export type MemberActivityTab = (typeof memberActivityTabs)[number];
export interface MemberActivitySearch {
  readonly tab: MemberActivityTab;
  readonly keyword: string;
  readonly page: number;
  readonly pageSize: 100;
}
export interface MemberActivityRow {
  readonly id: string;
  readonly occurredAt: string;
  readonly performanceName: string;
  readonly session: string;
  readonly performanceAt: string;
  readonly bookingNumber: string;
  readonly seatNumber: string;
}
export interface MemberActivityDelete {
  readonly tab: Exclude<MemberActivityTab, "entry">;
  readonly ids: readonly string[];
}

function dateTime(instant: string) {
  return `${formatDate(instant)} ${formatTimeInTimeZone(instant, displayTimeZone())}`;
}

export function MemberActivitySection({
  rows,
  total,
  query,
  onSearch,
  onDelete,
}: {
  readonly rows: readonly MemberActivityRow[];
  readonly total: number;
  readonly query: MemberActivitySearch;
  readonly onSearch: (input: MemberActivitySearch) => void;
  readonly onDelete: (input: MemberActivityDelete) => void;
}) {
  const { t } = useTranslation("members");
  const id = useId();
  const tabs = useRef<HTMLDivElement>(null);
  const search = query;
  const [draft, setDraft] = useState("");
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const gate = useSelectionGate(selection.selectedIds.length);
  const deletion = useBulkActionDialogs({ run: onDelete });
  const commit = onSearch;
  const selectTab = (tab: MemberActivityTab) => {
    setDraft("");
    commit({ tab, keyword: "", page: 1, pageSize: 100 });
  };
  return (
    <div className="space-y-4">
      <SelectionAlert controller={gate} />
      <BulkActionDialogs
        controller={deletion}
        confirmDescription={t("activity.confirmDelete")}
      />
      <div
        ref={tabs}
        role="tablist"
        aria-label={t("activity.title")}
        className="flex gap-2"
      >
        {memberActivityTabs.map((tab, index) => (
          <button
            type="button"
            key={tab}
            role="tab"
            id={`${id}-${tab}`}
            aria-controls={`${id}-panel`}
            aria-selected={search.tab === tab}
            tabIndex={search.tab === tab ? 0 : -1}
            onClick={() => selectTab(tab)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 3
                    : event.key === "ArrowRight"
                      ? (index + 1) % 4
                      : event.key === "ArrowLeft"
                        ? (index + 3) % 4
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              const value = memberActivityTabs[next];
              if (value === undefined) return;
              selectTab(value);
              tabs.current
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
          >
            {t(`activity.tabs.${tab}`)}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${search.tab}`}
        className="space-y-4"
      >
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            commit({ ...search, keyword: draft.trim(), page: 1 });
          }}
        >
          <Input
            aria-label={t("activity.search")}
            placeholder={t("activity.searchHint")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit">{t("activity.search")}</Button>
          {search.keyword !== "" ? (
            <Button
              type="button"
              onClick={() => {
                setDraft("");
                commit({ ...search, keyword: "", page: 1 });
              }}
            >
              {t("activity.reset")}
            </Button>
          ) : null}
        </form>
        {search.tab !== "entry" ? (
          <Button
            type="button"
            onClick={() => {
              if (
                search.tab === "entry" ||
                !gate.requireSelection(t("activity.selectRequired"))
              )
                return;
              deletion.requestConfirmation({
                tab: search.tab,
                ids: selection.selectedIds,
              });
            }}
          >
            {t("activity.deleteSelected")}
          </Button>
        ) : null}
        {rows.length === 0 ? (
          <p role="status">
            {search.keyword !== ""
              ? t("activity.noResults")
              : search.tab === "entry"
                ? t("activity.entryEmpty")
                : t("activity.empty")}
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                {search.tab !== "entry" ? (
                  <TableHead>
                    <Checkbox
                      aria-label={t("activity.selectAll")}
                      checked={selection.isAllChecked}
                      indeterminate={selection.isMixed}
                      onChange={(event) =>
                        selection.togglePage(event.target.checked)
                      }
                    />
                  </TableHead>
                ) : null}
                <TableHead>
                  {search.tab === "entry"
                    ? t("activity.enteredAt")
                    : t("activity.occurredAt")}
                </TableHead>
                <TableHead>{t("activity.performanceName")}</TableHead>
                <TableHead>{t("activity.session")}</TableHead>
                <TableHead>{t("activity.performanceAt")}</TableHead>
                <TableHead>{t("activity.bookingNumber")}</TableHead>
                <TableHead>{t("activity.seatNumber")}</TableHead>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {search.tab !== "entry" ? (
                    <TableCell>
                      <Checkbox
                        aria-label={t("activity.selectRow", {
                          number: row.bookingNumber,
                        })}
                        checked={selection.isChecked(row)}
                        onChange={(event) =>
                          selection.toggleRow(row, event.target.checked)
                        }
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>{dateTime(row.occurredAt)}</TableCell>
                  <TableCell>{row.performanceName}</TableCell>
                  <TableCell>{row.session}</TableCell>
                  <TableCell>{dateTime(row.performanceAt)}</TableCell>
                  <TableCell>{row.bookingNumber}</TableCell>
                  <TableCell>{row.seatNumber}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination
          page={search.page}
          totalPages={Math.max(1, Math.ceil(total / 100))}
          onPageChange={(page) => commit({ ...search, page })}
          ariaLabel={t("activity.pagination")}
          previousLabel={t("activity.previous")}
          nextLabel={t("activity.next")}
        />
      </div>
    </div>
  );
}
