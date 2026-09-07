import { clearAccessToken, setAccessToken } from "@/api/http/credential";
import { AppProviders, createQueryClient } from "@/app/providers/AppProviders";
import { createAppRouter } from "@/app/router/router";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
afterEach(() => clearAccessToken());
it("환경 플래그 없이 제품 검색을 Query로 실행하고 초기화는 검색 전으로 돌아간다", async () => {
  setAccessToken("test");
  const queryClient = createQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: ["/managers"] }),
  });
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  const form = await screen.findByRole("form", { name: "검색" });
  expect(
    queryClient
      .getQueryCache()
      .findAll({ queryKey: ["api", "ko", "managers", "directory"] })
      .every((query) => query.state.fetchStatus === "idle"),
  ).toBe(true);
  fireEvent.click(within(form).getByRole("button", { name: "검색" }));
  expect(await screen.findByText("검색결과 : 105")).toBeVisible();
  expect(router.state.location.search).toMatchObject({
    periodType: "joinedAt",
  });
  fireEvent.click(within(form).getByRole("button", { name: "초기화" }));
  await waitFor(() =>
    expect(screen.queryByRole("table")).not.toBeInTheDocument(),
  );
  expect(
    screen.getByText("검색 조건을 입력한 뒤 검색해 주세요."),
  ).toBeVisible();
});
