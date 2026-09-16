import { z } from 'zod';
import { memberAccountStatuses, memberRestrictions, type MemberRestriction } from '@/features/members/model/member';
import { memberPasswordSchema } from '@/features/members/model/member-password';
import { i18n } from '@/shared/i18n/i18n';
import { formatDate } from '@/shared/lib/datetime';

/**
 * 회원 등록·수정의 UI 입력 계약(Figma 4.2.2 등록 / 4.2.3 수정). 값은 전부 문자열·문자열 배열이다 — `Select` 의 값 계약이
 * `string | null` 이고 빈 선택을 `''` 로 표현해야 placeholder 상태를 스키마가 거부할 수 있기 때문이다.
 * 등록과 수정은 필드 집합이 다르다(등록만 이메일·비밀번호, 수정만 계정 상태·활동제한)라 공통 조각만 공유한다.
 * 입력 규칙은 원장의 길이·문자 제한이다. 중복·비밀번호 이력·서버 상태 전이 검증을 대신하지 않는다.
 */
const message = (key: string) => ({ error: () => i18n.t(`members:form.errors.${key}`) });

const NAME_PATTERN =
  /^[\p{Script=Hangul}\p{Script=Latin}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9ー]{1,10}$/u;
const PHONE_PATTERN = /^[0-9-]{1,20}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9@._-]+$/;
const EMAIL_MAX_LENGTH = 100;

const profile = {
  name: z.string().regex(NAME_PATTERN, message('name')),
  /** 오늘까지 고를 수 있다. 오늘은 검증 시점에 읽는다. */
  birthDate: z.iso
    .date(message('birthDate'))
    .refine((value) => value <= formatDate(new Date().toISOString()), message('birthDate')),
  phone: z.string().regex(PHONE_PATTERN, message('phone')),
} as const;

export const memberCreateSchema = z.object({
  email: z
    .string()
    .min(3, message('email'))
    .max(EMAIL_MAX_LENGTH, message('email'))
    .regex(EMAIL_PATTERN, message('email'))
    .pipe(z.email(message('email'))),
  password: memberPasswordSchema,
  ...profile,
});

/**
 * 활동제한은 불량회원일 때만 필수·알려진 값이어야 한다. 일반회원으로 바꾸면 숨긴 초안은 유지되지만 검증하지 않고,
 * 제출값에서는 빠진다(`toMemberSettings`).
 */
export const memberEditSchema = z
  .object({
    accountStatus: z.enum(memberAccountStatuses),
    restrictions: z.array(z.string()),
    ...profile,
  })
  .superRefine((value, ctx) => {
    if (value.accountStatus !== 'flagged') return;
    const known = (item: string): item is MemberRestriction => (memberRestrictions as readonly string[]).includes(item);
    if (value.restrictions.length === 0 || !value.restrictions.every(known)) {
      ctx.addIssue({ code: 'custom', path: ['restrictions'], message: i18n.t('members:form.errors.restrictions') });
    }
  });

/** TanStack Form 이 보관하는 입력 값. */
export type MemberProfileInput = z.input<z.ZodObject<typeof profile>>;
export type MemberCreateInput = z.input<typeof memberCreateSchema>;
export type MemberEditInput = z.input<typeof memberEditSchema>;
/** 유효 submit 직후 `schema.parse` 가 만드는 값. */
export type MemberCreateValues = z.output<typeof memberCreateSchema>;
export type MemberEditValues = z.output<typeof memberEditSchema>;

/** 화면에 보이는 순서. invalid submit 의 "첫 오류"를 사용자가 보는 순서와 맞춘다. */
export const memberCreateFieldOrder = [
  'email',
  'password',
  'name',
  'birthDate',
  'phone',
] as const satisfies readonly (keyof MemberCreateInput)[];

export const memberEditFieldOrder = [
  'accountStatus',
  'restrictions',
  'name',
  'birthDate',
  'phone',
] as const satisfies readonly (keyof MemberEditInput)[];
