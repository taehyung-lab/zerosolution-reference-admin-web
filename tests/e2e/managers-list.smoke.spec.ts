import { expect, test, type Page } from "@playwright/test";

/** The select is a Radix listbox, so a choice is trigger click + option click, not `selectOption`. */
async function choose(page: Page, fieldName: RegExp, optionName: string) {
  await page.getByRole("combobox", { name: fieldName }).click();
  await page.getByRole("option", { name: optionName }).click();
}

async function installRehearsalApi(page: Page) {
  const managerListRequests: URL[] = [];

  await page.route("**/api/v1/options/manager-types**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        header: { resultCode: 200 },
        data: [
          { id: "AGENCY", name: "기획사" },
          { id: "VENDOR", name: "예매처" },
        ],
      }),
    });
  });

  await page.route("**/api/v1/managers?**", async (route) => {
    managerListRequests.push(new URL(route.request().url()));
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        header: { resultCode: 200 },
        data: {
          pageNo: 1,
          pageSize: 100,
          totalCount: 1,
          list: [
            {
              id: "manager-e2e",
              type: { id: "AGENCY", name: "기획사" },
              organization: "BOOSTER LAB",
              name: "테스트 운영자",
              phone: "010-0000-0000",
              permission: { name: "관리자" },
              registrationRoute: { id: "ADMIN", name: "WEB" },
              status: { id: "ACTIVE", name: "승인" },
              createdAt: "2026-08-28T00:00:00Z",
              updatedAt: "2026-08-31T09:00:00Z",
            },
          ],
        },
      }),
    });
  });

  return managerListRequests;
}

test("@smoke managers list commits a draft filter and renders the API result", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const selectControlWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("changing from uncontrolled to controlled")) {
      selectControlWarnings.push(message.text());
    }
  });
  const managerListRequests = await installRehearsalApi(page);
  await page.goto("/managers");

  await expect(page.getByRole("heading", { name: "운영자" })).toBeVisible();
  await expect(
    page.getByText("검색 조건을 입력한 뒤 검색해 주세요."),
  ).toBeVisible();
  expect(managerListRequests).toHaveLength(0);

  const initialUrl = page.url();
  await choose(page, /^기간/, "최근접속일");
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(page.url()).toBe(initialUrl);
  expect(managerListRequests).toHaveLength(0);

  await page
    .getByRole("form", { name: "검색" })
    .getByRole("button", { name: "검색", exact: true })
    .click();

  await expect(
    page.getByText('데이터를 불러오는 중입니다. 잠시만 기다려 주세요.'),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect.poll(() => managerListRequests.length).toBe(1);
  await expect(page).toHaveURL(/periodType=UPDATED_AT/);
  expect(managerListRequests[0]?.searchParams.get("periodType")).toBe(
    "UPDATED_AT",
  );
  expect(managerListRequests[0]?.searchParams.get("pageNo")).toBe("1");
  expect(managerListRequests[0]?.searchParams.get("pageSize")).toBe("100");
  await expect(page.getByText("검색결과 : 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "manager-e2e" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "최근접속일" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "2026-08-31" })).toBeVisible();

  await page.getByRole('button', { name: '이름' }).click();
  await expect.poll(() => managerListRequests.length).toBe(2);
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'manager-e2e' })).toBeVisible();
  await expect(page).toHaveURL(/sortType=NAME/);

  await page
    .getByRole("form", { name: "검색" })
    .getByRole("button", { name: "검색", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(managerListRequests).toHaveLength(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("heading", { name: "운영자" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await page
    .getByRole("form", { name: "검색" })
    .getByRole("button", { name: "초기화" })
    .click();
  await expect(page).toHaveURL(/\/managers\/?$/);
  expect(managerListRequests).toHaveLength(2);
  await expect(page.getByRole("combobox", { name: "기간" })).toContainText(
    "가입일",
  );
  await expect(
    page.getByText("검색 조건을 입력한 뒤 검색해 주세요."),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/periodType=UPDATED_AT/);
  await expect(page.getByRole("combobox", { name: "기간" })).toContainText(
    "최근접속일",
  );
  await expect(page.getByText("검색결과 : 1", { exact: true })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/managers\/?$/);
  await expect(page.getByRole("combobox", { name: "기간" })).toContainText(
    "가입일",
  );
  await expect(
    page.getByText("검색 조건을 입력한 뒤 검색해 주세요."),
  ).toBeVisible();
  expect(selectControlWarnings).toEqual([]);
});
