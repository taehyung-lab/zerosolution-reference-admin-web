import { TestLocaleProvider } from "@/test/locale";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "./RichTextEditor";

describe("email HTML editor", () => {
  it("emits HTML from actual editor input and normalizes an empty document", async () => {
    const onChange = vi.fn();
    function Field() {
      const [value, setValue] = useState("");
      return (
        <>
          <span id="body-label">Body</span>
          <RichTextEditor
            value={value}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
            onBlur={() => undefined}
            labelId="body-label"
            control={{ id: "body-editor", "aria-invalid": false }}
          />
        </>
      );
    }
    render(
      <TestLocaleProvider>
        <Field />
      </TestLocaleProvider>,
    );
    const input = screen.getByRole("textbox", { name: "Body" });
    input.innerHTML = "<p>Hello <strong>member</strong></p>";
    fireEvent.input(input);
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        "<p>Hello <strong>member</strong></p>",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "목록" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "목록" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(input.querySelector("ul")).toBeInTheDocument();
    input.innerHTML = "<p><br></p>";
    fireEvent.input(input);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(""));
  });
});
