import { requestManagerCreate } from "@/features/managers/screens/form/model/manager-form-requests";
import { ManagerCreateInputScreen } from "@/features/managers/screens/form/ui/ManagerInputScreens";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/managers/new")({
  component: ManagerCreateRoute,
});
function ManagerCreateRoute() {
  // TRANSPLANT_PENDING_MANAGER_CREATE_INPUT: 최종 검증 입력을 전달하며 실제 저장은 계약 확인 후 연결한다.
  return <ManagerCreateInputScreen onConfirm={requestManagerCreate} />;
}
