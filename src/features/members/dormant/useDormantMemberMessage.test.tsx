import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDormantMemberMessage } from "./useDormantMemberMessage";
import { useAppealListMessage } from "../appeals/useAppealListMessage";

describe.each([
  { label: "dormant", useMessage: useDormantMemberMessage, id: "dormant-1" },
  { label: "appeal", useMessage: useAppealListMessage, id: "appeal-1" },
])("$label member message ownership", ({ useMessage, id }) => {
  it("resolves selected contacts by channel and clears the intent on close", () => {
    const { result } = renderHook(useMessage);
    expect(result.current.message).toBeUndefined();
    act(() => result.current.openMessage("sms", [id, "missing-id"]));
    expect(result.current.message).toMatchObject({
      channel: "sms",
      recipients: [{ address: "01012345678" }],
    });
    expect(result.current.message?.recipients).toHaveLength(1);
    act(() => result.current.closeMessage());
    expect(result.current.message).toBeUndefined();
    act(() => result.current.openMessage("email", [id]));
    expect(result.current.message).toMatchObject({
      channel: "email",
      recipients: [{ address: "reference@example.com" }],
    });
  });
});
