import { z } from 'zod'
import { managerFormTypes } from '../api/manager-form-contract'
import { i18n } from '@/shared/i18n/i18n'

/**
 * Manager 등록/수정의 UI 입력 계약.
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고, 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. 숫자·enum 변환은 request mapper 가 소유한다.
 *
 * create 와 edit 은 필드 집합 자체가 다르므로(등록만 아이디·비밀번호, 수정은 아이디가 읽기 전용)
 * 하나의 스키마에 mode 를 넣지 않고 안정 field fragment 만 공유한다.
 */

const message = (key: string) => ({ error: () => i18n.t(`managers:form.errors.${key}`) })

// 리허설 계약 `mr.ManagerDTO$Create` 가 선언한 pattern 을 그대로 옮긴다.
const NAME_PATTERN = /^[가-힣A-Za-z ]{2,10}$/
const ID_PATTERN = /^[A-Za-z0-9]{6,20}$/
const PHONE_PATTERN = /^[0-9-]{9,15}$/
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

// [가정] Figma placeholder `영문 대/소문자+숫자+특수문자 중 3종류 이상, 8~20자 내외`.
// 리허설 계약은 password 제약을 선언하지 않으므로 서버와 일치한다는 근거가 없다.
// 문자군의 정확한 정의(대문자와 소문자를 별개로 셈)도 확인되지 않았다.
const PASSWORD_CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
const PASSWORD_MIN_CLASSES = 3

// [가정] Figma placeholder 는 이메일 `3~100자 내외`, 리허설 description 은 `3~20자` 로 서로 다르다.
// 20자는 실제 이메일을 막을 위험이 커서 느슨한 쪽을 택했다. 서버가 거부하면 field error 로 표시된다.
const EMAIL_MAX_LENGTH = 100
// [가정] Figma placeholder `20자 내외`. 리허설 계약에는 소속 길이 제약이 없다.
const ORGANIZATION_MAX_LENGTH = 20

/** 등록·수정에서 규칙까지 동일하다고 확인된 필드만 공유한다. 아이디·비밀번호는 등록 전용이라 여기 없다. */
const managerProfileShape = {
  // [가정] Figma 등록/수정에는 기획사 선택 필드가 없는데 리허설 계약은 `type=AGENCY` 일 때 필수라고 한다.
  // 저장이 서버에서 실패하지 않도록 조건부 필드를 노출한다. 제품 확인 시 재검토한다.
  type: z.string().min(1, message('typeRequired')).pipe(z.enum(managerFormTypes)),
  agencyId: z.string(),
  permissionId: z.string().min(1, message('permissionRequired')),
  name: z.string().regex(NAME_PATTERN, message('name')),
  // [가정] Figma 는 `휴대폰번호 *` 로 필수 표시, 리허설 계약은 optional. UI 가 더 엄격한 쪽은 서버가 거부하지 않는다.
  phone: z.string().regex(PHONE_PATTERN, message('phone')),
  email: z.string().max(EMAIL_MAX_LENGTH, message('email')).regex(EMAIL_PATTERN, message('email')),
  organization: z.string().max(ORGANIZATION_MAX_LENGTH, message('organization')),
} as const

function requireAgencyWhenTypeIsAgency(
  value: { readonly type: string; readonly agencyId: string },
  ctx: z.RefinementCtx,
) {
  if (value.type === managerFormTypes.AGENCY && value.agencyId === '') {
    ctx.addIssue({
      code: 'custom',
      path: ['agencyId'],
      message: i18n.t('managers:form.errors.agencyRequired'),
    })
  }
}

export const managerCreateSchema = z
  .object({
    ...managerProfileShape,
    id: z.string().regex(ID_PATTERN, message('id')),
    password: z
      .string()
      .min(8, message('password'))
      .max(20, message('password'))
      .refine(
        (value) => PASSWORD_CHARACTER_CLASSES.filter((pattern) => pattern.test(value)).length >= PASSWORD_MIN_CLASSES,
        message('password'),
      ),
    passwordConfirm: z.string().min(1, message('passwordConfirmRequired')),
  })
  .superRefine((value, ctx) => {
    requireAgencyWhenTypeIsAgency(value, ctx)
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirm'],
        message: i18n.t('managers:form.errors.passwordMismatch'),
      })
    }
  })

export const managerEditSchema = z.object(managerProfileShape).superRefine(requireAgencyWhenTypeIsAgency)

/** TanStack Form 이 보관하는 입력 값(문자열). */
export type ManagerCreateInput = z.input<typeof managerCreateSchema>
export type ManagerEditInput = z.input<typeof managerEditSchema>

/** 유효 submit 직후 `schema.parse` 가 만드는 값. `type` 만 enum 으로 좁혀진다. */
export type ManagerCreateValues = z.output<typeof managerCreateSchema>
export type ManagerEditValues = z.output<typeof managerEditSchema>

/**
 * 화면에 보이는 순서. invalid submit 에서 "첫 오류"를 사용자가 보는 순서와 같게 고르기 위해 쓴다.
 * Figma `11.1.3 운영자 등록` / `11.1.4 운영자 수정` 의 2열 배치를 좌→우, 위→아래로 읽은 순서다.
 */
export const managerCreateFieldOrder = [
  'type',
  'permissionId',
  'agencyId',
  'id',
  'password',
  'passwordConfirm',
  'name',
  'phone',
  'email',
  'organization',
] as const satisfies readonly (keyof ManagerCreateInput)[]

export const managerEditFieldOrder = [
  'type',
  'permissionId',
  'agencyId',
  'name',
  'phone',
  'email',
  'organization',
] as const satisfies readonly (keyof ManagerEditInput)[]
