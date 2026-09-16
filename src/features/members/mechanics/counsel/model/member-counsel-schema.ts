import { z } from 'zod';
import {
  memberCounselTypes,
  type MemberCounselInput,
  type MemberCounselValues,
} from '@/features/members/model/member-counsel';
import { displayTimeZone, formatDate, formatTimeInTimeZone, zonedDateTimeToUtc } from '@/shared/lib/datetime';

/**
 * 상담 한 건의 화면 입력 검증과 UTC instant ↔ 브라우저 지역시각 변환. 회원 조회의 상담 절과 회원상담 팝업이 같은
 * 규칙을 쓴다. 문의유형 코드와 서버 DTO 의 일치는 계약에서 따로 확인한다.
 */
export function memberCounselSchema(today: string, requiredMessage: string, dateMessage: string) {
  const datetime = z.iso
    .datetime({ local: true, precision: -1, error: dateMessage })
    .refine((value) => value.slice(0, 10) <= today, dateMessage);
  return z.object({
    receivedAt: datetime,
    answeredAt: datetime,
    operatorName: z.string().trim().min(1, requiredMessage),
    inquiryType: z.enum(memberCounselTypes, { error: requiredMessage }),
    content: z.string().min(1, requiredMessage),
  });
}

export function toCounselDraft(record: MemberCounselInput): MemberCounselValues {
  const local = (instant: string) => `${formatDate(instant)}T${formatTimeInTimeZone(instant, displayTimeZone())}`;
  return {
    receivedAt: local(record.receivedAt),
    answeredAt: local(record.answeredAt),
    operatorName: record.operatorName,
    inquiryType: record.inquiryType,
    content: record.content,
  };
}

export function toCounselInput(
  values: MemberCounselValues,
  today: string,
  requiredMessage: string,
  dateMessage: string,
): MemberCounselInput {
  const parsed = memberCounselSchema(today, requiredMessage, dateMessage).parse(values);
  const instant = (local: string) => zonedDateTimeToUtc(local.slice(0, 10), local.slice(11), displayTimeZone());
  return { ...parsed, receivedAt: instant(parsed.receivedAt), answeredAt: instant(parsed.answeredAt) };
}
