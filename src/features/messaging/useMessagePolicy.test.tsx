import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "@/api/error";
import { TestQueryLocaleProvider } from "@/test/query-locale";
import { messagePolicyFixture } from "./fixtures/message-policy";
vi.mock(import("./fixtures/message-policy"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    messagePolicyFixture: vi.fn(actual.messagePolicyFixture),
  };
});
import { useMessagePolicy } from "./useMessagePolicy";

afterEach(() => vi.resetAllMocks());

it("asks for nothing until a channel is open and then answers with that channel's sender", async () => {
  const read = vi.mocked(messagePolicyFixture);
  const initialProps: { channel: "sms" | "email" | undefined } = {
    channel: undefined,
  };
  const { result, rerender } = renderHook(
    ({ channel }: typeof initialProps) => useMessagePolicy(channel),
    { initialProps, wrapper: TestQueryLocaleProvider },
  );
  expect(read).not.toHaveBeenCalled();
  expect(result.current.data).toBeUndefined();
  rerender({ channel: "email" });
  await waitFor(() =>
    expect(result.current.data?.senderAddress).toBe("sender@example.test"),
  );
  rerender({ channel: "sms" });
  await waitFor(() =>
    expect(result.current.data?.senderAddress).toBe("0200000000"),
  );
});

it("reports a failed policy load as an error the caller can retry instead of an empty sender", async () => {
  const original = vi
    .mocked(messagePolicyFixture)
    .getMockImplementation()!;
  const read = vi.mocked(messagePolicyFixture).mockImplementation(() => {
    throw new ApiError({ kind: "network", message: "test" });
  });
  const { result } = renderHook(() => useMessagePolicy("sms"), {
    wrapper: TestQueryLocaleProvider,
  });
  await waitFor(() => expect(result.current.state).toBe("error"));
  expect(result.current.data).toBeUndefined();
  read.mockImplementation(original);
  await act(async () => {
    await result.current.retry();
  });
  await waitFor(() => expect(result.current.state).toBe("ready"));
  expect(result.current.data?.senderName).toBe("REFERENCE");
});
