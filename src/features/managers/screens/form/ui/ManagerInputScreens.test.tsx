import { ApiError } from "@/api/error";
import { TestQueryLocaleProvider } from "@/test/query-locale";
import { chooseOptionIn } from "@/test/select";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readManagerDirectoryTypeOptions } from "../../../fixtures/directory-options";
import { findManagerFixture } from "../../../fixtures/managers";
import { toManagerEditDefaults } from "../model/manager-form-defaults";
import {
  ManagerCreateInputScreen,
  ManagerEditInputScreen,
} from "./ManagerInputScreens";

let guardDisabled = true;
const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useBlocker: (options: { disabled: boolean }) => {
    guardDisabled = options.disabled;
    return { status: "idle" };
  },
}));
/** 옵션 응답을 실패시키기 위해 임시 응답 함수만 대체한다. Query 실행 경로는 화면과 같다. */
vi.mock(
  import("../../../fixtures/directory-options"),
  async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      readManagerDirectoryTypeOptions: vi.fn(
        actual.readManagerDirectoryTypeOptions,
      ),
    };
  },
);

/** 옵션은 Query로 도착하므로 select가 나타난 뒤에 고른다. */
async function chooseWhenLoaded(field: string, option: string) {
  await screen.findByRole("combobox", { name: field });
  await chooseOptionIn(field, option);
}

describe("manager request-only forms", () => {
  it("shows first blur mismatch then accepts a corrected Enter submission once", async () => {
    render(
      <TestQueryLocaleProvider>
        <ManagerCreateInputScreen onConfirm={vi.fn()} />
      </TestQueryLocaleProvider>,
    );
    await chooseWhenLoaded("유형", "Example type");
    await chooseWhenLoaded("권한", "Example permission");
    for (const [label, value] of [
      ["아이디*", "operator99"],
      ["비밀번호*", "Safe!729"],
      ["비밀번호 확인*", "wrong"],
      ["이름*", "김"],
      ["휴대폰번호*", "010-1234-5678"],
      ["이메일*", "operator@example.com"],
    ] as const)
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const confirmation = screen.getByLabelText("비밀번호 확인*");
    fireEvent.blur(confirmation);
    expect(await screen.findByRole("alert")).toHaveTextContent("일치");
    fireEvent.change(confirmation, { target: { value: "Safe!729" } });
    fireEvent.submit(confirmation.closest("form")!);
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "저장하시겠습니까?",
    );
  });
  it("validates, confirms and preserves dirty input without a saved acknowledgement", async () => {
    const onConfirm = vi.fn();
    render(
      <TestQueryLocaleProvider>
        <ManagerCreateInputScreen onConfirm={onConfirm} />
      </TestQueryLocaleProvider>,
    );
    await screen.findByRole("combobox", { name: "유형" });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "유형" })).toHaveFocus(),
    );
    await chooseOptionIn("유형", "Example type");
    await chooseWhenLoaded("권한", "Example permission");
    for (const [label, value] of [
      ["아이디*", "operator99"],
      ["비밀번호*", "Safe!729"],
      ["비밀번호 확인*", "Safe!729"],
      ["이름*", "김"],
      ["휴대폰번호*", "010-1234-5678"],
      ["이메일*", "operator@example.com"],
    ])
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "operator99", name: "김" }),
    );
    expect(screen.queryByText("저장되었습니다.")).not.toBeInTheDocument();
    expect(guardDisabled).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("restores clean state and clears permission after changing type", async () => {
    const record = findManagerFixture("example-active")!;
    render(
      <TestQueryLocaleProvider>
        <ManagerEditInputScreen
          managerId="example-active"
          defaults={toManagerEditDefaults(record.detail)}
          onConfirm={vi.fn()}
        />
      </TestQueryLocaleProvider>,
    );
    expect(guardDisabled).toBe(true);
    fireEvent.change(screen.getByLabelText("이름*"), {
      target: { value: "Changed" },
    });
    expect(guardDisabled).toBe(false);
    fireEvent.change(screen.getByLabelText("이름*"), {
      target: { value: record.detail.name },
    });
    expect(guardDisabled).toBe(true);
    await chooseWhenLoaded("유형", "Example site type");
    // 유형이 바뀌면 권한은 다른 조회 대상이 된다. 이전 유형의 권한을 그대로 보여주지 않는다.
    expect(screen.queryByRole("combobox", { name: "권한" })).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toHaveTextContent(
        "선택",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "권한" })).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("manager form option query states", () => {
  it("유형 옵션 조회 실패를 빈 select로 숨기지 않고 재시도로 복구한다", async () => {
    const read = vi.mocked(readManagerDirectoryTypeOptions);
    const original = read.getMockImplementation()!;
    read.mockImplementation(() => {
      throw new ApiError({ kind: "network", message: "test" });
    });
    render(
      <TestQueryLocaleProvider>
        <ManagerCreateInputScreen onConfirm={vi.fn()} />
      </TestQueryLocaleProvider>,
    );

    const failure = await screen.findByRole("alert", { name: "유형" });
    expect(failure).toHaveTextContent("옵션을 불러오지 못했습니다.");
    expect(screen.queryByRole("combobox", { name: "유형" })).toBeNull();

    read.mockImplementation(original);
    fireEvent.click(screen.getByRole("button", { name: "유형 다시 시도" }));
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "유형" })).toBeEnabled(),
    );
    await chooseOptionIn("유형", "Example type");
    expect(read.mock.calls.length).toBeGreaterThan(1);
  });
});
