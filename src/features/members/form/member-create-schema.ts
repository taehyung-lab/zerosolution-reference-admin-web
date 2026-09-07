/**
 * 회원 등록의 입력 규칙·빈 초기값·오류 포커스 순서를 정의한다.
 * 실제 API에서도 필요한 UI 검증이다. 중복 회원 여부나 비밀번호의 서버 이력 검사는 이 스키마가 대신하지 않는다.
 */
import { z } from "zod";
import { hasRepeatedOrSequentialAsciiTriplet } from "@/shared/lib/ascii-triplet";
import { i18n } from "@/shared/i18n/i18n";
import { formatDate } from "@/shared/lib/datetime";

const message = (field: string) => ({
  error: () => i18n.t(`members:form.errors.${field}`),
});


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
  .refine((value) => !hasRepeatedOrSequentialAsciiTriplet(value), message("password"));

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
