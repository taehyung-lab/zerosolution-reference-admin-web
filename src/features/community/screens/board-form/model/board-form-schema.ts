/**
 * 게시판 등록·수정의 UI 입력 계약 — Figma 9.1.3(등록)·9.1.3.1(Case)·9.1.4(수정) `기본정보` 섹션의 항목 전부
 * (2026-09-11 aside 실측, 원장 15행). 원문 「게시판을 등록할 수 있다」는 구분·게시판명·쓰기 권한의 규칙만 적고
 * 나머지 항목은 Figma 가 정본이다(판독 규칙: 구성은 Figma, 동작은 Notion).
 *
 * 값은 전부 문자열이다. `Select` 의 값 계약이 `string | null` 이고 빈 선택을 `''` 로 표현해야
 * placeholder 상태를 스키마가 거부할 수 있기 때문이다. enum 좁히기와 숫자 변환은 output 쪽이 한다.
 *
 * 하위 항목은 상위 값이 켤 때만 필수다(frame 관찰): 등급 ← 권한=회원등급, 제목 목록 ← 게시글 제목 지정=운영자가
 * 제목 지정, 용량제한 ← 파일첨부=사용, 비밀댓글·댓글 알림 ← 댓글=사용, 중복 허용 ← 표시=사용.
 * 등록과 수정이 하나의 스키마를 공유하는 근거는 9.1.4 수정 frame 이 등록과 같은 항목을 값만 채워 보여 준다는
 * 관찰이다(질문 30 해소). 유형은 두 frame 모두 읽기 전용 `일반`이라 입력이 아니다.
 */
import { i18n } from '@/shared/i18n/i18n';
import { z } from 'zod';
import {
  BOARD_ATTACHMENT_LIMIT_MAX_MB,
  BOARD_NAME_MAX_LENGTH,
  BOARD_POST_TITLE_MAX_LENGTH,
  boardCommentNoticeModes,
  boardMemberGrades,
  boardPermissions,
  boardPostTitleModes,
  boardRatingModes,
  boardRecordCategories,
  boardSecretCommentModes,
  boardUsages,
} from '@/features/community/model/board';

const message = (key: string) => ({
  error: () => i18n.t(`community:board.form.errors.${key}`),
});

const usage = (key: string) => z.string().pipe(z.enum(boardUsages, message(key)));

export const boardFormSchema = z
  .object({
    category: z.string().pipe(z.enum(boardRecordCategories, message('category'))),
    // 길이는 placeholder `게시판명 (30자 내외)` 의 상한으로 읽는다. 문자 제약은 원문에 없다.
    name: z.string().trim().min(1, message('name')).max(BOARD_NAME_MAX_LENGTH, message('nameLength')),
    writePermission: z.string().pipe(z.enum(boardPermissions, message('writePermission'))),
    writeMemberGrade: z.string(),
    readPermission: z.string().pipe(z.enum(boardPermissions, message('readPermission'))),
    readMemberGrade: z.string(),
    categoryUsage: usage('categoryUsage'),
    postTitleMode: z.string().pipe(z.enum(boardPostTitleModes, message('postTitleMode'))),
    managerTitles: z.array(z.string().trim().min(1, message('managerTitles')).max(BOARD_POST_TITLE_MAX_LENGTH, message('managerTitleLength'))),
    html: usage('html'),
    attachment: usage('attachment'),
    attachmentLimitMb: z.string(),
    popup: usage('popup'),
    rating: z.string().pipe(z.enum(boardRatingModes, message('rating'))),
    comment: usage('comment'),
    secretComment: z.string(),
    commentNotice: z.string(),
    viewCountDisplay: usage('viewCountDisplay'),
    viewCountDuplicate: z.string(),
    usage: usage('usage'),
  })
  .superRefine((value, context) => {
    const issue = (path: string, key: string) =>
      context.addIssue({ code: 'custom', path: [path], message: i18n.t(`community:board.form.errors.${key}`) });
    if (value.writePermission === 'MEMBER_GRADE' && !boardMemberGrades.includes(value.writeMemberGrade as never))
      issue('writeMemberGrade', 'memberGrade');
    if (value.readPermission === 'MEMBER_GRADE' && !boardMemberGrades.includes(value.readMemberGrade as never))
      issue('readMemberGrade', 'memberGrade');
    if (value.postTitleMode === 'MANAGER_TITLES' && value.managerTitles.length === 0)
      issue('managerTitles', 'managerTitles');
    if (value.attachment === 'IN_USE') {
      const digits = /^\d+$/.test(value.attachmentLimitMb);
      const limit = Number(value.attachmentLimitMb);
      if (!digits || limit < 1 || limit > BOARD_ATTACHMENT_LIMIT_MAX_MB) issue('attachmentLimitMb', 'attachmentLimitMb');
    }
    if (value.comment === 'IN_USE') {
      if (!boardSecretCommentModes.includes(value.secretComment as never)) issue('secretComment', 'secretComment');
      if (!boardCommentNoticeModes.includes(value.commentNotice as never)) issue('commentNotice', 'commentNotice');
    }
    if (value.viewCountDisplay === 'IN_USE' && !boardUsages.includes(value.viewCountDuplicate as never))
      issue('viewCountDuplicate', 'viewCountDuplicate');
  });

/** TanStack Form 이 보관하는 입력 값(문자열·문자열 배열). */
export type BoardFormInput = z.input<typeof boardFormSchema>;

/** 유효 submit 직후 `schema.parse` 가 만드는 제품 입력(하위 항목은 문자열 그대로이며 요청 mapper 가 좁힌다). */
export type BoardFormValues = z.output<typeof boardFormSchema>;

/** 화면에 보이는 순서(Figma 9.1.3). invalid submit 의 "첫 오류"를 사용자가 보는 순서와 맞춘다. */
export const boardFormFieldOrder = [
  'category',
  'name',
  'writePermission',
  'writeMemberGrade',
  'readPermission',
  'readMemberGrade',
  'categoryUsage',
  'postTitleMode',
  'managerTitles',
  'html',
  'attachment',
  'attachmentLimitMb',
  'popup',
  'rating',
  'comment',
  'secretComment',
  'commentNotice',
  'viewCountDisplay',
  'viewCountDuplicate',
  'usage',
] as const satisfies readonly (keyof BoardFormInput)[];
