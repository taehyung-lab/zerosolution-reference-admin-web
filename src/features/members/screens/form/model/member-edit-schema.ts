import { type MemberEditValues } from "../../../model/member-edit-values";
/**
 * 회원 수정 필드 검증과 일반회원의 활동제한 제출값 정리를 담당한다.
 * API 이후에도 화면 입력 변환은 필요하다. 서버가 초기화를 빈 배열/null/생략 중 무엇으로 받는지는 DTO 변환에서 확인한다.
 */
import { i18n } from "@/shared/i18n/i18n";
import { z } from "zod";
import {
  memberAccountStatuses,
  memberRestrictions,
} from "../../../model/account";
import { memberCreateSchema } from "./member-create-schema";

export const memberEditSchema = memberCreateSchema
  .pick({ name: true, birthDate: true, phone: true })
  .extend({
    accountStatus: z.enum(memberAccountStatuses),
    restrictions: z.array(z.string()),
  })
  .superRefine((value, context) => {
    if (value.accountStatus !== "flagged") return;
    if (
      value.restrictions.length === 0 ||
      value.restrictions.some(
        (item) => !memberRestrictions.some((known) => item === known),
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["restrictions"],
        message: i18n.t("members:edit.restrictionsRequired"),
      });
    }
  });

// 확인된 화면 입력이지 서버 DTO는 아니다. 활동제한 초기화 값을 전송하는 표현은 서버 계약을 기다린다.
export function toMemberEditInput(values: MemberEditValues): MemberEditValues {
  const parsed = memberEditSchema.parse(values);
  return {
    ...parsed,
    restrictions: parsed.accountStatus === "flagged" ? parsed.restrictions : [],
  };
}
