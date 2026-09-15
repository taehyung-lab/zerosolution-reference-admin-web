import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPeriodDraft,
  usePeriodDraft,
  type PeriodPreset,
} from "./use-period-draft";

describe("usePeriodDraft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T12:00:00Z"));
    vi.stubEnv("TZ", "UTC");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it.each<PeriodPreset>([
    "ALL",
    "YEAR_1",
    "MONTH_6",
    "MONTH_3",
    "MONTH_1",
    "DAY_7",
    "YESTERDAY",
    "TODAY",
  ])("creates UTC boundaries for the %s preset", (preset) => {
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "committed" }),
    );

    act(() => result.current.setPreset(preset));

    expect(result.current.preset).toBe(preset);
    if (preset === "ALL") {
      expect(result.current.utcRange).toEqual({
        startDateTime: undefined,
        endDateTime: undefined,
      });
    } else {
      expect(result.current.utcRange.startDateTime).toMatch(/T00:00:00\.000Z$/);
      expect(result.current.utcRange.endDateTime).toMatch(/T23:59:59\.999Z$/);
    }
  });

  it("keeps a directly selected range CUSTOM even when it matches TODAY", () => {
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "committed" }),
    );

    act(() =>
      result.current.setRange({ from: "2026-08-28", to: "2026-08-28" }),
    );

    expect(result.current.preset).toBe("CUSTOM");
    expect(result.current.utcRange).toEqual({
      startDateTime: "2026-08-28T00:00:00.000Z",
      endDateTime: "2026-08-28T23:59:59.999Z",
    });
  });

  it("allows two-step date entry and derives ALL when both draft bounds clear", () => {
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "same" }),
    );
    act(() => result.current.setRange({ from: "2026-08-01" }));
    expect(result.current.range).toEqual({ from: "2026-08-01" });
    expect(result.current.preset).toBe("CUSTOM");
    act(() =>
      result.current.setRange({ from: "2026-08-01", to: "2026-08-02" }),
    );
    expect(result.current.utcRange).toEqual({
      startDateTime: "2026-08-01T00:00:00.000Z",
      endDateTime: "2026-08-02T23:59:59.999Z",
    });
    act(() => result.current.setRange({}));
    expect(result.current.range).toEqual({});
    expect(result.current.preset).toBe("ALL");
  });

  it.each([
    ["Asia/Seoul", "2026-03-07T15:00:00.000Z", "2026-03-08T14:59:59.999Z"],
    [
      "America/New_York",
      "2026-03-08T05:00:00.000Z",
      "2026-03-09T03:59:59.999Z",
    ],
  ])("uses local day boundaries for TODAY in %s", (zone, start, end) => {
    vi.stubEnv("TZ", zone);
    vi.setSystemTime(new Date("2026-03-08T12:00:00Z"));
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "same" }),
    );
    act(() => result.current.setPreset("TODAY"));
    expect(result.current.utcRange).toEqual({
      startDateTime: start,
      endDateTime: end,
    });
  });

  it("uses the browser timezone across a DST day and round-trips the display dates", () => {
    vi.stubEnv("TZ", "America/New_York");
    const { result } = renderHook(() =>
      usePeriodDraft({
        committed: {},
        resetKey: "committed",
      }),
    );

    act(() =>
      result.current.setRange({ from: "2026-03-08", to: "2026-03-08" }),
    );

    expect(result.current.preset).toBe("CUSTOM");
    expect(result.current.utcRange).toEqual({
      startDateTime: "2026-03-08T05:00:00.000Z",
      endDateTime: "2026-03-09T03:59:59.999Z",
    });
    expect(result.current.range).toEqual({
      from: "2026-03-08",
      to: "2026-03-08",
    });
    expect(
      createPeriodDraft(result.current.utcRange, "America/New_York"),
    ).toMatchObject({ preset: "CUSTOM" });
  });

  it("converts a browser-local calendar day to UTC request boundaries", () => {
    vi.stubEnv("TZ", "Asia/Seoul");
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "committed" }),
    );

    act(() =>
      result.current.setRange({ from: "2026-08-28", to: "2026-08-28" }),
    );

    expect(result.current.utcRange).toEqual({
      startDateTime: "2026-08-27T15:00:00.000Z",
      endDateTime: "2026-08-28T14:59:59.999Z",
    });
  });

  it("infers a preset only when recreating from an external committed range", () => {
    expect(
      createPeriodDraft(
        {
          startDateTime: "2026-08-28T00:00:00.000Z",
          endDateTime: "2026-08-28T23:59:59.999Z",
        },
        "UTC",
      ),
    ).toEqual({
      preset: "TODAY",
      startDateTime: "2026-08-28T00:00:00.000Z",
      endDateTime: "2026-08-28T23:59:59.999Z",
    });
  });

  it("rebuilds from committed values when a caller discards an uncommitted range", () => {
    const { result } = renderHook(() =>
      usePeriodDraft({ committed: {}, resetKey: "committed" }),
    );

    act(() =>
      result.current.setRange({ from: "2026-09-01", to: "2026-08-31" }),
    );
    act(() => result.current.reset());

    expect(result.current.preset).toBe("ALL");
    expect(result.current.range).toEqual({});
  });
});
