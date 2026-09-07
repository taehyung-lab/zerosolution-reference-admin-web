import { managerPasswordSchema } from "../../../model/manager-password";
/**
 * 운영자 등록·수정의 UI 검증·공통 필드·오류 포커스 순서를 정의한다.
 * 실제 API에서도 프런트 검증은 필요하며 인증·중복·서버 상태 전이 검증을 대신하지 않는다.
 */
import { i18n } from "@/shared/i18n/i18n";
import { z } from "zod";

/**
 * Manager 등록/수정의 UI 입력 계약.
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고, 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. 숫자·enum 변환은 request mapper 가 소유한다.
 *
 * create 와 edit 은 필드 집합 자체가 다르므로(등록만 아이디·비밀번호, 수정은 아이디가 읽기 전용)
 * 하나의 스키마에 mode 를 넣지 않고 안정 field fragment 만 공유한다.
 */

const message = (key: string) => ({
  error: () => i18n.t(`managers:form.errors.${key}`),
});

// Product input constraints: Notion 설정 > 운영자, registration and password/unlock dialogs.
const NAME_PATTERN =
  /^[\p{Script=Hangul}\p{Script=Latin}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9ー]{1,10}$/u;
const ID_PATTERN = /^[A-Za-z0-9]{6,20}$/;
const PHONE_PATTERN = /^[0-9-]{1,20}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9@._-]+$/;

// Notion에서 확인한 입력 길이 제한이다. 서버 전용 제약은 별도의 계약으로 확인한다.
const EMAIL_MAX_LENGTH = 100;
const ORGANIZATION_MAX_LENGTH = 20;

/** 등록·수정에서 규칙까지 동일하다고 확인된 필드만 공유한다. 아이디·비밀번호는 등록 전용이라 여기 없다. */
const managerProfileShape = {
  type: z.string().min(1, message("typeRequired")),
  // 기존 폼 연결을 위해 기획사 입력을 유지한다. 기존 API의 기획사 조건은 요청 mapper에서만 적용한다.
  agencyId: z.string(),
  permissionId: z.string().min(1, message("permissionRequired")),
  name: z.string().regex(NAME_PATTERN, message("name")),
  phone: z.string().regex(PHONE_PATTERN, message("phone")),
  email: z
    .string()
    .min(3, message("email"))
    .max(EMAIL_MAX_LENGTH, message("email"))
    .regex(EMAIL_PATTERN, message("email"))
    .pipe(z.email(message("email"))),
  organization: z
    .string()
    .max(ORGANIZATION_MAX_LENGTH, message("organization")),
} as const;

export const managerCreateSchema = z
  .object({
    ...managerProfileShape,
    id: z.string().regex(ID_PATTERN, message("id")),
    password: managerPasswordSchema,
    passwordConfirm: z.string().min(1, message("passwordConfirmRequired")),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: i18n.t("managers:form.errors.passwordMismatch"),
      });
    }
  });

export const managerEditSchema = z.object(managerProfileShape);

/** TanStack Form 이 보관하는 입력 값(문자열). */
export type ManagerCreateInput = z.input<typeof managerCreateSchema>;
export type ManagerEditInput = z.input<typeof managerEditSchema>;

/** 유효 submit 직후 `schema.parse`가 만드는 제품 입력. wire enum은 mapper에서 검사한다. */
export type ManagerCreateValues = z.output<typeof managerCreateSchema>;
export type ManagerEditValues = z.output<typeof managerEditSchema>;

/**
 * 화면에 보이는 순서. invalid submit 에서 "첫 오류"를 사용자가 보는 순서와 같게 고르기 위해 쓴다.
 * Figma `11.1.3 운영자 등록` / `11.1.4 운영자 수정` 의 2열 배치를 좌→우, 위→아래로 읽은 순서다.
 */
export const managerCreateFieldOrder = [
  "type",
  "permissionId",
  "agencyId",
  "id",
  "password",
  "passwordConfirm",
  "name",
  "phone",
  "email",
  "organization",
] as const satisfies readonly (keyof ManagerCreateInput)[];

export const managerEditFieldOrder = [
  "type",
  "permissionId",
  "agencyId",
  "name",
  "phone",
  "email",
  "organization",
] as const satisfies readonly (keyof ManagerEditInput)[];
