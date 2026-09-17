import { ApiError } from "@/api/error";
import type { PerformanceDetail } from "../model/performance-detail";

// TRANSPLANT_PENDING_PERFORMANCE_DETAIL_CONTRACT: 목록 캐시 없이 직접 진입하는 상세를 검증하는 예시 응답이다. 실제 단건 조회로 교체하며 권한·DTO·언어 fallback 정책을 확정하지 않는다.
const details: readonly PerformanceDetail[] = [1, 2].map((number) => ({
  id: `reference-performance-${number}`,
  admission:
    number === 1
      ? null
      : {
          inputMode: "zone",
          drawing: {
            name: "reference-admission.txt",
            url: "data:text/plain;charset=utf-8,Reference%20admission%20guide%0AGate%20A%3A%20Area%20A",
          },
          guides: [
            {
              id: "reference-guide-1",
              gate: "Reference Gate A",
              areas: ["Reference Area A"],
            },
          ],
        },
  history:
    number === 1
      ? []
      : [
          {
            id: "reference-history-1",
            occurredAt: "2026-09-02T00:00:00Z",
            operator: {
              name: "Reference Operator",
              account: "reference-operator",
            },
            changes: [
              {
                field: "drawing",
                before: null,
                after: "reference-admission.txt",
              },
            ],
          },
        ],
  basic: {
    ticketKindLabel: "Reference day ticket",
    performanceTypeLabel: "Reference concert",
    translations: {
      ko: {
        title: `Reference Performance ${number}`,
        subtitle: "",
        performers: "Reference Performer",
        organizer: "Reference Organizer",
      },
      ja: {
        title: `Reference Performance ${number} (JA)`,
        subtitle: "",
        performers: "Reference Performer (JA)",
        organizer: "Reference Organizer (JA)",
      },
      en: {
        title: `Reference Performance ${number} (EN)`,
        subtitle: "",
        performers: "Reference Performer (EN)",
        organizer: "Reference Organizer (EN)",
      },
    },
    sessions: [1, 2].map((session) => ({
      id: `reference-session-${session}`,
      number: session,
      startsAt: `2026-09-0${session}T05:00:00Z`,
      endsAt: `2026-09-0${session}T07:00:00Z`,
      soldSeats: 150,
      unsoldSeats: 50,
    })),
    events: [
      {
        id: "reference-event-1",
        name: "Reference Sound Check",
        startsAt: "2026-09-01T04:30:00Z",
        endsAt: "2026-09-01T04:40:00Z",
      },
    ],
    venueName: number === 1 ? "Reference Hall A" : "Reference Hall B",
    gates: [
      { id: "reference-gate-a", name: "Reference Gate A" },
      { id: "reference-gate-b", name: "Reference Gate B" },
    ],
    totalSeats: 200,
    grades: [
      { id: "reference-grade-1", name: "Reference Grade A" },
      { id: "reference-grade-2", name: "Reference Grade B" },
    ],
  },
}));

export function readPerformanceDetail(id: string): Promise<PerformanceDetail> {
  return Promise.resolve().then(() => {
    const detail = details.find((entry) => entry.id === id);
    if (!detail)
      throw new ApiError({
        kind: "not-found",
        message: "예시 공연 조회 대상이 없습니다.",
      });
    return detail;
  });
}
