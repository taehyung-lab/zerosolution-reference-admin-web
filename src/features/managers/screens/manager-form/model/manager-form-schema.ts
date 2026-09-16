import { i18n } from '@/shared/i18n/i18n';
import { z } from 'zod';
import { managerPasswordSchema } from '@/features/managers/model/manager-password';

/**
 * 운영자 등록·수정의 UI 입력 계약(Figma 11.1.3 등록 / 11.1.4 수정). 값은 전부 문자열이다 — `Select` 의 값 계약이
 * `string | null` 이고 빈 선택을 `''` 로 표현해야 placeholder 상태를 스키마가 거부할 수 있기 때문이다.
 * 등록과 수정은 필드 집합이 다르다(등록만 아이디·비밀번호, 수정은 아이디가 읽기 전용)라 공통 조각만 공유한다.
 * 입력 규칙은 Notion 설정 > 운영자의 길이·문자 제한이다. 인증·중복·서버 상태 전이 검증을 대신하지 않는다.
 */
const message = (key: string) => ({ error: () => i18n.t(`managers:form.errors.${key}`) });

const NAME_PATTERN =
  /^[\p{Script=Hangul}\p{Script=Latin}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9ー]{1,10}$/u;
const ID_PATTERN = /^[A-Za-z0-9]{6,20}$/;
const PHONE_PATTERN = /^[0-9-]{1,20}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9@._-]+$/;
const EMAIL_MAX_LENGTH = 100;
const ORGANIZATION_MAX_LENGTH = 20;

const profile = {
  type: z.string().min(1, message('typeRequired')),
  permissionId: z.string().min(1, message('permissionRequired')),
  name: z.string().regex(NAME_PATTERN, message('name')),
  phone: z.string().regex(PHONE_PATTERN, message('phone')),
  email: z
    .string()
    .min(3, message('email'))
    .max(EMAIL_MAX_LENGTH, message('email'))
    .regex(EMAIL_PATTERN, message('email'))
    .pipe(z.email(message('email'))),
  organization: z.string().max(ORGANIZATION_MAX_LENGTH, message('organization')),
} as const;

export const managerCreateSchema = z
  .object({
    ...profile,
    id: z.string().regex(ID_PATTERN, message('id')),
    password: managerPasswordSchema,
    passwordConfirm: z.string().min(1, message('passwordConfirmRequired')),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirm'],
        message: i18n.t('managers:form.errors.passwordMismatch'),
      });
    }
  });

export const managerEditSchema = z.object(profile);

/** TanStack Form 이 보관하는 입력 값(문자열). */
export type ManagerCreateInput = z.input<typeof managerCreateSchema>;
export type ManagerEditInput = z.input<typeof managerEditSchema>;
/** 유효 submit 직후 `schema.parse` 가 만드는 값. */
export type ManagerCreateValues = z.output<typeof managerCreateSchema>;
export type ManagerEditValues = z.output<typeof managerEditSchema>;

/** 화면에 보이는 순서. invalid submit 의 "첫 오류"를 사용자가 보는 순서와 맞춘다(2열 배치를 좌→우, 위→아래). */
export const managerCreateFieldOrder = [
  'type',
  'permissionId',
  'id',
  'password',
  'passwordConfirm',
  'name',
  'phone',
  'email',
  'organization',
] as const satisfies readonly (keyof ManagerCreateInput)[];

export const managerEditFieldOrder = [
  'type',
  'permissionId',
  'name',
  'phone',
  'email',
  'organization',
] as const satisfies readonly (keyof ManagerEditInput)[];
