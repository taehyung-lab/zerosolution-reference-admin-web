import { expect, test } from "@playwright/test";

/** 필터 form 의 접근 이름은 모든 목록에서 `검색` 하나다(shared:filter.title). */
const FILTER_FORM_NAME = "검색";

for (const path of [
  "/managers",
  "/members/active/all",
  "/members/active/general",
  "/members/active/flagged",
  "/members/dormant",
  "/members/withdrawn",
  "/members/access",
  "/members/counsel",
  "/members/appeals",
  "/performances",
  "/performances/contents",
  "/community/boards",
  "/community/posts",
  "/ticketing/issues",
  "/ticketing/printers",
  "/terms",
]) {
  test(`@reference search/defaults preserve view, double reset and history: ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const immediate = [
      "/members/counsel",
      "/members/appeals",
      "/performances",
      "/performances/contents",
      "/community/boards",
      "/community/posts",
      "/ticketing/printers",
      "/terms",
    ].includes(path);
    await expect(page.getByRole("table")).toHaveCount(immediate ? 1 : 0);
    await page
      .getByRole("form", { name: FILTER_FORM_NAME, exact: true })
      .getByRole("button", { name: "검색", exact: true })
      .click();
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("combobox", { name: "보기", exact: true }).click();
    await page.getByRole("option", { name: "200", exact: true }).click();
    await expect(page).toHaveURL(/pageSize=200/);
    await page.getByRole("combobox", { name: "정렬", exact: true }).click();
    const changedSort = await page.getByRole("option").nth(1).innerText();
    await page.getByRole("option").nth(1).click();
    await expect(
      page.getByRole("combobox", { name: "정렬", exact: true }),
    ).toContainText(changedSort);
    await page
      .getByRole("form", { name: FILTER_FORM_NAME, exact: true })
      .getByRole("button", { name: "검색", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", { name: "보기", exact: true }),
    ).toContainText("200");
    await expect(
      page.getByRole("combobox", { name: "정렬", exact: true }),
    ).toContainText(changedSort);
    const committed = page.url();
    for (let reset = 0; reset < 2; reset++)
      await page.getByRole("button", { name: "초기화", exact: true }).click();
    // 초기화는 최초 진입 계약을 다시 적용한다: 진입에서 조회하던 목록은 초기화 뒤에도 조회 상태다.
    await expect(page.getByRole("table")).toHaveCount(immediate ? 1 : 0);
    expect(new URL(page.url()).search).toBe("");
    await page.goBack();
    await expect(page).toHaveURL(committed);
    await expect(
      page.getByRole("combobox", { name: "보기", exact: true }),
    ).toContainText("200");
    await expect(
      page.getByRole("combobox", { name: "정렬", exact: true }),
    ).toContainText(changedSort);
    await page.goForward();
    await expect(page.getByRole("table")).toHaveCount(immediate ? 1 : 0);
  });
}

const explicitPaths = [
  "/managers",
  "/members/active/all",
  "/members/active/general",
  "/members/active/flagged",
  "/members/dormant",
  "/members/withdrawn",
  "/members/access",
];
for (const path of explicitPaths) {
  test(`@reference explicit URL intent and recovery: ${path}`, async ({
    page,
  }) => {
    await page.goto(path + "?page=wrong&searched=false");
    await expect(page).toHaveURL(new RegExp(path + "$"));
    await expect(page.getByRole("table")).toHaveCount(0);
    await page
      .getByRole("form", { name: "검색", exact: true })
      .getByRole("button", { name: "검색", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(path + "\\?searched=true$"));
    await expect(page.getByRole("table")).toHaveCount(1);
    await page
      .getByRole("textbox", { name: "검색어", exact: true })
      .fill("uncommitted@example.test");
    await page.getByLabel("시작일", { exact: true }).fill("2026-09-01");
    await page.goBack();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "검색어", exact: true }),
    ).toHaveValue("");
    await expect(page.getByLabel("시작일", { exact: true })).toHaveValue("");
    await page.goForward();
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(
      page.getByRole("textbox", { name: "검색어", exact: true }),
    ).toHaveValue("");
    await page.reload();
    await expect(page.getByRole("table")).toHaveCount(1);
    // `searched=false` 는 초기화 커밋이라 다른 조건이 있어도 검색 전 URL 로 돌아간다.
    await page.goto(path + "?searched=false&pageSize=200");
    await expect(page).toHaveURL(new RegExp(path + "$"));
    await expect(page.getByRole("table")).toHaveCount(0);
    await page.goto(path + "?pageSize=200");
    await expect(
      page.getByRole("combobox", { name: "보기", exact: true }),
    ).toContainText("200");
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(page).toHaveURL(/searched=true/);
    await page.goto(path);
    await expect(page.getByRole("table")).toHaveCount(0);
  });
}

for (const path of [
  "/members/counsel",
  "/members/appeals",
  "/community/boards",
  "/community/posts",
  "/terms",
]) {
  test(`@reference immediate URL ignores search intent: ${path}`, async ({
    page,
  }) => {
    for (const marker of ["true", "false"]) {
      await page.goto(path + "?searched=" + marker + "&page=wrong");
      await expect(page).toHaveURL(new RegExp(path + "$"));
      await expect(page.getByRole("table")).toHaveCount(1);
    }
    await page
      .getByRole("form", { name: FILTER_FORM_NAME, exact: true })
      .getByRole("button", { name: "검색", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(path + "$"));
    await expect(page.getByRole("table")).toHaveCount(1);
  });
}

for (const path of [
  ...explicitPaths,
  "/members/counsel",
  "/members/appeals",
  "/performances",
  "/performances/contents",
  "/community/boards",
  "/community/posts",
  "/ticketing/issues",
  "/ticketing/printers",
  "/terms",
]) {
  test(`@reference closed dates recover URL and submitted drafts: ${path}`, async ({
    page,
  }) => {
    await page.goto(
      path + "?pageSize=200&startDateTime=2026-09-01T00%3A00%3A00Z",
    );
    await expect(page).not.toHaveURL(/startDateTime|endDateTime/);
    await expect(
      page.getByRole("combobox", { name: "보기", exact: true }),
    ).toContainText("200");
    const form = page.getByRole("form", {
      name: FILTER_FORM_NAME,
      exact: true,
    });
    const start = page.getByLabel("시작일", { exact: true });
    const end = page.getByLabel("종료일", { exact: true });
    for (const bound of [start, end]) {
      await bound.fill("2026-09-01");
      await expect(bound).toHaveValue("2026-09-01");
      await form.getByRole("button", { name: "검색", exact: true }).click();
      await expect(start).toHaveValue("");
      await expect(end).toHaveValue("");
      await expect(
        page.getByRole("radio", { name: "전체", exact: true }),
      ).toBeChecked();
      await expect(page).not.toHaveURL(/startDateTime|endDateTime/);
    }
    await start.fill("2026-08-01");
    await end.fill("2026-09-02");
    await form.getByRole("button", { name: "검색", exact: true }).click();
    await expect(page).toHaveURL(/startDateTime/);
    await expect(page).toHaveURL(/endDateTime/);
    await expect(start).toHaveValue("2026-08-01");
    await expect(end).toHaveValue("2026-09-02");
    await page.reload();
    await expect(start).toHaveValue("2026-08-01");
    await expect(end).toHaveValue("2026-09-02");
  });
}
