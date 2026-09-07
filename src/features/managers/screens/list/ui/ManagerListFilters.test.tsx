import { TestLocaleProvider } from "@/test/locale";
import { chooseOptionIn } from "@/test/select";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagerRouteSearch } from "../model/search-schema";
import { useManagerListFilter } from "../model/useManagerListFilter";
import { ManagerListFilters } from "./ManagerListFilters";

const { getManagerTypes } = vi.hoisted(() => ({
  getManagerTypes: vi.fn().mockResolvedValue([
    { id: "AGENCY", name: "서버 기획사" },
    { id: "UNKNOWN", name: "알 수 없는 유형" },
    { id: "VENDOR", name: "서버 예매처" },
  ]),
}));

vi.mock("@/api/generated/endpoints", () => ({ getManagerTypes }));

function Providers({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TestLocaleProvider>{children}</TestLocaleProvider>
    </QueryClientProvider>
  );
}

function FilterHarness({
  search = {},
  onSearchChange,
}: {
  readonly search?: ManagerRouteSearch;
  readonly onSearchChange: (next: ManagerRouteSearch) => void;
}) {
  const filter = useManagerListFilter({ search, onSearchChange });
  return <ManagerListFilters filter={filter} />;
}

describe("ManagerListFilters", () => {
  beforeEach(() => getManagerTypes.mockClear());

  it("keeps all controls in draft until one explicit search commit", async () => {
    const onSearchChange = vi.fn();
    render(
      <Providers>
        <FilterHarness onSearchChange={onSearchChange} />
      </Providers>,
    );

    const vendorType = await screen.findByRole("checkbox", {
      name: "서버 예매처",
    });
    fireEvent.click(vendorType);
    expect(onSearchChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "manager-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith({
      types: ["AGENCY"],
      keywords: [{ keywordType: "ID", keyword: "manager-1" }],
      periodType: "CREATED_AT",
    });
  });

  it("renders the server-provided manager type names as labels", async () => {
    render(
      <Providers>
        <FilterHarness onSearchChange={vi.fn()} />
      </Providers>,
    );

    expect(
      await screen.findByRole("checkbox", { name: "서버 기획사" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "서버 예매처" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "알 수 없는 유형" }),
    ).not.toBeInTheDocument();
    expect(getManagerTypes).toHaveBeenCalledWith();
  });

  it("shows an explicit feature-owned error when manager type options fail", async () => {
    getManagerTypes.mockRejectedValueOnce(new Error("failed"));

    render(
      <Providers>
        <FilterHarness onSearchChange={vi.fn()} />
      </Providers>,
    );

    expect(
      await screen.findByRole("alert", { name: "유형" }),
    ).toBeInTheDocument();
    expect(screen.getByText("옵션을 불러오지 못했습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "유형 다시 시도" }),
    ).toBeInTheDocument();
  });

  it("clears the stale bound when a typed date would reverse the range", async () => {
    const onSearchChange = vi.fn();
    render(
      <Providers>
        <FilterHarness onSearchChange={onSearchChange} />
      </Providers>,
    );

    await screen.findByRole("checkbox", { name: "서버 기획사" });
    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(screen.getByLabelText("시작일")).toHaveValue("");
    expect(screen.getByLabelText("종료일")).toHaveValue("2026-08-31");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onSearchChange).toHaveBeenCalledTimes(1);
  });

  it("uses localized field labels in committed keyword chips", async () => {
    render(
      <Providers>
        <FilterHarness onSearchChange={vi.fn()} />
      </Providers>,
    );

    await screen.findByRole("checkbox", { name: "서버 기획사" });
    await chooseOptionIn("검색어 구분", "휴대폰번호");
    fireEvent.change(screen.getByRole("textbox", { name: "검색어" }), {
      target: { value: "010" },
    });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("휴대폰번호 : 010 ×")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "기간 기준" }),
    ).toBeInTheDocument();
  });
});
