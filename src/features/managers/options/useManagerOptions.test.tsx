import { TestLocaleProvider } from "@/test/locale";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  useManagerAgencyOptions,
  useManagerPermissionOptions,
  useManagerTypeOptions,
} from "./useManagerOptions";

const optionRequests = vi.hoisted(() => ({
  agencies: vi.fn(),
  permissions: vi.fn(),
  types: vi.fn(),
}));

vi.mock("../api/queries", () => ({
  managerAgencyOptionsQuery: (locale: string) => ({
    queryKey: ["agency-options", locale],
    queryFn: optionRequests.agencies,
  }),
  managerPermissionOptionsQuery: (
    locale: string,
    type: string | undefined,
  ) => ({
    queryKey: ["permission-options", locale, type ?? null],
    queryFn: optionRequests.permissions,
    enabled: type !== undefined,
  }),
  managerTypeOptionsQuery: (locale: string) => ({
    queryKey: ["type-options", locale],
    queryFn: optionRequests.types,
  }),
}));

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <TestLocaleProvider>{children}</TestLocaleProvider>
      </QueryClientProvider>
    );
  };
}

describe("manager option hooks", () => {
  it("maps supported manager types for select consumers", async () => {
    optionRequests.types.mockResolvedValue([
      { id: "INTERNAL", name: "내부담당자" },
      { name: "식별자 없음" },
    ]);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(useManagerTypeOptions, {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(result.current.data).toEqual([
        { value: "INTERNAL", label: "내부담당자" },
      ]),
    );
  });

  it("maps numeric ids and omits agency options without an id", async () => {
    optionRequests.agencies.mockResolvedValue([
      { id: 7, name: "부스터랩" },
      { name: "식별자 없음" },
    ]);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(useManagerAgencyOptions, {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(result.current.data).toEqual([{ value: "7", label: "부스터랩" }]),
    );
  });

  it("does not fetch permissions until a manager type is selected", async () => {
    optionRequests.permissions.mockResolvedValue([
      { id: 1, name: "일반관리자" },
    ]);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result, rerender } = renderHook(
      ({ type }: { type: "INTERNAL" | undefined }) =>
        useManagerPermissionOptions(type),
      {
        initialProps: { type: undefined as "INTERNAL" | undefined },
        wrapper: createWrapper(client),
      },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(optionRequests.permissions).not.toHaveBeenCalled();

    rerender({ type: "INTERNAL" });
    await waitFor(() =>
      expect(result.current.data).toEqual([
        { value: "1", label: "일반관리자" },
      ]),
    );
  });
});
