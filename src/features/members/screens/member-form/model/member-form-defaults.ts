import type { MemberProfile } from '@/features/members/model/member';
import type { MemberCreateInput, MemberEditInput } from './member-form-schema';

/** 등록의 빈 초기값(Figma 4.2.2). */
export const memberCreateDefaults: MemberCreateInput = {
  email: '',
  password: '',
  name: '',
  birthDate: '',
  phone: '',
};

/** 수정 화면은 조회한 회원의 값을 그대로 싣는다(Figma 4.2.3). 이메일은 읽기 전용이라 폼 값이 아니다. */
export function toMemberEditDefaults(member: MemberProfile): MemberEditInput {
  return {
    accountStatus: member.accountStatus,
    restrictions: [...member.restrictions],
    name: member.name,
    birthDate: member.birthDate,
    phone: member.phone,
  };
}
