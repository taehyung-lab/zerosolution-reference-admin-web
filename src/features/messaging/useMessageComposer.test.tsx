import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMessageComposer } from "./useMessageComposer";

describe("message intent ownership", () => {
  it("resolves current contacts, preserves the target, changes channel and clears on close", () => {
    const { result, rerender } = renderHook(
      ({ phone }) =>
        useMessageComposer((channel, ids: readonly string[]) =>
          ids
            .filter((id) => id === "one")
            .map(() => ({
              name: "Member",
              address: channel === "sms" ? phone : "member@example.com",
            })),
        ),
      { initialProps: { phone: "01012345678" } },
    );
    expect(result.current.message).toBeUndefined();
    act(() => result.current.openMessage("sms", ["one", "missing"]));
    expect(result.current.message?.recipients).toEqual([
      { name: "Member", address: "01012345678" },
    ]);
    rerender({ phone: "01087654321" });
    expect(result.current.message?.recipients[0]?.address).toBe("01087654321");
    act(() => result.current.closeMessage());
    expect(result.current.message).toBeUndefined();
    act(() => result.current.openMessage("email", ["one"]));
    expect(result.current.message).toEqual({
      channel: "email",
      recipients: [{ name: "Member", address: "member@example.com" }],
    });
  });

  it("keeps independent consumers independent and permits a single target", () => {
    const { result } = renderHook(() => ({
      first: useMessageComposer((_channel, id: string) => [{ address: id }]),
      second: useMessageComposer((_channel, id: string) => [{ address: id }]),
    }));
    act(() => result.current.first.openMessage("sms", "one"));
    expect(result.current.second.message).toBeUndefined();
    act(() => result.current.second.openMessage("email", "two"));
    act(() => result.current.first.closeMessage());
    expect(result.current.second.message?.recipients).toEqual([
      { address: "two" },
    ]);
  });
});
