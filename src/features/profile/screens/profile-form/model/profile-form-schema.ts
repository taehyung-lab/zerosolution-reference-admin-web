import { z } from 'zod';
import { profilePasswordSchema } from '@/features/profile/model/profile-password';
import { i18n } from '@/shared/i18n/i18n';

/**
 * 내정보 수정의 UI 입력 계약(Figma `13.2. 내정보 수정`). 값은 체크박스 하나를 빼면 전부 문자열이다.
 * 아이디는 수정 불가라 폼 값이 아니고 레코드에서 온 정적 표시다.
 *
 * 비밀번호는 `수정` 체크박스를 켰을 때만 필수이며, 끈 상태가 default 다(원문). 그래서 비밀번호
 * 규칙은 schema 안에서 조건부로 돈다 — 끈 채 저장하면 비밀번호는 요청에 실리지 않는다.
 *
 * 이름·휴대폰번호·이메일·소속의 길이·문자 제한은 원문이 답하지 않는다
 * (`product/facts/PROFILE-EDIT.md` 미확인 2). 확인되기 전에는 필수 여부만 검증하고 형식 문구를
 * 지어내지 않는다.
 */
const required = { error: () => i18n.t('shared:formError.required') };

export const profileEditSchema = z
  .object({
    passwordEdit: z.boolean(),
    password: z.string(),
    passwordConfirm: z.string(),
    name: z.string().min(1, required),
    phone: z.string().min(1, required),
    email: z.string().min(1, required),
    organization: z.string(),
  })
  .superRefine((value, ctx) => {
    if (!value.passwordEdit) return;
    const password = profilePasswordSchema.safeParse(value.password);
    if (!password.success) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: i18n.t('profile:form.errors.password') });
    }
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
  });

/** TanStack Form 이 보관하는 입력 값. */
export type ProfileEditInput = z.input<typeof profileEditSchema>;
/** 유효 submit 직후 `schema.parse` 가 만드는 값. */
export type ProfileEditValues = z.output<typeof profileEditSchema>;

/** 화면에 보이는 순서. invalid submit 의 "첫 오류"를 사용자가 보는 순서와 맞춘다(좌→우, 위→아래). */
export const profileEditFieldOrder = [
  'passwordEdit',
  'password',
  'passwordConfirm',
  'name',
  'phone',
  'email',
  'organization',
] as const satisfies readonly (keyof ProfileEditInput)[];

/**
 * 원문: `비밀번호 확인 → 동일하지 않은 값을 입력 후 포커스 이동 시, 입력 오류 안내 메시지 노출`.
 * 제출 전에도 알려야 하므로 schema 와 별도로 blur 에서 이 한 필드만 본다.
 */
export function profileEditBlurMessages(values: ProfileEditInput) {
  return {
    passwordConfirm:
      values.passwordEdit && values.passwordConfirm !== '' && values.password !== values.passwordConfirm
        ? i18n.t('profile:form.errors.passwordMismatch')
        : undefined,
  };
}
