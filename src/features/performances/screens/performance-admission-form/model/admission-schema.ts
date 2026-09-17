import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import type { FormFileValue } from '@/shared/ui/form/FormFileField';

/**
 * 5.2.3 공연 수정의 입력 계약. 수정 한쪽만 있는 화면이라 schema 도 하나다.
 *
 * 필수는 frame 의 `*`(안내 도면·게이트·구역·등급)와 원문 「입장안내정보를 수정할 수 있다」의
 * `1개의 파일 필수 선택` · `1개 이상의 게이트 필수 선택` · 구역 `필수입력, 입력가능글자 : 20자 이하,
 * 입력가능문자 : 제한없음` 이다(2026-09-17 Notion 원문·KeyScreen 재관찰).
 *
 * 입력 방식이 행의 어떤 값을 요구하는지를 정하므로 행 검증은 root 에서 한다 — 행 하나만 보면
 * 구역과 등급 중 무엇이 필수인지 알 수 없다.
 */
const required = { error: () => i18n.t('shared:formError.required') };

export const ADMISSION_AREA_MAX_LENGTH = 20;

export const admissionInputModes = ['zone', 'grade'] as const;

const guideRowSchema = z.object({
  /** 행 정체성. 삭제·추가 뒤에도 값과 오류가 그 행을 따라가게 한다. 저장 입력에는 싣지 않는다. */
  id: z.string(),
  gate: z.string().min(1, required),
  area: z.string().trim().max(ADMISSION_AREA_MAX_LENGTH),
  grades: z.array(z.string()),
});

export const admissionFormSchema = z
  .object({
    drawing: z.custom<FormFileValue>().refine(
      (value) => value.kind === 'selected' || value.kind === 'existing',
      required,
    ),
    inputMode: z.enum(admissionInputModes, required),
    guides: z.array(guideRowSchema).min(1),
  })
  .superRefine((values, context) => {
    values.guides.forEach((row, index) => {
      if (values.inputMode === 'zone' && row.area.trim() === '') {
        context.addIssue({
          code: 'custom',
          message: i18n.t('shared:formError.required'),
          path: ['guides', index, 'area'],
        });
      }
      if (values.inputMode === 'grade' && row.grades.length === 0) {
        context.addIssue({
          code: 'custom',
          message: i18n.t('shared:formError.required'),
          path: ['guides', index, 'grades'],
        });
      }
    });
  });

/** TanStack Form 이 보관하는 입력 값. */
export type AdmissionFormInput = z.input<typeof admissionFormSchema>;
/** 유효 submit 직후 `schema.parse` 가 만드는 제품 입력. */
export type AdmissionFormValues = z.output<typeof admissionFormSchema>;

/**
 * 섹션 안에서 보이는 순서. 잘못된 제출의 "첫 오류"를 사용자가 보는 순서와 같게 고른다.
 * 반복 행의 필드는 폼 생성 전에 정적으로 셀 수 없어 여기 없다 — 행 오류는 그 행에서 드러난다.
 */
export const admissionFormFieldOrder = [
  'drawing',
  'inputMode',
] as const satisfies readonly (keyof AdmissionFormInput)[];
