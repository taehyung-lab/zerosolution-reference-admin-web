import { z } from "zod";
import { i18n } from "@/shared/i18n/i18n";
import { formatDate } from "@/shared/lib/datetime";

const message = (field: string) => ({
  error: () => i18n.t(`members:form.errors.${field}`),
});

function hasConsecutiveCharacters(value: string) {
  const characters = value.toLowerCase();
  for (let index = 0; index < characters.length - 2; index += 1) {
    const triplet = characters.slice(index, index + 3);
    if (!/^[a-z]{3}$|^[0-9]{3}$/.test(triplet)) continue;
    const first = triplet.charCodeAt(0);
    const second = triplet.charCodeAt(1);
    const third = triplet.charCodeAt(2);
    if (first === second && second === third) return true;
    if (second - first === third - second && Math.abs(second - first) === 1)
      return true;
  }
  return false;
}

export const memberPasswordSchema = z
  .string()
  .min(8, message("password"))
  .max(20, message("password"))
  .refine(
    (value) =>
      [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9\s]/].filter((pattern) =>
        pattern.test(value),
      ).length >= 3,
    message("password"),
  )
  .refine((value) => !hasConsecutiveCharacters(value), message("password"));

export const memberCreateSchema = z.object({
  email: z
    .string()
    .min(3, message("email"))
    .max(100, message("email"))
    .regex(/^[A-Za-z0-9@._-]+$/, message("email"))
    .pipe(z.email(message("email"))),
  password: memberPasswordSchema,
  name: z
    .string()
    .min(1, message("name"))
    .max(10, message("name"))
    .regex(
      /^[\p{Script=Hangul}\p{Script=Latin}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9ー]+$/u,
      message("name"),
    ),
  birthDate: z.iso
    .date(message("birthDate"))
    .refine(
      (value) => value <= formatDate(new Date().toISOString()),
      message("birthDate"),
    ),
  phone: z
    .string()
    .min(1, message("phone"))
    .max(20, message("phone"))
    .regex(/^[0-9-]+$/, message("phone")),
});

export type MemberCreateValues = z.infer<typeof memberCreateSchema>;

export const memberCreateDefaults: MemberCreateValues = {
  email: "",
  password: "",
  name: "",
  birthDate: "",
  phone: "",
};

export const memberCreateFieldOrder = [
  "email",
  "password",
  "name",
  "birthDate",
  "phone",
] as const;
