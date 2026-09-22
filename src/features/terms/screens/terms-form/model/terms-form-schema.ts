/**
 * 약관 등록·수정의 UI 입력 계약 — Figma 11.2.3(등록)·11.2.4(수정) `기본정보` 섹션(2026-09-22 aside
 * 실측). 등록과 수정이 하나의 스키마를 공유하는 근거는 11.2.4 수정 frame 이 등록과 같은 항목을 값만
 * 채워 보여 준다는 관찰이다. 다섯 항목 모두 `*` 필수다.
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. enum 좁히기는 output 쪽이 한다.
 *
 * 버전 규칙은 Notion 이 정한다 — `필수선택, 직접선택` · `입력가능문자 : 숫자, 점(.)` ·
 * `입력가능글자수 : 10자 이하`. frame 이 입력 안에 그리는 `V` 접두 표기는 값이 아니라 장식이고,
 * 공용 텍스트 입력에 접두 adornment 가 없어 TERMS-FORM 의 보류로 남는다.
 *
 * frame 이 그리지만 이 계약에 없는 것과 그 이유는 TERMS-FORM fact 의 `범위 내 보류` 가 이름으로 적는다:
 * 시행일·게시일의 시·분·초(공용 입력이 날짜까지만 받는다), 본문의 HTML 에디터(frame 의 `html editer`
 * 표기뿐이고 허용 요소가 미확인).
 */
import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import { termsStatuses } from '@/features/terms/model/terms';

const message = (key: string) => ({
  error: () => i18n.t(`terms:terms.form.errors.${key}`),
});

export const termsFormSchema = z.object({
  version: z
    .string()
    .trim()
    .min(1, message('version'))
    .max(10, message('versionLength'))
    .regex(/^[0-9.]+$/, message('versionFormat')),
  effectiveAt: z.string().trim().min(1, message('effectiveAt')),
  status: z.string().pipe(z.enum(termsStatuses, message('status'))),
  publishedAt: z.string().trim().min(1, message('publishedAt')),
  body: z.string().trim().min(1, message('body')),
});

export type TermsFormInput = z.input<typeof termsFormSchema>;
export type TermsFormValues = z.output<typeof termsFormSchema>;

/** 검증 실패가 처음 나온 입력으로 focus 를 옮길 때 쓰는 frame 순서. */
export const termsFormFieldOrder = [
  'version',
  'effectiveAt',
  'status',
  'publishedAt',
  'body',
] as const satisfies readonly (keyof TermsFormInput)[];
