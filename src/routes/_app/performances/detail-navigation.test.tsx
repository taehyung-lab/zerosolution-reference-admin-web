import { clearAccessToken, setAccessToken } from "@/api/http/credential";
import { AppProviders, createQueryClient } from "@/app/providers/AppProviders";
import { createAppRouter } from "@/app/router/router";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

afterEach(() => clearAccessToken());

it("opens the activated performance, then restores list search through back navigation", async () => {
  setAccessToken("route-test");
  const queryClient = createQueryClient();
  const history = createMemoryHistory({
    initialEntries: ["/performances?venueId=reference-venue-b"],
  });
  const router = createAppRouter({ queryClient, history });
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  fireEvent.click(await screen.findByText("Reference Performance 2"));
  await waitFor(() =>
    expect(router.state.location.pathname).toBe(
      "/performances/reference-performance-2",
    ),
  );
  expect(
    await screen.findByRole("heading", { name: "공연 조회" }),
  ).toBeVisible();
  expect(
    await screen.findByText("reference-admission.txt", { selector: "a" }),
  ).toBeVisible();
  history.back();
  await waitFor(() =>
    expect(router.state.location.pathname).toBe("/performances"),
  );
  expect(router.state.location.search).toMatchObject({
    venueId: "reference-venue-b",
  });
  expect(await screen.findByText("Reference Performance 2")).toBeVisible();
  expect(screen.queryByText("Reference Performance 1")).not.toBeInTheDocument();
});
