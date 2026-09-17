import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { ProfileAction } from '@/features/profile/model/profile';
import { profilePasswordSchema } from '@/features/profile/model/profile-password';
import { i18n } from '@/shared/i18n/i18n';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import type { ErrorTraceValue } from '@/shared/ui/feedback/ErrorTrace';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';

export type ProfileInputAction = ProfileAction['type'];

const input = z.object({ password: z.string(), passwordConfirm: z.string() });

/**
 * 비밀번호 변경은 새 비밀번호 규칙과 확인 일치를 본다(원문 `[비밀번호 변경 팝업]` Case01·Case03).
 * 탈퇴는 **현재** 비밀번호를 받을 뿐이고 일치 여부는 서버가 판정하므로 필수 입력만 본다.
 * 재사용 금지(Case02)와 탈퇴 비밀번호 불일치도 서버 판정이라 여기서 검사하지 않는다.
 */
const schemas = {
  changePassword: input.extend({ password: profilePasswordSchema }).superRefine((value, ctx) => {
    // 원문: 비밀번호 확인은 필수입력이고, 값이 있으면 비밀번호와 같아야 한다(Case03).
    if (value.passwordConfirm === '') {
      ctx.addIssue({ code: 'custom', path: ['passwordConfirm'], message: i18n.t('shared:formError.required') });
      return;
    }
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirm'],
        message: i18n.t('profile:form.errors.passwordMismatch'),
      });
    }
  }),
  withdraw: input.extend({
    password: z.string().min(1, { error: () => i18n.t('shared:formError.required') }),
  }),
};
const fieldOrder = ['password', 'passwordConfirm'] as const;

/**
 * 13.1 내정보 조회의 입력이 필요한 액션 둘(비밀번호 변경 alert · 회원 탈퇴 alert)의 입력·검증·이탈
 * 보호를 소유하는 팝업. 유효한 입력을 `run` 에 넘기고 그 약속이 이행되면 `onCompleted` 로 알린다 —
 * 완료 alert 문구와 그 다음 이동은 조회 화면이 소유한다. 거부되면 열린 채 공용 실패 문구를 보여 준다.
 */
export function ProfileActionForm({
  action,
  onClose,
  onCompleted,
  run,
}: {
  readonly action: ProfileInputAction;
  readonly onClose: () => void;
  readonly onCompleted: () => void;
  readonly run: (action: ProfileAction) => Promise<unknown>;
}) {
  const { t } = useTranslation('profile');
  const { t: shared } = useTranslation('shared');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ErrorTraceValue>();
  const schema = schemas[action];
  const form = useForm({
    defaultValues: { password: '', passwordConfirm: '' },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirm:
            action === 'changePassword' &&
            value.passwordConfirm !== '' &&
            value.password !== value.passwordConfirm
              ? t('form.errors.passwordMismatch')
              : undefined,
        },
      }),
    },
    onSubmitInvalid: ({ formApi }) => {
      const first = fieldOrder.find((name) => formApi.getFieldMeta(name)?.errors.length);
      if (first)
        document.getElementById(formFieldControlId<typeof formApi.state.values>(formApi, first))?.focus();
    },
    onSubmit: async ({ value }) => {
      setPending(true);
      setFailure(undefined);
      try {
        await run({ type: action, password: schema.parse(value).password });
        onCompleted();
      } catch (error: unknown) {
        setFailure(errorTraceOf(error));
      } finally {
        setPending(false);
      }
    },
  });
  const dirty = useSelector(form.store, (state) => state.isDirty && !state.isDefaultValue);
  const guard = useUnsavedChangesGuard({ when: dirty, refuseSilently: pending });
  const close = () => guard.close(onClose);

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={shared('alert.title')}
        description={t(`actions.${action}Description`)}
        closeLabel={shared('formAction.cancel')}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.validate('blur');
            void form.handleSubmit();
          }}
        >
          {failure ? (
            <p className="mb-3 text-sm text-red-700" role="alert">
              {shared(errorMessageKey(failure.kind))}
            </p>
          ) : null}
          <FormTextField
            autoComplete={action === 'changePassword' ? 'new-password' : 'current-password'}
            form={form}
            label={t('form.password')}
            name="password"
            placeholder={action === 'changePassword' ? t('form.passwordPlaceholder') : undefined}
            required
            type="password"
          />
          {action === 'changePassword' ? (
            <FormTextField
              autoComplete="new-password"
              form={form}
              label={t('form.passwordConfirm')}
              name="passwordConfirm"
              placeholder={t('form.passwordConfirmPlaceholder')}
              required
              type="password"
            />
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {shared('formSave.confirm')}
            </Button>
            <Button type="button" disabled={pending} onClick={close}>
              {shared('formAction.cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}
