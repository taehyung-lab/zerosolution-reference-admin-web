import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { ManagerAction } from '@/features/managers/model/manager';
import { managerPasswordSchema } from '@/features/managers/model/manager-password';
import { i18n } from '@/shared/i18n/i18n';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import type { ErrorTraceValue } from '@/shared/ui/feedback/ErrorTrace';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';

export type ManagerInputAction = Extract<
  ManagerAction['type'],
  'reject' | 'password' | 'unlock' | 'reveal' | 'verifyWithdrawal'
>;

const requiredPassword = z.string().min(1, { error: () => i18n.t('managers:actions.passwordRequired') });
const input = z.object({
  reason: z.string(),
  password: z.string(),
  passwordConfirm: z.string(),
  operatorPassword: z.string(),
});
const passwordPair = input
  .extend({ password: managerPasswordSchema })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ['passwordConfirm'],
    error: () => i18n.t('managers:form.errors.passwordMismatch'),
  });
const schemas = {
  reject: input.extend({
    reason: z.string().min(1, { error: () => i18n.t('managers:actions.reasonRequired') }),
  }),
  password: passwordPair,
  unlock: passwordPair,
  reveal: input.extend({ operatorPassword: requiredPassword }),
  verifyWithdrawal: input.extend({
    reason: z.string().min(5, { error: () => i18n.t('managers:actions.withdrawalReasonError') }),
    operatorPassword: requiredPassword,
  }),
};
const fieldOrder = ['reason', 'password', 'passwordConfirm', 'operatorPassword'] as const;

/**
 * 상세 액션 중 입력이 필요한 다섯 개(거절 사유·비밀번호 변경·잠금해제·개인정보 재인증·탈퇴 재인증)의
 * 입력·검증·이탈 보호를 소유하는 팝업. 유효한 입력을 `run` 에 넘기고 그 약속이 이행되면 닫힌다. 거부되면
 * 열린 채 공용 실패 문구를 보여 준다. 현재 비밀번호 확인·재사용 검사·재인증 성공 여부는 서버가 판정한다.
 */
export function ManagerActionForm({
  action,
  managerId,
  onClose,
  run,
}: {
  readonly action: ManagerInputAction;
  readonly managerId: string;
  readonly onClose: () => void;
  readonly run: (action: ManagerAction) => Promise<unknown>;
}) {
  const { t } = useTranslation('managers');
  const { t: shared } = useTranslation('shared');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ErrorTraceValue>();
  const schema = schemas[action];
  const form = useForm({
    defaultValues: { reason: '', password: '', passwordConfirm: '', operatorPassword: '' },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirm:
            (action === 'password' || action === 'unlock') &&
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
        await run(toAction(action, managerId, schema.parse(value)));
        onClose();
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
        title={t(`actions.${action}`)}
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
          {action === 'reject' || action === 'verifyWithdrawal' ? (
            <FormTextField
              form={form}
              name="reason"
              label={t(action === 'reject' ? 'actions.rejectionReason' : 'actions.withdrawalReason')}
              required
            />
          ) : null}
          {action === 'password' || action === 'unlock' ? (
            <>
              <FormTextField form={form} name="password" label={t('form.password')} type="password" autoComplete="new-password" required />
              <FormTextField form={form} name="passwordConfirm" label={t('form.passwordConfirm')} type="password" autoComplete="new-password" required />
            </>
          ) : null}
          {action === 'reveal' || action === 'verifyWithdrawal' ? (
            <FormTextField form={form} name="operatorPassword" label={t('form.password')} type="password" autoComplete="current-password" required />
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {action === 'reject' ? t('actions.rejectConfirm') : shared('formSave.confirm')}
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

function toAction(
  action: ManagerInputAction,
  managerId: string,
  value: z.output<typeof input>,
): ManagerAction {
  switch (action) {
    case 'reject':
      return { type: action, managerId, reason: value.reason };
    case 'password':
    case 'unlock':
      return { type: action, managerId, password: value.password };
    case 'reveal':
      return { type: action, managerId, operatorPassword: value.operatorPassword };
    case 'verifyWithdrawal':
      return { type: action, managerId, reason: value.reason, operatorPassword: value.operatorPassword };
  }
}
