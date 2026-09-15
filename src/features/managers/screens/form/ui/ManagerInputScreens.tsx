/**
 * 운영자 등록/수정 입력을 필수 onConfirm으로 전달하는 API 미연결 화면 진입점이다.
 * 실제 API 연결 시 폼 정책은 유지하고 기존 API 화면과 중복된 저장 진입점을 정리한다. 로그 도달을 저장 완료로 해석하지 않는다.
 * 옵션은 이 화면이 제품 옵션 Query로 조회한다. 선택한 유형을 폼 store에서 읽어 종속 권한 조회 범위를 정한다.
 */
import { FormTextField } from "@/shared/ui/form/FormTextField";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { useSelector } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { managerCreateDefaults } from "../model/manager-form-defaults";
import {
  managerCreateFieldOrder,
  managerCreateSchema,
  managerEditFieldOrder,
  managerEditSchema,
  type ManagerCreateValues,
  type ManagerEditInput,
  type ManagerEditValues,
} from "../model/manager-form-schema";
import { useManagerDirectoryFormOptions } from "../model/useManagerDirectoryFormOptions";
import { ManagerCreateIdentityFields, ManagerForm } from "./ManagerForm";
import { useManagerInputForm } from "./useManagerInputForm";

export function ManagerCreateInputScreen({
  onConfirm,
}: {
  readonly onConfirm: (values: ManagerCreateValues) => void;
}) {
  const { t } = useTranslation("managers");
  const navigate = useNavigate();
  const save = useManagerInputForm({
    schema: managerCreateSchema,
    defaults: managerCreateDefaults,
    fieldOrder: managerCreateFieldOrder,
    onConfirm,
  });
  const selectedType = useSelector(
    save.form.store,
    (state) => state.values.type,
  );
  const options = useManagerDirectoryFormOptions(selectedType);
  return (
    <section>
      <PageHeader
        breadcrumbs={[t("path.settings"), t("path.managers"), t("path.create")]}
        title={t("form.createTitle")}
      />
      <ManagerForm
        save={save}
        identity={<ManagerCreateIdentityFields form={save.form} />}
        options={options}
        onCancel={() => {
          void navigate({ to: "/managers" });
        }}
      />
    </section>
  );
}

export function ManagerEditInputScreen({
  managerId,
  defaults,
  onConfirm,
}: {
  readonly managerId: string;
  readonly defaults: ManagerEditInput;
  readonly onConfirm: (request: {
    readonly managerId: string;
    readonly input: ManagerEditValues;
  }) => void;
}) {
  const { t } = useTranslation("managers");
  const navigate = useNavigate();
  const save = useManagerInputForm({
    schema: managerEditSchema,
    defaults,
    fieldOrder: managerEditFieldOrder,
    onConfirm: (input) => onConfirm({ managerId, input }),
  });
  const selectedType = useSelector(
    save.form.store,
    (state) => state.values.type,
  );
  const options = useManagerDirectoryFormOptions(selectedType);
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
      <ManagerForm
        save={save}
        identity={
          <FormTextField readOnly label={t("form.id")} value={managerId} />
        }
        options={options}
        onCancel={() => {
          void navigate({ to: "/managers/$managerId", params: { managerId } });
        }}
      />
    </section>
  );
}
