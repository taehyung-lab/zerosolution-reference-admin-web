import { useManagerDirectoryDetail } from "@/features/managers/api/useManagerDirectoryDetail";
import { toManagerEditDefaults } from "@/features/managers/screens/form/model/manager-form-defaults";
import { requestManagerEdit } from "@/features/managers/screens/form/model/manager-form-requests";
import { ManagerEditInputScreen } from "@/features/managers/screens/form/ui/ManagerInputScreens";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { loadRequired } from "@/app/router/required-loader";
import { managerDirectoryDetailQuery } from "@/features/managers/api/directory-queries";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/_app/managers/$managerId/edit")({
  loader: ({ context, params, preload }) =>
    loadRequired(context.queryClient, managerDirectoryDetailQuery(context.locale, params.managerId), { preload }),
  component: ManagerEditRoute,
});
function ManagerEditRoute() {
  const { managerId } = Route.useParams();
  const { t } = useTranslation("managers");
  const query = useManagerDirectoryDetail(managerId);
  if (!query.data)
    return (
      <DetailStateBoundary
        state={query.state}
        labels={{ error: t("detail.error"), notFound: t("detail.notFound") }}
        retryLabel={t("result.retry")}
        onRetry={() => {
          void query.retry();
        }}
      >
        {null}
      </DetailStateBoundary>
    );
  // TRANSPLANT_PENDING_MANAGER_EDIT_INPUT: 최종 입력 확인은 업무 요청 함수까지 전달하며 저장 성공은 만들지 않는다.
  return (
    <ManagerEditInputScreen
      key={managerId}
      onConfirm={requestManagerEdit}
      managerId={managerId}
      defaults={toManagerEditDefaults(query.data.detail)}
    />
  );
}
