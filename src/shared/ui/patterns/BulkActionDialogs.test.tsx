import { useConfirmation } from "@/shared/model/use-confirmation";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/shared/i18n/i18n";
import {
  BulkActionDialogs,
  SelectionAlert,
} from "./BulkActionDialogs";
import { useSelectionGate } from "@/shared/model/use-selection-gate";

describe("useConfirmation", () => {
  it("lets one gate reject different actions without requiring confirmation", () => {
    const run = vi.fn();
    function Harness({ count }: { readonly count: number }) {
      const gate = useSelectionGate(count);
      return (
        <>
          <button
            onClick={() => {
              if (gate.requireSelection("Choose recipients")) run();
            }}
          >
            Send
          </button>
          <button
            onClick={() => {
              if (gate.requireSelection("Choose rows")) run();
            }}
          >
            Copy
          </button>
          <SelectionAlert controller={gate} />
        </>
      );
    }
    const { rerender } = render(<Harness count={0} />, {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Choose recipients");
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Choose rows");
    expect(run).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    rerender(<Harness count={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("freezes values for confirmation and runs exactly those values", () => {
    const run = vi.fn();
    const values = { status: "flagged" };
    const { result } = renderHook(() => useConfirmation({ run }));

    act(() => {
      result.current.requestConfirmation(values);
    });
    act(() => result.current.confirm());

    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith(values);
    expect(result.current.state.kind).toBe("closed");
  });

  it("renders caller confirmation copy and discards values on cancel", () => {
    const run = vi.fn();
    function Harness() {
      const bulk = useConfirmation({ run });
      return (
        <>
          <button onClick={() => bulk.requestConfirmation({ value: 1 })}>
            Change
          </button>
          <BulkActionDialogs
            controller={bulk}
            confirmDescription="Some rows cannot change. Continue?"
          />
        </>
      );
    }
    render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Some rows cannot change. Continue?",
    );
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();
  });
});
