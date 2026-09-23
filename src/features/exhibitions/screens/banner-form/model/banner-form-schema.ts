/**
 * 배너 등록·수정의 UI 입력 계약 — Figma 7.1.3(등록)·7.1.3.1(등록 Case 정의)·7.1.4(수정) `기본정보`
 * 섹션(2026-09-23 aside 실측). 수정 frame 이 등록과 같은 항목을 값만 채워 보여 주므로 하나의 스키마를
 * 공유한다. 항목은 모두 `*` 필수다.
 *
 * 규칙의 출처:
 * - 게시순서: Notion `필수입력, 직접입력` · `입력가능문자 : 숫자` · `입력가능글자수 : 1~3자리`, frame 안내
 *   `숫자만 입력 가능합니다.` — 형식 오류 문구는 그 안내 문장이다.
 * - 배너명: Notion `필수입력, 직접입력`. 글자수는 이 화면 원문 절에 없고 frame placeholder `500자 내외` 와
 *   화면 간 원문의 `입력가능글자수 : 1~500자` 행이 말한다(추론) — 입력의 `maxLength` 로만 건다.
 * - 이미지: frame 안내 `지원확장자 : png, 1MB 이하` 를 검증한다. `{n}` 권장 크기는 값이 없어 검증하지 않는다.
 * - 게시기간: Notion `필수선택, 직접선택` · `시작 년월일~종료 년월일 선택` · `default : 미선택`. frame 이
 *   입력에 그린 `12:00:00` 시각은 Notion 이 `년월일` 이라 적어 받지 않는다(BANNER-FORM 미확인 3).
 * - 게시 상태: 등록 Case 정의와 수정 frame 이 `게시상태 *` select(대기·게시중·종료)를 그린다. 등록 본
 *   frame 은 그 자리를 그리지 않는다(BANNER-FORM 미확인 1).
 *
 * select 값은 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. enum 좁히기는 output 쪽이 한다.
 * 화면 고유 필수 문구가 없어 필수 누락은 공용 문구를 쓴다.
 */
import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import {
  bannerCategories,
  bannerLinkTypes,
  bannerStatuses,
} from '@/features/exhibitions/model/banner';
import type { FormDateRangeValue } from '@/shared/ui/form/FormDateRangeField';
import type { FormFileValue } from '@/shared/ui/form/FormFileField';

const required = { error: () => i18n.t('shared:formError.required') };
const message = (key: string) => ({ error: () => i18n.t(`exhibitions:banner.form.errors.${key}`) });

/** frame 안내 `png, 1MB 이하`. 1MB 는 1,024 × 1,024 바이트로 읽는다(BANNER-FORM 미확인 4). */
export const BANNER_IMAGE_MAX_BYTES = 1024 * 1024;
export const BANNER_IMAGE_ACCEPT = 'image/png,.png';
export const BANNER_ORDER_MAX_LENGTH = 3;
export const BANNER_NAME_MAX_LENGTH = 500;

function isPng(file: File): boolean {
  return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
}

export const bannerFormSchema = z.object({
  category: z.string().pipe(z.enum(bannerCategories, required)),
  order: z
    .string()
    .trim()
    .min(1, required)
    .regex(/^\d{1,3}$/, message('orderFormat')),
  name: z.string().trim().min(1, required),
  linkType: z.string().pipe(z.enum(bannerLinkTypes, required)),
  linkUrl: z.string().trim().min(1, required),
  image: z
    .custom<FormFileValue>()
    .refine((value) => value.kind === 'selected' || value.kind === 'existing', required)
    .refine(
      (value) => value.kind !== 'selected' || (isPng(value.file) && value.file.size <= BANNER_IMAGE_MAX_BYTES),
      message('imageFile'),
    ),
  postPeriod: z
    .custom<FormDateRangeValue>()
    .refine((value) => value.from !== '' && value.to !== '', required),
  status: z.string().pipe(z.enum(bannerStatuses, required)),
});

export type BannerFormInput = z.input<typeof bannerFormSchema>;
export type BannerFormValues = z.output<typeof bannerFormSchema>;

/** 검증 실패가 처음 나온 입력으로 focus 를 옮길 때 쓰는 frame 순서. */
export const bannerFormFieldOrder = [
  'category',
  'order',
  'name',
  'linkType',
  'linkUrl',
  'image',
  'postPeriod',
  'status',
] as const satisfies readonly (keyof BannerFormInput)[];
