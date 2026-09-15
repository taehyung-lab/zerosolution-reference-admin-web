import { chooseOptionIn } from "@/test/select";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodField } from "./PeriodField";
import { PeriodFilterField } from "./PeriodFilterField";
import { KeywordFilterField } from "./KeywordFilterField";
import { FilterPanel } from "./FilterPanel";
import { FilterField } from "./FilterField";

describe("filter patterns", () => {
  it("exposes the filter disclosure state and controlled region", () => {
    render(
      <FilterPanel
        title="Filters"
        collapseLabel="Collapse filters"
        expandLabel="Expand filters"
        submitLabel="Search"
        resetLabel="Reset"
        onSubmit={vi.fn()}
        onReset={vi.fn()}
      >
        fields
      </FilterPanel>,
    );

    expect(screen.getByRole("form", { name: "Filters" })).toHaveAttribute(
      "novalidate",
    );
    const collapse = screen.getByRole("button", { name: "Collapse filters" });
    const controlsId = collapse.getAttribute("aria-controls");
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId ?? "")).not.toHaveAttribute(
      "hidden",
    );

    fireEvent.click(collapse);

    const expand = screen.getByRole("button", { name: "Expand filters" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(controlsId ?? "")).toHaveAttribute("hidden");
  });

  it("period field opens the calendar for a custom range", () => {
    render(
      <PeriodField
        preset="CUSTOM"
        presets={[
          { value: "ALL", label: "All" },
          { value: "TODAY", label: "Today" },
        ]}
        customLabel="Custom"
        onPresetChange={vi.fn()}
        range={{}}
        fromLabel="From"
        toLabel="To"
        calendarLabel="Calendar"
        onRangeChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "From" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "To" })).toBeInTheDocument();
  });

  it("uses a single-select radio group for period presets", () => {
    const onPresetChange = vi.fn();
    render(
      <PeriodField
        preset="ALL"
        presets={[
          { value: "ALL", label: "All" },
          { value: "YEAR_1", label: "1 year" },
        ]}
        customLabel="Custom"
        onPresetChange={onPresetChange}
        range={{}}
        fromLabel="From"
        toLabel="To"
        calendarLabel="Calendar"
        onRangeChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "1 year" }));
    expect(onPresetChange).toHaveBeenCalledWith("YEAR_1");
    expect(
      screen.queryByRole("radio", { name: "6 months" }),
    ).not.toBeInTheDocument();
  });

  // Notion states date limits as 선택 불가, never as an error message, so each bound bounds the other.
  it("bounds each date input by the other instead of reporting a reversed range", () => {
    render(
      <PeriodField
        preset="CUSTOM"
        presets={[{ value: "ALL", label: "All" }]}
        customLabel="Custom"
        onPresetChange={vi.fn()}
        range={{ from: "2026-08-31", to: "2026-09-01" }}
        fromLabel="From"
        toLabel="To"
        calendarLabel="Calendar"
        onRangeChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("From")).toHaveAttribute("max", "2026-09-01");
    expect(screen.getByLabelText("To")).toHaveAttribute("min", "2026-08-31");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("associates one filter label with a grouped control without wrapping it in label", () => {
    render(
      <FilterField label="Account status">
        {({ labelId }) => (
          <div role="group" aria-labelledby={labelId}>
            controls
          </div>
        )}
      </FilterField>,
    );

    expect(
      screen.getByRole("group", { name: "Account status" }),
    ).toBeInTheDocument();
  });

  it("owns the group wrapper for sibling controls that share one row label", () => {
    render(
      <FilterField label="Period" group>
        {() => (
          <>
            <select aria-label="Criterion">
              <option value="CREATED_AT">Created at</option>
            </select>
            <input aria-label="From" />
          </>
        )}
      </FilterField>,
    );

    const group = screen.getByRole("group", { name: "Period" });
    expect(group).toContainElement(
      screen.getByRole("combobox", { name: "Criterion" }),
    );
    expect(group).toContainElement(screen.getByLabelText("From"));
    expect(document.querySelector("label")).toBeNull();
  });

  it("composes the period filter row with an optional criterion select under one name", async () => {
    const onCriterion = vi.fn();
    const periodProps = {
      preset: "ALL" as const,
      presets: [{ value: "ALL" as const, label: "All" }],
      customLabel: "Custom",
      onPresetChange: vi.fn(),
      range: {},
      onRangeChange: vi.fn(),
      fromLabel: "From",
      toLabel: "To",
      calendarLabel: "Calendar",
    };
    const { rerender } = render(
      <PeriodFilterField
        label="Period"
        criterion={{
          label: "Criterion",
          value: "CREATED_AT",
          options: [
            { value: "CREATED_AT", label: "Created at" },
            { value: "UPDATED_AT", label: "Updated at" },
          ],
          onValueChange: onCriterion,
        }}
        {...periodProps}
      />,
    );
    const group = screen.getByRole("group", { name: "Period" });
    expect(group).toContainElement(
      screen.getByRole("combobox", { name: "Criterion" }),
    );
    expect(group).toContainElement(screen.getByLabelText("From"));
    await chooseOptionIn("Criterion", "Updated at");
    expect(onCriterion).toHaveBeenCalledWith("UPDATED_AT");

    rerender(<PeriodFilterField label="Period" {...periodProps} />);
    expect(
      screen.queryByRole("combobox", { name: "Criterion" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Period" })).toBeInTheDocument();
  });

  it("composes the keyword filter row with an optional target select under one name", async () => {
    const onField = vi.fn();
    render(
      <KeywordFilterField
        label="Keyword"
        field={{
          label: "Target",
          value: "NAME",
          options: [
            { value: "NAME", label: "Name" },
            { value: "ID", label: "ID" },
          ],
          onValueChange: onField,
        }}
        items={[]}
        pendingValue=""
        onPendingValueChange={vi.fn()}
        onAdd={vi.fn()}
        onRemoveAt={vi.fn()}
        addLabel="Add"
        removeLabel={() => "Remove"}
        inputLabel="Keyword input"
        formatItem={(item) => item.value}
      />,
    );
    const group = screen.getByRole("group", { name: "Keyword" });
    expect(group).toContainElement(
      screen.getByRole("combobox", { name: "Target" }),
    );
    expect(group).toContainElement(
      screen.getByRole("textbox", { name: "Keyword input" }),
    );
    await chooseOptionIn("Target", "ID");
    expect(onField).toHaveBeenCalledWith("ID");
  });

  it("keeps the grouped path on a non-label element so no control is falsely associated", () => {
    render(
      <FilterField label="Account status">
        {({ labelId }) => (
          <div role="group" aria-labelledby={labelId}>
            controls
          </div>
        )}
      </FilterField>,
    );

    expect(screen.getByText("Account status").tagName).toBe("SPAN");
    expect(document.querySelector("label")).toBeNull();
  });

  it("names a single native control through label htmlFor", () => {
    render(
      <FilterField label="Permission">
        {({ controlId }) => (
          <select id={controlId}>
            <option value="ALL">All</option>
          </select>
        )}
      </FilterField>,
    );

    expect(
      screen.getByRole("combobox", { name: "Permission" }),
    ).toBeInTheDocument();
  });

  it("turns the label element into label htmlFor when the caller takes the single control path", () => {
    render(
      <FilterField label="Show date">
        {({ controlId }) => <input id={controlId} type="date" />}
      </FilterField>,
    );

    const label = screen.getByText("Show date");
    expect(label.tagName).toBe("LABEL");
    expect(label.getAttribute("for")).toBe(document.querySelector("input")?.id);
  });

  it("stacks the filter label above its control at the same start edge", () => {
    render(
      <FilterField label="Board">
        {({ controlId }) => <input id={controlId} />}
      </FilterField>,
    );

    const row = screen.getByText("Board").parentElement;
    expect(row?.className).toContain("flex-col");
    expect(row?.className).not.toContain("grid-cols-");
  });
});
