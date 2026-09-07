import { ApiError } from "@/api/error";
import { TestLocaleProvider } from "@/test/locale";
import { chooseOptionIn } from "@/test/select";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManagerCreateScreen } from "./ManagerCreateScreen";

const navigate = vi.fn();
const mutateAsync = vi.fn();
const proceed = vi.fn();
const reset = vi.fn();
let blocker:
  | { status: "idle" }
  | { status: "blocked"; proceed: () => void; reset: () => void } = {
  status: "idle",
};
let blockerDisabled: boolean | undefined;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useBlocker: (opts: { disabled?: boolean }) => {
    blockerDisabled = opts.disabled;
    return blocker;
  },
}));
vi.mock("../model/useCreateManagerMutation", () => ({
  useCreateManagerMutation: () => ({
    mutateAsync,
    isPending: false,
    isSuccess: false,
  }),
}));
vi.mock("../../../api/manager-form-contract", () => ({
  managerFormTypes: { INTERNAL: "INTERNAL", AGENCY: "AGENCY" },
}));
const typeOptionsRefetch = vi.fn();
let typeOptionsQuery: {
  data?: unknown;
  isError: boolean;
  refetch: () => unknown;
} = {
  data: [
    { value: "INTERNAL", label: "내부담당자" },
    { value: "AGENCY", label: "기획사" },
  ],
  isError: false,
  refetch: typeOptionsRefetch,
};
vi.mock(
  "../../../api/useManagerOptions",
  () => ({
    useManagerTypeOptions: () => typeOptionsQuery,
    useManagerPermissionOptions: (type: string | undefined) => ({
      data:
        type === undefined ? undefined : [{ value: "1", label: "일반관리자" }],
      isError: false,
      refetch: () => undefined,
    }),
    useManagerAgencyOptions: () => ({
      data: [{ value: "7", label: "부스터랩" }],
      isError: false,
      refetch: () => undefined,
    }),
  }),
);

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TestLocaleProvider>
        <ManagerCreateScreen />
      </TestLocaleProvider>
    </QueryClientProvider>,
  );
}

function getForm(): HTMLFormElement {
  const submit = screen.getByRole("button", { name: "저장" });
  if (!(submit instanceof HTMLButtonElement) || submit.form === null) {
    throw new Error("save button must belong to a form");
  }
  return submit.form;
}

async function fillValidForm() {
  await chooseOptionIn(/^유형/, "내부담당자");
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: /^권한/ })).toBeEnabled(),
  );
  await chooseOptionIn(/^권한/, "일반관리자");
  fireEvent.change(screen.getByLabelText("아이디*"), {
    target: { value: "operator01" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호*"), {
    target: { value: "Passw0rd!" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호 확인*"), {
    target: { value: "Passw0rd!" },
  });
  fireEvent.change(screen.getByLabelText("이름*"), {
    target: { value: "김맹맹" },
  });
  fireEvent.change(screen.getByLabelText("휴대폰번호*"), {
    target: { value: "010-1234-1234" },
  });
  fireEvent.change(screen.getByLabelText("이메일*"), {
    target: { value: "operator@example.com" },
  });
}

/** 저장 클릭 이후의 확인 → 완료 흐름. */
async function confirmSave() {
  const confirmDialog = await screen.findByRole("dialog");
  expect(
    within(confirmDialog).getByRole("heading", { name: "알림" }),
  ).toBeInTheDocument();
  expect(
    within(confirmDialog).getByText("저장하시겠습니까?"),
  ).toBeInTheDocument();
  fireEvent.click(within(confirmDialog).getByRole("button", { name: "확인" }));
}

async function acknowledgeSaved() {
  const alertDialog = await screen.findByRole("dialog");
  expect(within(alertDialog).getByText("저장되었습니다.")).toBeInTheDocument();
  fireEvent.click(within(alertDialog).getByRole("button", { name: "확인" }));
}

afterEach(() => {
  navigate.mockReset();
  mutateAsync.mockReset();
  typeOptionsRefetch.mockReset();
  typeOptionsQuery = {
    data: [
      { value: "INTERNAL", label: "내부담당자" },
      { value: "AGENCY", label: "기획사" },
    ],
    isError: false,
    refetch: typeOptionsRefetch,
  };
});

describe("ManagerCreateScreen — 서버 오류 분류", () => {
  it("닫힌 섹션의 서버 필드 오류를 보존해 열고 알리고 첫 rejected field로 포커스한다", async () => {
    mutateAsync.mockRejectedValue(
      new ApiError({
        kind: "validation",
        message: "server raw validation",
        status: 400,
        fieldErrors: [
          { field: "name", code: "rejected" },
          { field: "id", code: "duplicate" },
        ],
      }),
    );
    renderScreen();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /^유형/ })).toBeEnabled(),
    );
    await fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /^운영자정보/ }));
    fireEvent.submit(getForm());
    await confirmSave();

    await waitFor(() =>
      expect(screen.getByLabelText("아이디*")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /^운영자정보/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getAllByText("서버에서 사용할 수 없는 값입니다."),
    ).toHaveLength(2);
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(2);
    expect(document.activeElement).toBe(screen.getByLabelText("아이디*"));
    expect(screen.queryByText("server raw validation")).not.toBeInTheDocument();
  });
});

