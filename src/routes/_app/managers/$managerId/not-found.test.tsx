import { clearAccessToken, setAccessToken } from "@/api/http/credential";
import { AppProviders, createQueryClient } from "@/app/providers/AppProviders";
import { createAppRouter } from "@/app/router/router";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

afterEach(() => clearAccessToken());

function renderAt(path: string) {
  setAccessToken("route-test");
  const queryClient = createQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

it("없는 운영자 ID 는 loader 에서 not-found 가 되어 route 404 페이지를 그리고 화면 헤더를 만들지 않는다", async () => {
  renderAt("/managers/does-not-exist");
  expect(await screen.findByRole("heading", { name: "찾을 수 없습니다" })).toBeVisible();
  expect(screen.getByText("요청한 정보를 찾을 수 없습니다.")).toBeVisible();
  expect(screen.queryByRole("heading", { name: "운영자 조회" })).not.toBeInTheDocument();
  // _app 이 notFoundComponent 를 선언하므로 셸(LNB)은 남는다.
  expect(screen.getByRole("navigation", { name: /./ })).toBeInTheDocument();
});

it("있는 운영자는 loader 가 채운 캐시로 상세를 바로 그린다", async () => {
  renderAt("/managers/example-active");
  expect(await screen.findByRole("heading", { name: "운영자 조회" })).toBeVisible();
});

it("없는 URL 은 route 없음 문구의 404 페이지다", async () => {
  renderAt("/definitely-not-a-route");
  expect(await screen.findByRole("heading", { name: "찾을 수 없습니다" })).toBeVisible();
  expect(screen.getByText("페이지를 찾을 수 없습니다.")).toBeVisible();
});
