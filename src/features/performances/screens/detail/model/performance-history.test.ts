import { describe, expect, it } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { toPerformanceHistoryEntries } from "./performance-history";

describe("performance history projection", () => {
  it("does not print unknown field codes, private values, JSON or unchanged value pairs", () => {
    const entries = toPerformanceHistoryEntries(
      [
        {
          id: "history-1",
          occurredAt: "2026-09-01T00:00:00Z",
          operator: null,
          changes: [
            { field: "drawing", before: "same.txt", after: "same.txt" },
            {
              field: "drawing",
              before: { secret: "private-json" },
              after: null,
            },
            {
              field: "private-field-code",
              before: "private-value-before",
              after: "private-value-after",
            },
          ],
        },
      ],
      i18n.getFixedT("ko", "performances"),
    );
    expect(entries[0]?.lines).toEqual([
      "수정",
      "안내 도면",
      "안내 도면",
      "업데이트 사항",
    ]);
    expect(JSON.stringify(entries)).not.toMatch(/private-|same.txt/);
    expect(entries[0]?.manager).toBe("-");
  });
});