describe("ManagerCreateScreen — 옵션 조회 상태", () => {
  it("유형 옵션이 실패하면 select 자리에 오류와 다시 시도를 보이고, 성공하면 select로 돌아온다", () => {
    typeOptionsQuery = {
      data: undefined,
      isError: true,
      refetch: typeOptionsRefetch,
    };
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <TestLocaleProvider>
          <ManagerCreateScreen />
        </TestLocaleProvider>
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("combobox", { name: /^유형/ })).toBeNull();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "옵션을 불러오지 못했습니다.",
    );
    fireEvent.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(typeOptionsRefetch).toHaveBeenCalledOnce();

    typeOptionsQuery = {
      data: [{ value: "INTERNAL", label: "내부담당자" }],
      isError: false,
      refetch: typeOptionsRefetch,
    };
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TestLocaleProvider>
          <ManagerCreateScreen />
        </TestLocaleProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("combobox", { name: /^유형/ })).toBeEnabled();
  });
});

describe("ManagerCreateScreen — 요청 본문", () => {
  it("취소는 입력이 없으면 확인 없이 목록으로 이동하고, 입력이 있으면 취소 문구로 확인을 받는다", async () => {
    blocker = { status: "idle" };
    navigate.mockClear();
    proceed.mockReset();
    reset.mockReset();
    renderScreen();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /^유형/ })).toBeEnabled(),
    );

    // 깨끗한 폼: 가드가 꺼져 있고 취소는 바로 이동한다.
    expect(blockerDisabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/managers" });
    expect(screen.queryByRole("dialog")).toBeNull();
    navigate.mockClear();

    // 입력 뒤: 가드가 켜지고, Router 가 이동을 잡으면 취소 문구가 뜬다.
    fireEvent.change(screen.getByLabelText("아이디*"), {
      target: { value: "operator01" },
    });
    await waitFor(() => expect(blockerDisabled).toBe(false));
    blocker = { status: "blocked", proceed, reset };
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/managers" });
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("입력을 취소하시겠습니까?");

    // dialog 의 "취소" 는 입력을 유지한다.
    blocker = { status: "idle" };
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(reset).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByLabelText("아이디*")).toHaveValue("operator01");

    blocker = { status: "blocked", proceed, reset };
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "확인",
      }),
    );
    expect(proceed).toHaveBeenCalledOnce();
    blocker = { status: "idle" };
  });

  it("UI 전용 비밀번호 확인을 본문에 싣지 않는다", async () => {
    mutateAsync.mockResolvedValue(undefined);
    renderScreen();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /^유형/ })).toBeEnabled(),
    );
    await fillValidForm();
    fireEvent.submit(getForm());

    // 검증만 통과했을 뿐 아직 쓰지 않는다.
    expect(mutateAsync).not.toHaveBeenCalled();
    await confirmSave();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const body = mutateAsync.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(body)).not.toContain("passwordConfirm");
    expect(body).toMatchObject({
      id: "operator01",
      permissionId: 1,
      type: "INTERNAL",
    });

    // 완료를 확인하기 전에는 화면을 떠나지 않는다.
    expect(navigate).not.toHaveBeenCalled();
    await acknowledgeSaved();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/managers" }),
    );
  });

  it("유형을 기획사에서 되돌리면 이전에 고른 기획사가 본문에 남지 않는다", async () => {
    mutateAsync.mockResolvedValue(undefined);
    renderScreen();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /^유형/ })).toBeEnabled(),
    );

    await chooseOptionIn(/^유형/, "기획사");
    await screen.findByRole("combobox", { name: /^기획사/ });
    await chooseOptionIn(/^기획사/, "부스터랩");

    await chooseOptionIn(/^유형/, "내부담당자");
    await waitFor(() =>
      expect(screen.queryByRole("combobox", { name: /^기획사/ })).toBeNull(),
    );

    await fillValidForm();
    fireEvent.submit(getForm());
    await confirmSave();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const body = mutateAsync.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.agencyId).toBeUndefined();
  });
});
