import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

function Example() {
  const [value, setValue] = useState("first");
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Content language">
        <TabsTrigger value="first">First</TabsTrigger>
        <TabsTrigger value="second">Second</TabsTrigger>
      </TabsList>
      <TabsContent value="first">First content</TabsContent>
      <TabsContent value="second">Second content</TabsContent>
    </Tabs>
  );
}

it("connects the active panel and moves focus and selection with arrow keys", async () => {
  render(<Example />);
  const first = screen.getByRole("tab", { name: "First" });
  first.focus();
  expect(screen.getByRole("tabpanel", { name: "First" })).toHaveAttribute(
    "id",
    first.getAttribute("aria-controls"),
  );
  fireEvent.keyDown(first, { key: "ArrowRight" });
  await waitFor(() =>
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus(),
  );
  expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("tabpanel", { name: "Second" })).toHaveTextContent(
    "Second content",
  );
  expect(screen.queryByText("First content")).not.toBeInTheDocument();
});
