/**
 * 게시물 등록·수정의 UI 입력 계약 — Figma 9.2.3(등록)·9.2.3.1(Case)·9.2.4(수정) `기본정보` 섹션
 * (2026-09-22 aside 실측). 등록과 수정이 하나의 스키마를 공유하는 근거는 9.2.4 수정 frame 이 등록과
 * 같은 항목을 값만 채워 보여 준다는 관찰이다.
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. enum 좁히기는 output 쪽이 한다.
 *
 * frame 이 그리지만 이 계약에 없는 입력과 그 이유는 POST-FORM fact 의 `범위 내 보류` 가 이름으로 적는다:
 * 파일첨부(다중 첨부·용량 출처·업로드 계약 미확인), 조회수 입력(편집의 의미 미확인),
 * 등록일의 시·분·초(원문은 `년월일 시분초 선택` 이라 적지만 공용 입력이 날짜까지만 받는다),
 * 내용의 HTML 에디터(Case 의 `html editer` 표기뿐이고 허용 요소가 미확인),
 * 작성자 검색 팝업(9.2.5.4)과 팝업 설정 섹션(등록 frame 에 없고 발동 조건이 미확인).
 */
import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import { postRecordCategories, postStatuses } from '@/features/community/model/post';

const message = (key: string) => ({
  error: () => i18n.t(`community:post.form.errors.${key}`),
});

export const postFormSchema = z
  .object({
    category: z.string().pipe(z.enum(postRecordCategories, message('category'))),
    boardId: z.string().trim().min(1, message('boardId')),
    /** 고른 게시판이 카테고리를 쓰지 않으면 선택지가 없고 빈 값이 정상이다. */
    boardCategoryId: z.string(),
    /** 게시판이 카테고리를 쓰는지. URL·요청으로 나가지 않는 화면 전용 사실이다. */
    boardCategoryRequired: z.boolean(),
    /** 수정 frame 은 `답변받을 이메일 *` 을 입력으로 그린다. 등록 frame 은 비활성이라 빈 값이다. */
    answerEmail: z.string(),
    answerEmailRequired: z.boolean(),
    title: z.string().trim().min(1, message('title')),
    content: z.string().trim().min(1, message('content')),
    registeredAt: z.string().trim().min(1, message('registeredAt')),
    status: z.string().pipe(z.enum(postStatuses, message('status'))),
  })
  .superRefine((value, context) => {
    const issue = (path: string, key: string) =>
      context.addIssue({
        code: 'custom',
        path: [path],
        message: i18n.t(`community:post.form.errors.${key}`),
      });
    if (value.boardCategoryRequired && value.boardCategoryId.trim() === '')
      issue('boardCategoryId', 'boardCategory');
    if (value.answerEmailRequired) {
      if (value.answerEmail.trim() === '') issue('answerEmail', 'answerEmail');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.answerEmail.trim()))
        issue('answerEmail', 'answerEmailFormat');
    }
  });

export type PostFormInput = z.input<typeof postFormSchema>;
export type PostFormValues = z.output<typeof postFormSchema>;

/** 검증 실패가 처음 나온 입력으로 focus 를 옮길 때 쓰는 frame 순서. */
export const postFormFieldOrder = [
  'category',
  'boardId',
  'boardCategoryId',
  'answerEmail',
  'title',
  'content',
  'registeredAt',
  'status',
] as const satisfies readonly (keyof PostFormInput)[];
