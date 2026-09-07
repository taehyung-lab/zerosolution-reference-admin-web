import { ApiError } from "@/api/error";
import { TestLocaleProvider } from "@/test/locale";
import { useQuery } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManagerEditScreen } from "./ManagerEditScreen";

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useQuery: vi.fn(),
}));

const navigate = vi.fn();
const mutateAsync = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useBlocker: () => ({ status: "idle" }),
}));
vi.mock("../model/useUpdateManagerMutation", () => ({
  useUpdateManagerMutation: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("../../../api/manager-form-contract", () => ({
  managerFormTypes: { INTERNAL: "INTERNAL", AGENCY: "AGENCY" },
}));
vi.mock(
  "../../../api/useManagerOptions",
  () => {
    const ready = <T,>(data: T) => ({
      data,
      isError: false,
      refetch: () => undefined,
    });
    return {
      useManagerTypeOptions: () =>
        ready([
          { value: "INTERNAL", label: "내부담당자" },
          { value: "AGENCY", label: "기획사" },
        ]),
      useManagerPermissionOptions: (type: string | undefined) =>
        ready(
          type === undefined
            ? undefined
            : [{ value: "3", label: "일반관리자" }],
        ),
      useManagerAgencyOptions: () => ready([{ value: "7", label: "부스터랩" }]),
    };
  },
);

const renderScreen = () =>
  render(
    <TestLocaleProvider>
      <ManagerEditScreen managerId="manager-1" />
    </TestLocaleProvider>,
  );

const detail = {
  id: "ididi1234",
  name: "김맹맹",
  phone: "010-1234-1234",
  email: "your@email.com",
  organization: "부스터랩",
  type: { id: "AGENCY", name: "기획사" },
  agency: { id: 7, name: "부스터랩" },
  permission: { id: 3, name: "일반관리자" },
  status: { id: "ACTIVE", name: "활성" },
};

describe("ManagerEditScreen load states", () => {
  beforeEach(() => vi.mocked(useQuery).mockReset());

  it("does not render not-found while pending", () => {
    vi.mocked(useQuery).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as never);
    renderScreen();
    expect(
      screen.queryByText("운영자를 찾을 수 없습니다."),
    ).not.toBeInTheDocument();
  });

  it("renders a recoverable generic error when the settled query has no data", () => {
    const refetch = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
      refetch,
    } as never);
    renderScreen();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "운영자 정보를 불러오지 못했습니다.",
    );
    expect(
      screen.queryByText("운영자를 찾을 수 없습니다."),
    ).not.toBeInTheDocument();
    screen.getByRole("button", { name: "다시 시도" }).click();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("uses not-found only for the confirmed error kind", () => {
    vi.mocked(useQuery).mockReturnValue({
      isError: true,
      error: new ApiError({ kind: "not-found", message: "raw", status: 404 }),
    } as never);
    renderScreen();
    expect(screen.getByText("운영자를 찾을 수 없습니다.")).toBeInTheDocument();
  });

  it("keeps other failures recoverable and displays safe trace metadata", () => {
    const refetch = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      isError: true,
      error: new ApiError({
        kind: "contract",
        message: "raw contract body",
        status: 200,
        requestId: "req-edit",
      }),
      refetch,
    } as never);
    renderScreen();
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "raw contract body",
    );
    expect(screen.getAllByText("req-edit")).toHaveLength(2);
    screen.getByRole("button", { name: "다시 시도" }).click();
    expect(refetch).toHaveBeenCalledOnce();
  });
});

describe("ManagerEditScreen 저장 경로", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReset();
    vi.mocked(useQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: detail,
    } as never);
  });
  afterEach(() => {
    navigate.mockReset();
    mutateAsync.mockReset();
  });

  it("조회 응답을 폼 값으로 펼치고, 아이디는 읽기 전용 텍스트이며 비밀번호 필드는 없다", () => {
    renderScreen();
    expect(screen.getByLabelText("이름*")).toHaveValue("김맹맹");
    expect(screen.getByRole("combobox", { name: /^유형/ })).toHaveTextContent(
      "기획사",
    );
    expect(screen.getByRole("combobox", { name: /^기획사/ })).toHaveTextContent(
      "부스터랩",
    );
    expect(screen.getByText("ididi1234")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^아이디/ })).toBeNull();
    expect(screen.queryByLabelText("비밀번호*")).toBeNull();
  });

  it("저장 → 확인은 아이디·비밀번호 없는 PUT 본문을 보내고, 완료 확인 뒤 상세로 이동한다", async () => {
    mutateAsync.mockResolvedValue(undefined);
    renderScreen();
    fireEvent.change(screen.getByLabelText("이름*"), {
      target: { value: "김수정" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    const confirm = await screen.findByRole("dialog");
    expect(within(confirm).getByText("저장하시겠습니까?")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole("button", { name: "확인" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    const body = mutateAsync.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body).toMatchObject({
      name: "김수정",
      type: "AGENCY",
      permissionId: 3,
      agencyId: 7,
    });
    expect(Object.keys(body)).not.toContain("id");
    expect(Object.keys(body)).not.toContain("password");

    const saved = await screen.findByRole("dialog");
    expect(within(saved).getByText("저장되었습니다.")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(within(saved).getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/managers/$managerId",
        params: { managerId: "manager-1" },
      }),
    );
  });
});
