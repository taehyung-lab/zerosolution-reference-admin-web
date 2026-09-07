import { i18n } from "@/shared/i18n/i18n";
import { hasRepeatedOrSequentialAsciiTriplet } from "@/shared/lib/ascii-triplet";
import { z } from "zod";
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
  .refine(
    (value) => !hasRepeatedOrSequentialAsciiTriplet(value),
    message("password"),
  );
