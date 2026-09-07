/**
 * 회원 상세 액션의 구분·요청 입력과 액션별 프런트 검증 스키마를 정의한다.
 * 화면 입력 계약이며 실제 비밀번호 확인·탈퇴·권한 판정은 서버 계약과 실행 결과를 따른다.
 */
import { z } from "zod";
import { i18n } from "@/shared/i18n/i18n";
import { memberPasswordSchema } from "../form/member-create-schema";

export type MemberDetailAction = "password" | "reveal" | "withdraw";
export type MemberDetailActionRequest =
  | {
      readonly kind: "password";
      readonly memberId: string;
      readonly password: string;
    }
  | {
      readonly kind: "reveal";
      readonly memberId: string;
      readonly operatorPassword: string;
    }
  | {
      readonly kind: "verifyWithdrawal";
      readonly memberId: string;
      readonly reason: string;
      readonly operatorPassword: string;
    };

export const memberChangePasswordSchema = z
  .object({
    password: memberPasswordSchema,
    passwordConfirmation: z
      .string()
      .min(1, { error: () => i18n.t("members:detailAction.passwordMismatch") }),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    error: () => i18n.t("members:detailAction.passwordMismatch"),
  });

export const memberRevealSchema = z.object({
  operatorPassword: z
    .string()
    .min(1, { error: () => i18n.t("members:detailAction.operatorRequired") }),
});

export const memberVerificationFormSchema = memberRevealSchema.extend({
  reason: z.string(),
});

export const memberVerifyWithdrawalSchema = memberRevealSchema.extend({
  reason: z
    .string()
    .min(5, { error: () => i18n.t("members:detailAction.reasonRequired") }),
});
