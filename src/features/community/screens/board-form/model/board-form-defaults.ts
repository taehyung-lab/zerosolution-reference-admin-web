import type { BoardDetail, BoardPermissionSetting, BoardSettings } from '@/features/community/model/board';
import type { BoardFormInput, BoardFormValues } from './board-form-schema';

/**
 * 등록 화면의 초기 값 — Figma 9.1.3 등록 frame 이 보여 주는 첫 상태(2026-09-11 실측): 구분 일반, 카테고리 사용,
 * HTML·파일첨부·팝업·조회수 표시·중복 허용 사용안함, 평점·댓글·댓글 알림 사용안함, 사용상태 사용, 권한·게시글 제목 지정·
 * 비밀댓글은 `선택`(빈 값). 원문 40행 `구분 → default : 일반` 과 일치한다.
 */
export const boardCreateDefaults: BoardFormInput = {
  category: 'GENERAL',
  name: '',
  writePermission: '',
  writeMemberGrade: '',
  readPermission: '',
  readMemberGrade: '',
  categoryUsage: 'IN_USE',
  postTitleMode: '',
  managerTitles: [],
  html: 'NOT_IN_USE',
  attachment: 'NOT_IN_USE',
  attachmentLimitMb: '',
  popup: 'NOT_IN_USE',
  rating: 'NOT_IN_USE',
  comment: 'NOT_IN_USE',
  secretComment: '',
  commentNotice: 'NOT_IN_USE',
  viewCountDisplay: 'NOT_IN_USE',
  viewCountDuplicate: 'NOT_IN_USE',
  usage: 'IN_USE',
};

/** 수정 화면은 조회한 게시판의 설정을 그대로 싣는다(Figma 9.1.4). */
export function toBoardEditDefaults(detail: BoardDetail): BoardFormInput {
  return {
    category: detail.category,
    name: detail.name,
    writePermission: detail.write.permission,
    writeMemberGrade: detail.write.memberGrade ?? '',
    readPermission: detail.read.permission,
    readMemberGrade: detail.read.memberGrade ?? '',
    categoryUsage: detail.categoryUsage,
    postTitleMode: detail.postTitleMode,
    managerTitles: [...detail.managerTitles],
    html: detail.html,
    attachment: detail.attachment,
    attachmentLimitMb: detail.attachmentLimitMb === undefined ? '' : String(detail.attachmentLimitMb),
    popup: detail.popup,
    rating: detail.rating,
    comment: detail.comment,
    secretComment: detail.secretComment ?? '',
    commentNotice: detail.commentNotice ?? '',
    viewCountDisplay: detail.viewCountDisplay,
    viewCountDuplicate: detail.viewCountDuplicate ?? 'NOT_IN_USE',
    usage: detail.usage,
  };
}

const permission = (value: BoardFormValues['writePermission'], grade: string): BoardPermissionSetting =>
  value === 'MEMBER_GRADE' ? { permission: value, memberGrade: grade as BoardPermissionSetting['memberGrade'] } : { permission: value };

/**
 * 유효한 폼 값을 저장 입력으로 옮긴다. 상위가 꺼진 하위 항목은 값을 남기지 않는다(스키마가 검증만 하고 지우지는
 * 않으므로 여기서 한 번 정리한다). 유형은 입력이 아니라 `일반` 고정이다(두 frame 모두 읽기 전용).
 */
export function toBoardSettings(values: BoardFormValues): BoardSettings {
  return {
    type: 'GENERAL',
    category: values.category,
    name: values.name,
    write: permission(values.writePermission, values.writeMemberGrade),
    read: permission(values.readPermission, values.readMemberGrade),
    categoryUsage: values.categoryUsage,
    postTitleMode: values.postTitleMode,
    managerTitles: values.postTitleMode === 'MANAGER_TITLES' ? values.managerTitles : [],
    html: values.html,
    attachment: values.attachment,
    ...(values.attachment === 'IN_USE' ? { attachmentLimitMb: Number(values.attachmentLimitMb) } : {}),
    popup: values.popup,
    rating: values.rating,
    comment: values.comment,
    ...(values.comment === 'IN_USE'
      ? {
          secretComment: values.secretComment as BoardSettings['secretComment'],
          commentNotice: values.commentNotice as BoardSettings['commentNotice'],
        }
      : {}),
    viewCountDisplay: values.viewCountDisplay,
    ...(values.viewCountDisplay === 'IN_USE' ? { viewCountDuplicate: values.viewCountDuplicate as BoardSettings['viewCountDuplicate'] } : {}),
    usage: values.usage,
  };
}
