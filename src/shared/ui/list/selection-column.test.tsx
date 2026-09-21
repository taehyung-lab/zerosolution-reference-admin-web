import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePageRowSelection } from "@/shared/hooks/use-page-row-selection";
import { DataTable } from "./DataTable";
import { selectionColumn } from "./selection-column";

const rows = [
  { id: "one", allowed: true },
  { id: "two", allowed: true },
  { id: "blocked", allowed: false },
];
function Harness({ view }: { readonly view: string }) {
  const selection = usePageRowSelection({
    rows,
    getId: (row) => row.id,
    isSelectable: (row) => row.allowed,
    resetKey: view,
  });
  return (
    <DataTable
      rows={rows}
      getRowId={(row) => row.id}
      columns={[
        selectionColumn({
          selection,
          pageLabel: "Page",
          rowLabel: (row) => row.id,
          isSelectable: (row) => row.allowed,
        }),
      ]}
    />
  );
}
describe("selection column with its state owner", () => {
  it("keeps mixed/page/disabled state consistent and resets with the committed view", () => {
    const { rerender } = render(<Harness view="first" />);
    expect(screen.getByRole("checkbox", { name: "blocked" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "one" }));
    expect(
      screen.getByRole("checkbox", { name: "Page" }),
    ).toBePartiallyChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Page" }));
    expect(screen.getByRole("checkbox", { name: "Page" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "two" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "blocked" })).not.toBeChecked();
    rerender(<Harness view="next" />);
    expect(screen.getByRole("checkbox", { name: "Page" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "one" })).not.toBeChecked();
  });
});
