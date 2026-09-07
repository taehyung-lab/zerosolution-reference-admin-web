/**
 * 수정용 상세 조회의 상태를 표시한 뒤 초기값을 폼에 넘기고 수정 mutation과 완료 이동을 연결한다.
 * 실제 API에서도 필요한 흐름이다. 편집 중 서버 재조회가 입력 초안을 덮어쓰지 않도록 조회와 폼 수명을 구분한다.
 */
import { classifyFormError } from "@/api/form-error";
import { useLocale } from "@/shared/i18n/locale-context";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { useSaveForm } from "@/shared/ui/form/useSaveForm";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { ErrorTrace } from "@/shared/ui/patterns/ErrorTrace";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { safeErrorKey } from "../../../lib/error-copy";
import { toManagerEditDefaults } from "../model/manager-form-defaults";
import { toManagerUpdateRequest } from "../model/manager-form-request";
import {
  managerEditFieldOrder,
  managerEditSchema,
  type ManagerEditInput,
} from "../model/manager-form-schema";
import { useManagerEditDetail } from "../../../api/useManagerEditDetail";
import { useUpdateManagerMutation } from "../model/useUpdateManagerMutation";
import { ManagerForm } from "./ManagerForm";

export function ManagerEditScreen({
  managerId,
}: {
  readonly managerId: string;
}) {
  const { t } = useTranslation("managers");
  const { t: sharedT } = useTranslation("shared");
  const detail = useManagerEditDetail(managerId);

  // 상세 조회가 실패해도 화면 제목은 남도록 헤더를 조회 상태 경계 밖에 둔다.
  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t("path.settings"),
          t("path.managers"),
          t("path.detail"),
          t("path.edit"),
        ]}
        title={t("form.editTitle")}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: detail.error
            ? sharedT(safeErrorKey(detail.error.kind))
            : t("form.loadError"),
          notFound: t("detail.notFound"),
        }}
        retryLabel={t("result.retry")}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <ManagerEditForm
            defaults={toManagerEditDefaults(detail.data)}
            displayId={detail.data.id ?? managerId}
            managerId={managerId}
          />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

function ManagerEditForm({
  defaults,
  displayId,
  managerId,
}: {
  readonly defaults: ManagerEditInput;
  readonly displayId: string;
  readonly managerId: string;
}) {
  const { t } = useTranslation("managers");
  const { locale } = useLocale();
  const navigate = useNavigate();
  const mutation = useUpdateManagerMutation(locale, managerId);
  const goToDetail = () => {
    void navigate({ to: "/managers/$managerId", params: { managerId } });
  };
  const save = useSaveForm({
    schema: managerEditSchema,
    defaultValues: defaults,
    sections: { info: managerEditFieldOrder },
    save: {
      run: (values) => mutation.mutateAsync(toManagerUpdateRequest(values)),
      isPending: mutation.isPending,
    },
    mapError: (error) => classifyFormError(error, managerEditFieldOrder),
    onDone: goToDetail,
  });
  return (
    <ManagerForm
      save={save}
      identity={
        <FormTextField readOnly label={t("form.id")} value={displayId} />
      }
      onCancel={goToDetail}
    />
  );
}
