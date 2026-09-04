import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/shared/i18n/i18n";
import { Badge } from "./Badge";
import { Calendar } from "./Calendar";
import { Checkbox } from "./Checkbox";
import { Combobox } from "./Combobox";
import { chooseOption } from "@/test/select";
import { MultiSelect } from "./MultiSelect";
import { Popover } from "./Popover";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";
import { Select } from "./Select";
import { Table, TableCell, TableHead } from "./Table";
describe("shared primitives", () => {
  it("checkbox exposes mixed state", () => {
    render(<Checkbox aria-label="check" indeterminate />);
    expect(screen.getByLabelText("check")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });
  it("groups native radios and reports changes through the group contract", () => {
    const change = vi.fn();
    render(
      <RadioGroup label="Period" value="a" onValueChange={change}>
        <RadioGroupItem value="a">A</RadioGroupItem>
        <RadioGroupItem value="b">B</RadioGroupItem>
      </RadioGroup>,
    );

    const radios = screen.getAllByRole("radio");
    const groupName = radios[0]?.getAttribute("name");
    expect(groupName).toBeTruthy();
    expect(radios[1]).toHaveAttribute("name", groupName);
    expect(screen.getByRole("group", { name: "Period" })).toBeInTheDocument();

    const secondRadio = screen.getByRole("radio", { name: "B" });
    secondRadio.focus();
    expect(secondRadio).toHaveFocus();
    expect(
      secondRadio.closest("label")?.querySelector('[aria-hidden="true"]'),
    ).toHaveClass("size-4", "invisible", "peer-checked:visible");

    fireEvent.click(secondRadio);
    expect(change).toHaveBeenCalledWith("b");
  });
  it("select supports a single nullable value", async () => {
    const change = vi.fn();
    render(
      <Select
        aria-label="select"
        value={null}
        onValueChange={change}
        options={[{ value: "a", label: "A" }]}
        placeholder="None"
      />,
    );
    await chooseOption(screen.getByRole("combobox", { name: "select" }), "A");
    expect(change).toHaveBeenCalledWith("a");
  });
  it("select stays controlled when its public value changes from null", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const props = {
        "aria-label": "select",
        onValueChange: vi.fn(),
        options: [{ value: "a", label: "A" }],
        placeholder: "None",
      } as const;
      const { rerender } = render(<Select {...props} value={null} />);

      rerender(<Select {...props} value="a" />);

      expect(warn).not.toHaveBeenCalledWith(
        expect.stringContaining("changing from uncontrolled to controlled"),
      );
    } finally {
      warn.mockRestore();
    }
  });
  it("multiselect removes a selected token", () => {
    const change = vi.fn();
    render(
      <MultiSelect
        values={["a"]}
        onValueChange={change}
        options={[{ value: "a", label: "A" }]}
        getRemoveLabel={() => "remove"}
      />,
    );
    fireEvent.click(screen.getByLabelText("remove"));
    expect(change).toHaveBeenCalledWith([]);
  });
  it("popover escapes and restores trigger focus", async () => {
    render(
      <Popover trigger={<button>open</button>} contentLabel="content">
        content
      </Popover>,
    );
    const trigger = screen.getByText("open");
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toHaveTextContent("content");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
  it("popover dismisses on outside click", async () => {
    render(
      <>
        <button>outside</button>
        <Popover trigger={<button>open</button>} contentLabel="content">
          content
        </Popover>
      </>,
    );
    fireEvent.click(screen.getByText("open"));
    fireEvent.mouseDown(screen.getByText("outside"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("popover reports outside dismissal to a controlled owner", async () => {
    const onOpenChange = vi.fn();
    render(
      <>
        <button>outside</button>
        <Popover
          open
          onOpenChange={onOpenChange}
          trigger={<button>open</button>}
          contentLabel="content"
        >
          content
        </Popover>
      </>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("outside"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
  it("combobox trigger collapses its expanded state after outside dismissal", async () => {
    render(
      <>
        <button>outside</button>
        <Combobox
          value={null}
          onValueChange={vi.fn()}
          options={[{ value: "a", label: "A" }]}
          searchValue=""
          onSearchValueChange={vi.fn()}
          placeholder="Choose"
          searchLabel="Search"
          emptyLabel="Empty"
        />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Choose" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("outside"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
  it("calendar preserves the selected local date in a positive UTC offset", () => {
    const change = vi.fn();
    // The locale is explicit because the app's i18n instance is not registered as
    // react-i18next's default, so a provider-less render would silently fall back to an
    // uninitialised English instance and the day names would be accidental.
    const localized = i18n.cloneInstance({ lng: "en" });
    // The value pins the rendered month so the assertion does not depend on today's date.
    render(
      <I18nextProvider i18n={localized}>
        <Calendar value="2026-08-15" onValueChange={change} />
      </I18nextProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Saturday, August 1st, 2026" }),
    );
    expect(change).toHaveBeenCalledWith("2026-08-01");
  });

  it("opens the month that contains the current value", () => {
    const localized = i18n.cloneInstance({ lng: "en" });
    render(
      <I18nextProvider i18n={localized}>
        <Calendar value="2026-08-15" onValueChange={vi.fn()} />
      </I18nextProvider>,
    );
    // react-day-picker marks the selection inside the day's accessible name.
    expect(
      screen.getByRole("button", { name: "Saturday, August 15th, 2026, selected" }),
    ).toBeInTheDocument();
  });
  it("localizes calendar navigation for the active UI locale", () => {
    const localized = i18n.cloneInstance({ lng: "ko" });
    render(
      <I18nextProvider i18n={localized}>
        <Calendar value="2026-08-01" onValueChange={vi.fn()} />
      </I18nextProvider>,
    );

    expect(screen.getByRole("button", { name: "이전 달" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 달" })).toBeInTheDocument();
  });
  it("disables dates outside caller-owned range bounds", () => {
    const localized = i18n.cloneInstance({ lng: "en" });
    render(
      <I18nextProvider i18n={localized}>
        <Calendar
          value="2026-08-15"
          min="2026-08-10"
          max="2026-08-20"
          onValueChange={vi.fn()}
        />
      </I18nextProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Sunday, August 9th, 2026" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Friday, August 21st, 2026" }),
    ).toBeDisabled();
  });
  it("table keeps semantic elements", () => {
    render(
      <Table>
        <thead>
          <tr>
            <TableHead>H</TableHead>
          </tr>
        </thead>
        <tbody>
          <tr>
            <TableCell>C</TableCell>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  it("badge applies a tone", () => {
    render(<Badge tone="success">ok</Badge>);
    expect(screen.getByText("ok")).toHaveClass("bg-emerald-100");
  });
});
