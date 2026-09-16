import { revalidateLogic, useForm, useSelector } from '@tanstack/react-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { MemberDetailAction } from '@/features/members/model/member';
import { memberPasswordSchema } from '@/features/members/model/member-password';
import { i18n } from '@/shared/i18n/i18n';
import { errorMessageKey, errorTraceOf } from '@/shared/lib/error-copy';
import type { ErrorTraceValue } from '@/shared/ui/feedback/ErrorTrace';
import { formFieldControlId } from '@/shared/ui/form/FormField';
import { FormTextField } from '@/shared/ui/form/FormTextField';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { Button } from '@/shared/ui/primitives/Button';
import { Dialog } from '@/shared/ui/primitives/Dialog';

export type MemberInputAction = MemberDetailAction['type'];

const required = (key: string) => z.string().min(1, { error: () => i18n.t(`members:detailAction.${key}`) });
const input = z.object({
  reason: z.string(),
  password: z.string(),
  passwordConfirmation: z.string(),
  operatorPassword: z.string(),
});
const schemas = {
  password: input
    .extend({ password: memberPasswordSchema, passwordConfirmation: required('passwordMismatch') })
    .refine((value) => value.password === value.passwordConfirmation, {
      path: ['passwordConfirmation'],
      error: () => i18n.t('members:detailAction.passwordMismatch'),
    }),
  reveal: input.extend({ operatorPassword: required('operatorRequired') }),
  verifyWithdrawal: input.extend({
    reason: z.string().min(5, { error: () => i18n.t('members:detailAction.reasonRequired') }),
    operatorPassword: required('operatorRequired'),
  }),
};
/** 액션 → 제목·설명 copy 의 접두어. 탈퇴 재인증은 `회원 탈퇴` 로 읽힌다. */
const copyKeys = { password: 'password', reveal: 'reveal', verifyWithdrawal: 'withdraw' } as const;
const fieldOrder = ['reason', 'password', 'passwordConfirmation', 'operatorPassword'] as const;

/**
 * 상세 액션 중 입력이 필요한 셋(비밀번호 변경·개인정보 조회 재인증·탈퇴 재인증)의 입력·검증·이탈 보호를 소유하는 팝업.
 * 유효한 입력을 `run` 에 넘기고 그 약속이 이행되면 닫힌다. 거부되면 열린 채 공용 실패 문구를 보여 준다.
 * 비밀번호 확인·재인증 성공 여부·개인정보 해제는 서버가 판정한다.
 */
export function MemberActionForm({
  action,
  memberId,
  onClose,
  run,
}: {
  readonly action: MemberInputAction;
  readonly memberId: string;
  readonly onClose: () => void;
  readonly run: (action: MemberDetailAction) => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ErrorTraceValue>();
  const schema = schemas[action];
  const form = useForm({
    defaultValues: { reason: '', password: '', passwordConfirmation: '', operatorPassword: '' },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
      onBlur: ({ value }) => ({
        fields: {
          passwordConfirmation:
            action === 'password' && value.passwordConfirmation !== '' && value.password !== value.passwordConfirmation
              ? t('detailAction.passwordMismatch')
              : undefined,
        },
      }),
    },
    onSubmitInvalid: ({ formApi }) => {
      const first = fieldOrder.find((name) => formApi.getFieldMeta(name)?.errors.length);
      if (first) document.getElementById(formFieldControlId<typeof formApi.state.values>(formApi, first))?.focus();
    },
    onSubmit: async ({ value }) => {
      setPending(true);
      setFailure(undefined);
      try {
        await run(toAction(action, memberId, schema.parse(value)));
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
  const copy = copyKeys[action];

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t(`detailAction.${copy}Title`)}
        description={t(`detailAction.${copy}Description`)}
        closeLabel={t('detailAction.close')}
      >
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.validate('blur');
            void form.handleSubmit();
          }}
        >
          {failure ? (
            <p className="text-sm text-red-700" role="alert">
              {t(`shared:${errorMessageKey(failure.kind)}`)}
            </p>
          ) : null}
          {action === 'verifyWithdrawal' ? (
            <FormTextField
              form={form}
              name="reason"
              label={t('detailAction.reason')}
              placeholder={t('detailAction.reasonHint')}
              required
            />
          ) : null}
          {action === 'password' ? (
            <>
              <FormTextField form={form} name="password" label={t('detailAction.password')} type="password" autoComplete="new-password" required />
              <FormTextField
                form={form}
                name="passwordConfirmation"
                label={t('detailAction.passwordConfirmation')}
                type="password"
                autoComplete="new-password"
                required
              />
            </>
          ) : (
            <FormTextField
              form={form}
              name="operatorPassword"
              label={t('detailAction.operatorPassword')}
              type="password"
              autoComplete="current-password"
              required
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {t('detailAction.confirm')}
            </Button>
            <Button type="button" disabled={pending} onClick={close}>
              {t('detailAction.cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
      {guard.dialog}
    </>
  );
}

function toAction(action: MemberInputAction, memberId: string, value: z.output<typeof input>): MemberDetailAction {
  switch (action) {
    case 'password':
      return { type: action, memberId, password: value.password };
    case 'reveal':
      return { type: action, memberId, operatorPassword: value.operatorPassword };
    case 'verifyWithdrawal':
      return { type: action, memberId, reason: value.reason, operatorPassword: value.operatorPassword };
  }
}
