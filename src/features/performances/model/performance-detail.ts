import type { UiLocale } from "@/shared/i18n/locale";

// TRANSPLANT_PENDING_PERFORMANCE_DETAIL_CONTRACT: 원문 화면용 입력 모델이다. 실제 DTO·식별자와 이력 공급 계약 확정 후 API 경계에서 대조한다.
export interface PerformanceTranslation {
  readonly title: string;
  readonly subtitle: string;
  readonly performers: string;
  readonly organizer: string;
}

export interface PerformanceBasicInfo {
  readonly ticketKindLabel: string;
  readonly performanceTypeLabel: string;
  readonly translations: Readonly<Record<UiLocale, PerformanceTranslation>>;
  readonly sessions: readonly {
    readonly id: string;
    readonly number: number;
    readonly startsAt: string;
    readonly endsAt: string;
    readonly soldSeats: number;
    readonly unsoldSeats: number;
  }[];
  readonly events: readonly {
    readonly id: string;
    readonly name: string;
    readonly startsAt: string;
    readonly endsAt: string;
  }[];
  readonly venueName: string;
  readonly totalSeats: number;
  readonly grades: readonly { readonly id: string; readonly name: string }[];
}

export interface PerformanceAdmission {
  readonly inputMode: "zone" | "grade";
  readonly drawing: { readonly name: string; readonly url: string };
  readonly guides: readonly {
    readonly id: string;
    readonly gate: string;
    readonly areas: readonly string[];
  }[];
}

export interface PerformanceHistory {
  readonly id: string;
  readonly occurredAt: string;
  readonly operator: { readonly name: string; readonly account: string } | null;
  readonly changes: readonly {
    readonly field: string;
    readonly before: unknown;
    readonly after: unknown;
  }[];
}

export interface PerformanceDetail {
  readonly id: string;
  readonly basic: PerformanceBasicInfo;
  readonly admission: PerformanceAdmission | null;
  readonly history: readonly PerformanceHistory[];
}
