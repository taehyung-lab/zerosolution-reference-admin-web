import { FormCancelButton } from "@/shared/ui/form/FormCancelButton";
import type { FieldForm } from "@/shared/ui/form/FormField";
import { FormSaveFailureMessage } from "@/shared/ui/form/FormSaveDialogs";
import { FormSelectField } from "@/shared/ui/form/FormSelectField";
import { FormSubmitButton } from "@/shared/ui/form/FormSubmitButton";
import { FormTextField } from "@/shared/ui/form/FormTextField";
import type { useSaveForm } from "@/shared/ui/form/useSaveForm";
import { SectionCard } from "@/shared/ui/layout/SectionCard";
import { useSelector, type DeepValue } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
  ManagerCreateInput,
  ManagerEditInput,
} from "../model/manager-form-schema";
import {
  useManagerFormOptions,
  type ManagerFormOptions,
} from "../model/useManagerFormOptions";

/**
 * 화면이 선언한 저장 생명주기를 폼 UI에 전달하는 타입이다. 이 타입 자체가 API 저장을 실행하지 않는다.
 */
export type ManagerSaveForm<TValues, TOutput> = Pick<
  ReturnType<typeof useSaveForm<TValues, TOutput, "info">>,
  "sections" | "stage" | "guard" | "dialogs"
> & {
  readonly form: FieldForm<TValues> &
    Pick<
      ReturnType<typeof useSaveForm<TValues, TOutput, "info">>["form"],
      "setFieldValue"
    > & {
      readonly store: Parameters<typeof useSelector<{ values: TValues }>>[0];
    };
  readonly submit: {
    readonly run: () => Promise<void>;
    readonly isPending: boolean;
  };
};

/**
 * 운영자 등록/수정이 공유하는 입력 필드·옵션·유형 변경 시 종속값 초기화와 저장/취소 UI다.
 * 실제 API에서도 폼은 유지하며 schema·초기값·mutation·완료 이동은 화면이 선언한다.
 * 옵션은 화면이 소유한 조회 결과를 받고, 넘기지 않으면 리허설 API 옵션 Query를 실행한다.
 * 제품 화면은 useManagerDirectoryFormOptions를, 리허설 화면은 내부 Query 경로를 쓴다.
 * 등록만 아이디·비밀번호 입력을 identity slot에 넣고 수정은 읽기 전용 아이디를 넣는다.
 * FormApi는 값 타입에 공변적이지 않아 공통 수정 필드를 하한으로 제네릭을 사용한다.
 * DeepValue의 필드 타입을 미확정 제네릭에서 좁힐 수 없어 종속값 초기화 위치에 타입 단언이 남는다.
 */
export function ManagerForm<TValues extends ManagerEditInput, TOutput>({
  save,
  identity,
  onCancel,
  options,
}: {
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
  readonly options?: ManagerFormOptions;
}) {
  const { form } = save;
  const type = useSelector(form.store, (state) => state.values.type);
  return options ? (
    <ManagerFormContent
      save={save}
      identity={identity}
      onCancel={onCancel}
      options={options}
    />
  ) : (
    <ManagerFormWithQueries
      save={save}
      identity={identity}
      onCancel={onCancel}
      type={type}
    />
  );
}

function ManagerFormWithQueries<TValues extends ManagerEditInput, TOutput>({
  type,
  ...props
}: {
  readonly type: string;
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
}) {
  const options = useManagerFormOptions(type);
  return <ManagerFormContent {...props} options={options} />;
}

function ManagerFormContent<TValues extends ManagerEditInput, TOutput>({
  save,
  identity,
  onCancel,
  options,
}: {
  readonly save: ManagerSaveForm<TValues, TOutput>;
  readonly identity: ReactNode;
  readonly onCancel: () => void;
  readonly options: ManagerFormOptions;
}) {
  const { t } = useTranslation("managers");
  const { form } = save;
  const clearTypeDependents = () => {
    form.setFieldValue(
      "permissionId",
      "" as DeepValue<TValues, "permissionId">,
    );
    form.setFieldValue("agencyId", "" as DeepValue<TValues, "agencyId">);
  };

  return (
    <>
      {save.dialogs}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.submit.run();
        }}
      >
        {save.stage.kind === "failed" ? (
          <FormSaveFailureMessage failure={save.stage.root} />
        ) : null}
        <SectionCard
          title={t("form.section")}
          {...save.sections.sectionProps("info")}
        >
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <FormSelectField
              form={form}
              label={t("form.type")}
              name="type"
              options={options.type.items}
              state={options.type.state}
              onRetry={options.type.retry}
              onValueChange={clearTypeDependents}
              placeholder={t("form.selectPlaceholder")}
              required
            />
            <FormSelectField
              form={form}
              disabled={!options.typeSelected}
              label={t("form.permission")}
              name="permissionId"
              options={options.permission.items}
              state={options.permission.state}
              onRetry={options.permission.retry}
              placeholder={t("form.selectPlaceholder")}
              required
            />
            {options.isAgency ? (
              <FormSelectField
                form={form}
                description={t("form.agencyDescription")}
                label={t("form.agency")}
                name="agencyId"
                options={options.agency.items}
                state={options.agency.state}
                onRetry={options.agency.retry}
                placeholder={t("form.selectPlaceholder")}
                required
              />
            ) : null}
            {identity}
            <FormTextField
              form={form}
              label={t("form.name")}
              name="name"
              placeholder={t("form.namePlaceholder")}
              required
            />
            <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5">
              <FormTextField
                form={form}
                label={t("form.phone")}
                name="phone"
                placeholder={t("form.phonePlaceholder")}
                required
              />
              <FormTextField
                form={form}
                label={t("form.email")}
                name="email"
                placeholder={t("form.emailPlaceholder")}
                required
              />
            </div>
            <FormTextField
              form={form}
              label={t("form.organization")}
              name="organization"
              placeholder={t("form.organizationPlaceholder")}
            />
          </div>
        </SectionCard>
        <div className="mt-8 flex justify-center gap-3">
          <FormSubmitButton pending={save.submit.isPending} />
          <FormCancelButton
            disabled={save.submit.isPending}
            onClick={() => save.guard.leave(onCancel)}
          />
        </div>
      </form>
    </>
  );
}

/**
 * 등록에만 필요한 아이디·비밀번호·비밀번호 확인 입력이다. 수정 화면은 아이디를 읽기 전용으로 표시한다.
 */
export function ManagerCreateIdentityFields({
  form,
}: {
  readonly form: FieldForm<ManagerCreateInput>;
}) {
  const { t } = useTranslation("managers");
  return (
    <>
      <FormTextField
        form={form}
        autoComplete="off"
        label={t("form.id")}
        name="id"
        placeholder={t("form.idPlaceholder")}
        required
      />
      <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-5">
        <FormTextField
          form={form}
          autoComplete="new-password"
          label={t("form.password")}
          name="password"
          placeholder={t("form.passwordPlaceholder")}
          required
          type="password"
        />
        <FormTextField
          form={form}
          autoComplete="new-password"
          label={t("form.passwordConfirm")}
          name="passwordConfirm"
          required
          type="password"
        />
      </div>
    </>
  );
}
