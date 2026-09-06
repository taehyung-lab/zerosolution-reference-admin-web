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
