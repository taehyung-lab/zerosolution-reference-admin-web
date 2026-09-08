/**
 * 회원 기록 목록과 상담·소명 상세·재발행 입력을 재현하는 예시 데이터다.
 * 필터·정렬 함수는 mock에서 서버 처리를 대신할 수 있지만, 서버 페이지 API를 사용하는 제품 코드의 공용 조회 로직으로 승격하지 않는다.
 */
import { i18n } from "@/shared/i18n/i18n";
import type { AppealRecord } from "../model/appeal-record";
import type { CounselDetail } from "../model/counsel-detail";
import type { MemberRecordSearch } from "../model/member-record-search";

import type {
  AppealRow,
  CounselRow,
  DormantMemberRow,
  MemberAccessRow,
  WithdrawnMemberRow,
} from "../model/member-records";
// TRANSPLANT_PENDING_SECONDARY_REFERENCE_DATA: 읽기 전용 예시다. 확인된 회원 API 데이터와 문의 유형 출처로 교체해야 한다.
/** 여러 업무 화면을 재현할 읽기 전용 행을 만든다. 101건 예시는 페이지 이동을 확인하기 위한 개수다. */
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

/** 예시 행에 UI 검색 조건을 적용하는 mock용 판정이다. 키워드 AND 등 현재 계산을 실제 서버 검색 의미로 확정하지 않는다. */
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
      Date.parse(values[search.periodType ?? ""] ?? "") >=
        Date.parse(search.startDateTime)) &&
    (!search.endDateTime ||
      Date.parse(values[search.periodType ?? ""] ?? "") <=
        Date.parse(search.endDateTime)) &&
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

/** 원본 fixture를 변경하지 않고 정렬한 배열을 반환한다. 서버 정렬 API가 연결된 화면에서는 실행할 필요가 없다. */
export function sortMemberRecords<T>(
  rows: readonly T[],
  read: (row: T) => string,
  direction: MemberRecordSearch["sortDirection"],
) {
  return [...rows].sort(
    (a, b) => read(a).localeCompare(read(b)) * (direction === "asc" ? 1 : -1),
  );
}

/** 목록의 상담 ID에 연결된 상세·기록·예약 예시를 만든다. 실제 상담 상세 응답은 미확정이다. */
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
/** 소명 목록과 같은 ID로 상세/저장된 처리 결과 예시를 만든다. 제출 후 서버 상태 전이를 재현하지 않는다. */
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
/** 프린터 선택과 미리보기 UI를 확인하는 예시다. 실제 프린터 연결·가용 상태·인쇄 성공은 검증하지 않는다. */
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
