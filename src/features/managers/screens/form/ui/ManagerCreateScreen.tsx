/**
 * 기존 API 운영자 등록의 폼 검증·요청 변환·mutation·서버 오류·완료 이동을 연결한다.
 * 실제 API에서도 필요한 저장 workflow 예이며 새 제품의 응답/완료 정책은 별도로 대조해야 한다.
 */
import { classifyFormError } from "@/api/form-error";
import { useLocale } from "@/shared/i18n/locale-context";
import { useSaveForm } from "@/shared/ui/form/useSaveForm";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { managerCreateDefaults } from "../model/manager-form-defaults";
import { toManagerCreateRequest } from "../model/manager-form-request";
import {
  managerCreateFieldOrder,
  managerCreateSchema,
} from "../model/manager-form-schema";
import { useCreateManagerMutation } from "../model/useCreateManagerMutation";
import { ManagerCreateIdentityFields, ManagerForm } from "./ManagerForm";

export function ManagerCreateScreen() {
  const { t } = useTranslation("managers");
  const { locale } = useLocale();
  const navigate = useNavigate();
  const mutation = useCreateManagerMutation(locale);
  const goToList = () => {
    void navigate({ to: "/managers" });
  };
  const save = useSaveForm({
    schema: managerCreateSchema,
    defaultValues: managerCreateDefaults,
    sections: { info: managerCreateFieldOrder },
    save: {
      run: (values) => mutation.mutateAsync(toManagerCreateRequest(values)),
      isPending: mutation.isPending,
    },
    mapError: (error) => classifyFormError(error, managerCreateFieldOrder),
    onDone: goToList,
  });

  return (
    <section>
      <PageHeader
        breadcrumbs={[t("path.settings"), t("path.managers"), t("path.create")]}
        title={t("form.createTitle")}
      />
      <ManagerForm
        save={save}
        identity={<ManagerCreateIdentityFields form={save.form} />}
        onCancel={goToList}
      />
    </section>
  );
}
