import { z } from "zod";
import { i18n } from "@/shared/i18n/i18n";
import { memberAccountStatuses, memberRestrictions } from "../model/account";
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

export type MemberEditValues = z.infer<typeof memberEditSchema>;

// This is confirmed UI input, not a server DTO. The transport's clear-value encoding awaits its contract.
export function toMemberEditInput(values: MemberEditValues): MemberEditValues {
  const parsed = memberEditSchema.parse(values);
  return {
    ...parsed,
    restrictions: parsed.accountStatus === "flagged" ? parsed.restrictions : [],
  };
}
