import { i18n } from "@/shared/i18n/i18n";
import { hasRepeatedOrSequentialAsciiTriplet } from "@/shared/lib/ascii-triplet";
import { z } from "zod";
const message = (key: string) => ({
  error: () => i18n.t(`managers:form.errors.${key}`),
});

// 제품 비밀번호 정책은 영문 대문자·소문자·숫자·특수문자를 서로 다른 문자군으로 센다.
const PASSWORD_CHARACTER_CLASSES = [
  /[a-z]/,
  /[A-Z]/,
  /[0-9]/,
  /[^A-Za-z0-9\s]/,
];

const PASSWORD_MIN_CLASSES = 3;

export const managerPasswordSchema = z
  .string()
  .min(8, message("password"))
  .max(20, message("password"))
  .refine(
    (value) =>
      PASSWORD_CHARACTER_CLASSES.filter((pattern) => pattern.test(value))
        .length >= PASSWORD_MIN_CLASSES,
    message("password"),
  )
  .refine(
    (value) => !hasRepeatedOrSequentialAsciiTriplet(value),
    message("password"),
  );
