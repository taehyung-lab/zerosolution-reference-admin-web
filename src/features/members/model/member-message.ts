/**
 * 조회된 회원 연락처에서 메시지 수신자 표시값을 만드는 순수 변환이다.
 * 조회 자체는 Query가 소유한다. 목록 셀의 마스킹 값에서 원본 주소를 되돌리지 않으며,
 * 실제 발송의 ID/주소 계약이 확인되면 연락처 출처와 이 변환을 함께 교체한다.
 */
import type { MemberProfile } from "./member-profile";

/** 발송에 필요한 최소 사실이다. 서버 DTO가 아니라 화면이 이미 조회한 값의 부분집합이다. */
export interface MemberContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export interface MemberMessageTarget {
  readonly name: string;
  readonly address: string;
}

export function memberProfileContact(member: MemberProfile): MemberContact {
  return {
    id: member.id,
    name: member.values.name,
    phone: member.values.phone,
    email: member.email,
  };
}

/**
 * 선택한 ID 중 조회된 연락처가 있는 대상만 수신자로 만든다.
 * 아직 조회되지 않은 ID는 주소를 지어내지 않고 제외한다.
 */
export function memberMessageRecipients(
  contacts: readonly MemberContact[],
  channel: "sms" | "email",
  ids: readonly string[],
): readonly MemberMessageTarget[] {
  return ids.flatMap((id) => {
    const contact = contacts.find((candidate) => candidate.id === id);
    return contact === undefined
      ? []
      : [
          {
            name: contact.name,
            address: channel === "sms" ? contact.phone : contact.email,
          },
        ];
  });
}
