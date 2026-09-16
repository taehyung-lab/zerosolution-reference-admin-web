import type { BoardPermissionSetting, BoardSettings } from '@/features/community/model/board';
import type { BoardFormValues } from './board-form-schema';

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
