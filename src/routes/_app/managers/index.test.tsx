// 리허설 API 소비자의 회귀 검증용 route다. 실제 /managers 제품 route는 product-route.test.tsx에서 별도로 검증한다.
vi.mock('@/routes/_app/managers/index', async () => {
  const { createFileRoute, defaultStringifySearch } = await import('@tanstack/react-router');
  const { canonicalSearchGuard } = await import('@/app/router/canonical-search-guard');
  const { managerSearchSchema, managerCanonicalSearchSchema } = await import('@/features/managers/list/model/search-schema');
  const { managerTypeOptionsQuery } = await import('@/features/managers/api/queries');
  const { ManagerApiListScreen } = await import('@/features/managers/list/ManagerApiListScreen');
  const Route = createFileRoute('/_app/managers/')({
    validateSearch: managerSearchSchema,
    beforeLoad: canonicalSearchGuard(managerCanonicalSearchSchema),
    loader: ({ context: { locale, queryClient } }) => { void queryClient.query(managerTypeOptionsQuery(locale)).catch(() => undefined); },
    component: ApiRoute,
  });
  function ApiRoute() {
    const search = managerCanonicalSearchSchema.parse(Route.useSearch());
    const navigate = Route.useNavigate();
    return <ManagerApiListScreen search={search} onSearchChange={next => { void navigate({ href: "/managers" + defaultStringifySearch(next) }); }} />;
  }
  return { Route };
});

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
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { clearAccessToken, setAccessToken } from "@/api/http/credential";

