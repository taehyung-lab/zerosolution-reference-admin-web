export interface AppealBulkChange {
  readonly ids: readonly string[];
  readonly accountStatus: "general" | "flagged";
  readonly restrictions: readonly string[];
}
