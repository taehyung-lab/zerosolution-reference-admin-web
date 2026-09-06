import { i18n } from "@/shared/i18n/i18n";
import type { MemberRecordSearch } from "../records/member-record-search";
import type { CounselDetail } from "../counsel/CounselDetailDialog";
import type { AppealRecord } from "../appeals/AppealDetailScreen";

import type {
  DormantMemberRow,
  WithdrawnMemberRow,
  MemberAccessRow,
  CounselRow,
  AppealRow,
} from "../model/member-records";
// TRANSPLANT_PENDING_SECONDARY_REFERENCE_DATA: opt-in readonly scenario inputs; replace with confirmed member API data and category sources.
export function memberRecordFixtures() {
  const name = i18n.t("members:secondary.example.name");
  const base = {
    email: "reference@example.com",
    name,
    phone: "01012345678",
    accountStatus: "general" as const,
  };
  const dormant: DormantMemberRow[] = Array.from(
    { length: 101 },
    (_, index) => ({
      ...base,
      id: `dormant-${index + 1}`,
      signupMethod: "direct",
      joinedAt: "2024-01-01T00:00:00Z",
      lastAccessedAt: "2024-06-01T00:00:00Z",
      dormantAt: "2025-06-01T00:00:00Z",
    }),
  );
  const withdrawn: WithdrawnMemberRow[] = [
    {
      id: "withdrawn-1",
      email: base.email,
      signupMethod: "direct",
      accountStatus: "general",
      joinedAt: "2024-01-01T00:00:00Z",
      lastAccessedAt: "2025-01-01T00:00:00Z",
      withdrawnAt: "2025-06-01T00:00:00Z",
      reason: i18n.t("members:secondary.example.reason"),
    },
  ];
  const access: MemberAccessRow[] = Array.from({ length: 101 }, (_, index) => ({
    ...base,
    grade: "—",
    id: `access-${index + 1}`,
    accessedAt: "2026-09-01T00:00:00Z",
    accessPath: "app",
  }));
  const counsel: CounselRow[] = [
    {
      ...base,
      id: "counsel-1",
      memberId: "example-general",
      signupMethod: "direct",
      receivedAt: "2026-09-01T00:00:00Z",
      answeredAt: "2026-09-01T01:00:00Z",
      inquiryType: "reference",
      content: i18n.t("members:secondary.example.content"),
      status: "waiting",
    },
  ];
  const appeals: AppealRow[] = [
    {
      ...base,
      id: "appeal-1",
      memberId: "example-flagged",
      accountStatus: "flagged",
      appliedAt: "2026-09-01T00:00:00Z",
      flaggedAt: "2026-08-01T00:00:00Z",
      restrictions: ["inquiry"],
      status: "held",
      result: "completed",
    },
  ];
  return { dormant, withdrawn, access, counsel, appeals };
}

export function matchesMemberRecordSearch(
  values: Readonly<Record<string, string>>,
  search: MemberRecordSearch,
): boolean {
  return (
    (search.keywords ?? []).every((keyword) =>
      (values[keyword.field] ?? "")
        .toLowerCase()
        .includes(keyword.value.toLowerCase()),
    ) &&
    (!search.startDateTime ||
      (values[search.periodType ?? ""] ?? "") >= search.startDateTime) &&
    (!search.endDateTime ||
      (values[search.periodType ?? ""] ?? "") <= search.endDateTime) &&
    (!search.signupMethods?.length ||
      search.signupMethods.includes(values.signupMethod as "direct")) &&
    (!search.accountStatuses?.length ||
      search.accountStatuses.includes(values.accountStatus as "general")) &&
    (!search.statuses?.length ||
      search.statuses.includes(values.status as "waiting")) &&
    (!search.results?.length ||
      search.results.includes(values.result as "waiting")) &&
    (!search.inquiryType || search.inquiryType === values.inquiryType) &&
    (!search.accessPaths?.length ||
      search.accessPaths.includes(values.accessPath as "app"))
  );
}

export function sortMemberRecords<T>(
  rows: readonly T[],
  read: (row: T) => string,
  direction: MemberRecordSearch["sortDirection"],
) {
  return [...rows].sort(
    (a, b) => read(a).localeCompare(read(b)) * (direction === "asc" ? 1 : -1),
  );
}

export function counselDetailFixture(id: string): CounselDetail | undefined {
  const row = memberRecordFixtures().counsel.find((item) => item.id === id);
  if (!row) return undefined;
  return {
    ...row,
    memberId: "example-general",
    records: [
      {
        id: "counsel-note-1",
        createdAt: row.receivedAt,
        receivedAt: row.receivedAt,
        answeredAt: row.answeredAt,
        operatorName: i18n.t("members:secondary.example.operator"),
        inquiryType: "reprintLost",
        content: row.content,
      },
    ],
    booking: {
      performance: i18n.t("members:secondary.example.performance"),
      booking: "REFERENCE-001",
      booker: row.name,
    },
  };
}
export function appealDetailFixture(id: string): AppealRecord | undefined {
  const row = memberRecordFixtures().appeals.find((item) => item.id === id);
  if (!row) return undefined;
  return {
    ...row,
    memberId: "example-flagged",
    birthDate: "1990-03-03",
    joinedAt: "2024-01-01T00:00:00Z",
    signupMethod: "direct",
    application: i18n.t("members:secondary.example.application"),
    attachments: [],
    processing: {
      status: row.status,
      result: row.result,
      reason: "",
      direct: "",
      opinion: "",
    },
    notified: false,
  };
}
export function reissueInputFixture() {
  return {
    printers: [
      {
        id: "reference-printer",
        name: i18n.t("members:secondary.example.printer"),
        enabled: true,
        busy: false,
      },
    ],
    preview: i18n.t("members:secondary.example.preview"),
  };
}
