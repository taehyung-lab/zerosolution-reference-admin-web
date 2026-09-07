import {
  memberCounselTypes,
  type MemberCounselInput,
  type MemberCounselValues,
} from "../../../model/member-counsel";
/**
 * 상담의 화면 입력 검증과 UTC instant/브라우저 지역시각 변환을 정의한다.
 * 입력 검증·시간 변환은 API 이후에도 필요하지만 상담 유형 코드와 서버 DTO의 일치 여부는 별도로 확인한다.
 */
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
  zonedDateTimeToUtc,
} from "@/shared/lib/datetime";
import { z } from "zod";

export function memberCounselSchema(
  today: string,
  requiredMessage: string,
  dateMessage: string,
) {
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

export function toCounselDraft(
  record: MemberCounselInput,
): MemberCounselValues {
  const local = (instant: string) =>
    `${formatDate(instant)}T${formatTimeInTimeZone(instant, displayTimeZone())}`;
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
  const parsed = memberCounselSchema(today, requiredMessage, dateMessage).parse(
    values,
  );
  const instant = (local: string) =>
    zonedDateTimeToUtc(local.slice(0, 10), local.slice(11), displayTimeZone());
  return {
    ...parsed,
    receivedAt: instant(parsed.receivedAt),
    answeredAt: instant(parsed.answeredAt),
  };
}