let managerListRequestCount = 0;
let managerTypeRequestCount = 0;
const server = setupServer(
  http.get("/api/v1/managers", () => {
    managerListRequestCount += 1;
    return HttpResponse.json({
      header: { resultCode: 200 },
      data: { list: [], totalCount: 0 },
    });
  }),
  http.get("/api/v1/options/manager-types", () => {
    managerTypeRequestCount += 1;
    return HttpResponse.json({
      header: { resultCode: 200 },
      data: [
        { id: "AGENCY", name: "기획사" },
        { id: "VENDOR", name: "예매처" },
      ],
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// `/_app` 가드는 저장된 토큰을 요구한다. 이 절은 인증된 세션의 라우팅을 검증한다.
beforeEach(() => { setAccessToken("route-test-token"); });
afterEach(() => {
  managerListRequestCount = 0;
  managerTypeRequestCount = 0;
  server.resetHandlers();
  clearAccessToken();
});
afterAll(() => server.close());

async function loadAt(path: string) {
  const router = createAppRouter({
    queryClient: createQueryClient(),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return router.state.location;
}

describe("manager route search canonicalization", () => {
  it("shows result-local loading without the overlay for the first user search", async () => {
    let resolveList: (() => void) | undefined;
    server.use(
      http.get("/api/v1/managers", async () => {
        managerListRequestCount += 1;
        await new Promise<void>((resolve) => {
          resolveList = resolve;
        });
        return HttpResponse.json({
          header: { resultCode: 200 },
          data: { list: [], totalCount: 0 },
        });
      }),
    );
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

    const filterForm = await screen.findByRole("form", { name: "검색" });
    fireEvent.click(within(filterForm).getByRole("button", { name: "검색" }));

    expect(
      await screen.findByText("데이터를 불러오는 중입니다. 잠시만 기다려 주세요."),
    ).toBeVisible();
    expect(screen.queryByText("검색결과 : 0")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    resolveList?.();
  });

  it("blocks only the entry fetch and preserves the table during a sort fetch", async () => {
    const requests: Array<() => void> = [];
    server.use(
      http.get("/api/v1/managers", async () => {
        managerListRequestCount += 1;
        await new Promise<void>((resolve) => requests.push(resolve));
        return HttpResponse.json({
          header: { resultCode: 200 },
          data: {
            list: [
              {
                id: "manager-1",
                name: "Kim",
                createdAt: "2026-08-28T00:00:00Z",
                updatedAt: "2026-08-31T00:00:00Z",
              },
            ],
            totalCount: 1,
          },
        });
      }),
    );
    const queryClient = createQueryClient();
    const router = createAppRouter({
      queryClient,
      history: createMemoryHistory({
        initialEntries: ["/managers?periodType=CREATED_AT"],
      }),
    });

    render(
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "데이터를 불러오는 중입니다",
    );
    await waitFor(() => expect(requests).toHaveLength(1));
    requests[0]?.();
    expect(await screen.findByText("Kim")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "이름" }));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Kim")).toBeVisible();
    requests[1]?.();
  });

  it("prefetches manager type options on the initial sparse URL", async () => {
    await loadAt("/managers");

    await waitFor(() => expect(managerTypeRequestCount).toBe(1));
    expect(managerListRequestCount).toBe(0);
  });

  it("does not block route entry when manager type option warming fails", async () => {
    server.use(
      http.get("/api/v1/options/manager-types", () =>
        HttpResponse.json(
          { header: { resultCode: 500 }, data: null },
          { status: 500 },
        ),
      ),
    );

    await expect(loadAt("/managers")).resolves.toMatchObject({
      href: "/managers",
    });
    expect(managerListRequestCount).toBe(0);
  });

  it("does not fetch the list and renders notSearched on the initial entry", async () => {
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

    expect(
      await screen.findByText("검색 조건을 입력한 뒤 검색해 주세요."),
    ).toBeInTheDocument();
    expect(managerListRequestCount).toBe(0);
    expect(managerTypeRequestCount).toBe(1);
  });

  it("writes only periodType and does not refetch an identical search", async () => {
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
    const filterForm = await screen.findByRole("form", { name: "검색" });
    expect(managerListRequestCount).toBe(0);
    fireEvent.click(within(filterForm).getByRole("button", { name: "검색" }));

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        periodType: "CREATED_AT",
      }),
    );
    await waitFor(() => expect(managerListRequestCount).toBe(1));
    fireEvent.click(within(filterForm).getByRole("button", { name: "검색" }));
    await waitFor(() => expect(managerListRequestCount).toBe(1));
  });

  it("canonicalizes a hand-edited filter by adding periodType exactly once", async () => {
    const statuses = encodeURIComponent(JSON.stringify(["ACTIVE"]));
    const location = await loadAt(`/managers?statuses=${statuses}`);

    expect(location.search).toEqual({
      periodType: "CREATED_AT",
      statuses: ["ACTIVE"],
    });
    expect(location.href).toContain("periodType=CREATED_AT");
  });

  it("restores the pre-search and searched variants through history", async () => {
    const queryClient = createQueryClient();
    const history = createMemoryHistory({ initialEntries: ["/managers"] });
    const router = createAppRouter({ queryClient, history });
    render(
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    const filterForm = await screen.findByRole("form", { name: "검색" });
    fireEvent.click(within(filterForm).getByRole("button", { name: "검색" }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        periodType: "CREATED_AT",
      }),
    );

    history.back();
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(
      await screen.findByText("검색 조건을 입력한 뒤 검색해 주세요."),
    ).toBeInTheDocument();

    history.forward();
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        periodType: "CREATED_AT",
      }),
    );
    expect(await screen.findByText("검색 결과가 없습니다.")).toBeInTheDocument();
    expect(managerListRequestCount).toBe(1);
  });

  it("replaces invalid and unknown query values with an empty URL search", async () => {
    const location = await loadAt(
      "/managers?page=wrong&sortType=createdAt&unknown=value",
    );

    expect(location.search).toEqual({});
    expect(location.href).toBe("/managers");
  });

  it("drops the unexposed AGENCY sort key from a committed URL", async () => {
    const location = await loadAt(
      "/managers?periodType=CREATED_AT&sortType=AGENCY",
    );

    expect(location.search).toEqual({ periodType: "CREATED_AT" });
    expect(location.href).not.toContain("AGENCY");
  });

  it("preserves valid array elements while replacing invalid elements", async () => {
    const types = encodeURIComponent(JSON.stringify(["AGENCY", "BOGUS"]));
    const location = await loadAt(
      `/managers?periodType=CREATED_AT&sortType=CREATED_AT&sortDirection=DESC&types=${types}`,
    );

    expect(location.search).toEqual({
      periodType: "CREATED_AT",
      types: ["AGENCY"],
      sortType: "CREATED_AT",
      sortDirection: "DESC",
    });
    expect(location.href).toContain("CREATED_AT");
  });

  it("removes an array query when none of its elements are valid", async () => {
    const types = encodeURIComponent(JSON.stringify(["BOGUS"]));
    const location = await loadAt(`/managers?types=${types}`);

    expect(location.search).toEqual({});
  });
});
