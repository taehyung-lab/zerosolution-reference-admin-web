import { i18n } from '@/shared/i18n/i18n';
import { hasRepeatedOrSequentialAsciiTriplet } from '@/shared/lib/ascii-triplet';
import { z } from 'zod';

const message = { error: () => i18n.t('members:form.errors.password') };

/** 제품 비밀번호 정책: 8~20자, 영문 대·소문자·숫자·특수문자 중 3종류 이상, 연속·반복 3자 금지. */
export const memberPasswordSchema = z
  .string()
  .min(8, message)
  .max(20, message)
  .refine(
    (value) => [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9\s]/].filter((pattern) => pattern.test(value)).length >= 3,
    message,
  )
  .refine((value) => !hasRepeatedOrSequentialAsciiTriplet(value), message);
