/**
 * 게시판 등록·수정의 UI 입력 계약.
 *
 * 필드 집합은 Notion 원문 「게시판을 등록할 수 있다」가 열거한 셋뿐이다: 구분(필수선택, 일반·상담·
 * 공지사항 택1), 게시판명(필수입력), 권한 쓰기(비회원 포함·전체회원·회원등급·운영자 택1).
 * 원문이 등록 절에 적지 않은 `읽기` 권한·사용상태·카테고리·피드백 설정은 여기 없다(판정 문서 질문 27~29).
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. enum 좁히기는 output 쪽이 한다.
 *
 * 등록과 수정이 하나의 스키마를 공유하는 근거는 원문이 수정 화면의 필드를 따로 적지 않는다는 것이며,
 * 이는 관찰이 아니라 추론이다(판정 문서 질문 30). 수정 전용 규칙이 확인되면 스키마를 나눈다.
 */
import { i18n } from '@/shared/i18n/i18n';
import { z } from 'zod';
import { boardPermissions, boardRecordCategories } from '@/features/community/model/board';

const message = (key: string) => ({
  error: () => i18n.t(`community:board.form.errors.${key}`),
});

export const boardFormSchema = z.object({
  category: z.string().pipe(z.enum(boardRecordCategories, message('category'))),
  // 길이·문자 제약은 원문에 없다. `필수입력, 직접입력` 만 확정된 사실이라 공백만 거부한다.
  name: z.string().trim().min(1, message('name')),
  writePermission: z.string().pipe(z.enum(boardPermissions, message('writePermission'))),
});

/** TanStack Form 이 보관하는 입력 값(문자열). */
export type BoardFormInput = z.input<typeof boardFormSchema>;

/** 유효 submit 직후 `schema.parse` 가 만드는 제품 입력. */
export type BoardFormValues = z.output<typeof boardFormSchema>;

/** 화면에 보이는 순서. invalid submit 의 "첫 오류"를 사용자가 보는 순서와 맞춘다. */
export const boardFormFieldOrder = [
  'category',
  'name',
  'writePermission',
] as const satisfies readonly (keyof BoardFormInput)[];
