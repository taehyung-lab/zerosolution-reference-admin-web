import {
  memberRestrictions,
  type MemberCreateSettings,
  type MemberRestriction,
  type MemberSettings,
} from '@/features/members/model/member';
import type { MemberCreateValues, MemberEditValues } from './member-form-schema';

/** 검증된 폼 값에서 저장 항목만 골라 담는다. 반환 타입 표기가 초과 속성을 typecheck 에서 거부한다. */
export function toMemberCreateSettings(values: MemberCreateValues): MemberCreateSettings {
  return {
    email: values.email,
    password: values.password,
    name: values.name,
    birthDate: values.birthDate,
    phone: values.phone,
  };
}

/** 일반회원의 숨긴 활동제한 초안은 제출값에 싣지 않는다. 불량회원의 값은 스키마가 이미 알려진 값으로 좁혔다. */
export function toMemberSettings(values: MemberEditValues): MemberSettings {
  const known = (item: string): item is MemberRestriction => (memberRestrictions as readonly string[]).includes(item);
  return {
    name: values.name,
    birthDate: values.birthDate,
    phone: values.phone,
    accountStatus: values.accountStatus,
    restrictions: values.accountStatus === 'flagged' ? values.restrictions.filter(known) : [],
  };
}
