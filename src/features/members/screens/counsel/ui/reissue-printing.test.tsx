import { ApiError } from "@/api/error";
import { TestLocaleProvider } from "@/test/locale";
import { TestQueryLocaleProvider } from "@/test/query-locale";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reissueInputFixture } from "../../../fixtures/member-records";
import { useMemberCounselData } from "../model/useMemberCounselData";
import { ReissueDialog, type ReissuePrinting } from "./ReissueDialog";
vi.mock(import("../../../fixtures/member-records"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    reissueInputFixture: vi.fn(actual.reissueInputFixture),
  };
});

afterEach(() => vi.resetAllMocks());

const printing: ReissuePrinting = {
  printers: [
    { id: "printer-1", name: "참고 프린터", enabled: true, busy: false },
  ],
  preview: <p>미리보기</p>,
  isPending: false,
  isError: false,
  onRetry: () => undefined,
};

describe("reissue printer supply", () => {
  const view = (state: ReissuePrinting) => (
    <TestLocaleProvider>
      <ReissueDialog {...state} onClose={vi.fn()} onRequest={vi.fn()} />
    </TestLocaleProvider>
  );

  it("does not offer an empty printer choice while the printers are loading", () => {
    render(view({ ...printing, printers: [], isPending: true }));
    expect(screen.getByText("옵션을 불러오는 중입니다.")).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "스마트프린터 선택" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "발권 시작하기" }),
    ).toBeDisabled();
  });

  it("separates a failed printer read from 'no printer' and recovers on retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      view({ ...printing, printers: [], isError: true, onRetry }),
    );
    expect(screen.getByText("옵션을 불러오지 못했습니다.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "스마트프린터 선택 다시 시도" }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(view(printing));
    expect(
      screen.queryByRole("button", { name: "스마트프린터 선택 다시 시도" }),
    ).toBeNull();
    expect(
      screen.getByRole("combobox", { name: "스마트프린터 선택" }),
    ).toBeVisible();
  });
});

describe("counsel data printer read", () => {
  it("reports the failed printer read and refills the choice after a retry", async () => {
    const original = vi.mocked(reissueInputFixture).getMockImplementation()!;
    const read = vi.mocked(reissueInputFixture).mockImplementation(() => {
      throw new ApiError({ kind: "network", message: "test" });
    });
    const { result } = renderHook(() => useMemberCounselData(undefined), {
      wrapper: TestQueryLocaleProvider,
    });
    await waitFor(() => expect(result.current.printing.isError).toBe(true));
    expect(result.current.printing.printers).toEqual([]);
    read.mockImplementation(original);
    act(() => result.current.printing.onRetry());
    await waitFor(() =>
      expect(result.current.printing.printers).toHaveLength(1),
    );
    expect(result.current.printing.isError).toBe(false);
  });

  it("keeps the already-read printers usable when a later refresh fails", async () => {
    const read = vi.mocked(reissueInputFixture);
    const original = read.getMockImplementation()!;
    const { result } = renderHook(() => useMemberCounselData(undefined), {
      wrapper: TestQueryLocaleProvider,
    });
    await waitFor(() =>
      expect(result.current.printing.printers).toHaveLength(1),
    );
    read.mockImplementationOnce(() => {
      throw new ApiError({ kind: "network", message: "refresh" });
    });
    act(() => result.current.printing.onRetry());
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(result.current.printing.isError).toBe(false);
    expect(result.current.printing.isPending).toBe(false);
    expect(result.current.printing.printers).toHaveLength(1);
    read.mockImplementation(original);
  });
});
