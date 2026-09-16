import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import {
  PRINTER_MODEL_MAX_LENGTH,
  PRINTER_NAME_MAX_LENGTH,
  PRINTER_SERIAL_NO_MAX_LENGTH,
  printerPurposes,
  printerStatuses,
  printerUsages,
} from '@/features/ticketing/model/printer';

/**
 * 6.7.1.3 등록 · 6.7.1.4 수정의 UI 입력 계약. 두 frame 의 항목·필수 표시·기본값이 같아 한 schema 를 쓴다.
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 schema 가 거부할 수 있기 때문이다.
 *
 * 필수는 frame 의 `*` 다: 기기명·시리얼번호·상태·용도·사용상태. 길이는 등록 frame 의 placeholder
 * (`기기명 (1~100자 내외)`·`시리얼번호 (1~100자 내외)`·`모델명 (100자 내외)`)와 원문
 * 「스마트프린터를 등록할 수 있다」의 `기기명 → 입력가능글자수 : 1~100자` 다.
 * 제조사·보관위치·조치사항의 상한과 입력가능문자는 두 원문에 없어 만들지 않는다.
 */
const message = (key: string) => ({ error: () => i18n.t(`ticketing:printer.form.errors.${key}`) });

export const printerFormSchema = z.object({
  name: z.string().trim().min(1, message('name')).max(PRINTER_NAME_MAX_LENGTH, message('nameLength')),
  serialNo: z
    .string()
    .trim()
    .min(1, message('serialNo'))
    .max(PRINTER_SERIAL_NO_MAX_LENGTH, message('serialNoLength')),
  model: z.string().trim().max(PRINTER_MODEL_MAX_LENGTH, message('modelLength')),
  manufacturer: z.string().trim(),
  purchasedAt: z.string(),
  location: z.string().trim(),
  status: z.enum(printerStatuses, message('status')),
  measures: z.string().trim(),
  purpose: z.enum(printerPurposes, message('purpose')),
  usage: z.enum(printerUsages, message('usage')),
});

/** TanStack Form 이 보관하는 입력 값. */
export type PrinterFormInput = z.input<typeof printerFormSchema>;
/** 유효 submit 직후 `schema.parse` 가 만드는 제품 입력. */
export type PrinterFormValues = z.output<typeof printerFormSchema>;

/**
 * 화면에 보이는 순서. invalid submit 에서 "첫 오류"를 사용자가 보는 순서와 같게 고르기 위해 쓴다.
 * 등록·수정 frame 의 2열 배치를 좌→우, 위→아래로 읽은 순서다.
 */
export const printerFormFieldOrder = [
  'name',
  'serialNo',
  'model',
  'manufacturer',
  'purchasedAt',
  'location',
  'status',
  'measures',
  'purpose',
  'usage',
] as const satisfies readonly (keyof PrinterFormInput)[];
