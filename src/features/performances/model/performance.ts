// View inputs only. The actual DTO, option identifiers and permission contract are not yet available.
export interface PerformanceRow {
  readonly id: string;
  readonly ticketKind: string;
  readonly performanceType: string;
  readonly title: string;
  readonly sessionCount: number;
  readonly performers: string;
  readonly organizer: string;
  readonly period: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly seller: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}
export interface PerformancePage { readonly rows: readonly PerformanceRow[]; readonly total: number }
export interface PerformanceVenue { readonly id: string; readonly name: string }
