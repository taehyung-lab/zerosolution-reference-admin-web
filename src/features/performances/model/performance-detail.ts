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
  /**
   * 그 공연장으로 등록된 게이트. 입장안내 편집의 게이트 선택지이고 수명이 레코드와 같아
   * 별도 조회가 아니라 상세 레코드가 싣는다(원문 「입장안내정보를 수정할 수 있다」 —
   * `해당 공연에 설정된 공연장으로 등록된 게이트 리스트 중 택1`).
   */
  readonly gates: readonly { readonly id: string; readonly name: string }[];
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

/**
 * 입장안내정보 저장 입력. 실제 DTO·식별자 계약은 미확인이라(PERF-EDIT-ADMISSION 미확인 4·5)
 * 화면이 관찰한 값만 싣는다 — 도면은 교체 여부와 파일, 가이드는 게이트와 그 게이트가 안내할
 * 구역(1개) 또는 등급(다중)이다.
 */
export interface PerformanceAdmissionSettings {
  readonly inputMode: PerformanceAdmission["inputMode"];
  readonly drawing:
    | { readonly kind: "kept" }
    | { readonly kind: "selected"; readonly file: File };
  readonly guides: readonly {
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
