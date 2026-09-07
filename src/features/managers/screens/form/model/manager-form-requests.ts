import type {
  ManagerCreateValues,
  ManagerEditValues,
} from "./manager-form-schema";

// 제품 입력 검증용 화면의 저장 연결 지점이다. 기존 API 연결 화면의 mutation을 대신하지 않는다.
export const requestManagerCreate: (
  input: ManagerCreateValues,
) => void = () => {
  console.log("[시나리오] 운영자 등록: 요청 입력 확인 → API 연결 대기");
};

export const requestManagerEdit: (request: {
  managerId: string;
  input: ManagerEditValues;
}) => void = () => {
  console.log("[시나리오] 운영자 수정: 요청 입력 확인 → API 연결 대기");
};
