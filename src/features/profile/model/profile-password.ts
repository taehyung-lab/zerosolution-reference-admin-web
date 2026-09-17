import { z } from 'zod';
import { i18n } from '@/shared/i18n/i18n';
import { hasRepeatedOrSequentialAsciiTriplet } from '@/shared/lib/ascii-triplet';

/**
 * 내정보의 비밀번호 규칙. 출처는 내정보 원문 자체다 — 수정 절의 네 문장과 `[비밀번호 변경 팝업]`
 * 페이지가 같은 규칙을 적는다: 8~20자, 영문 대/소문자·숫자·특수문자 중 3종류 이상 조합,
 * 연속된 숫자·문자 3자 이상 불가, 같은 숫자·문자 3자 이상 불가.
 *
 * 문구는 팝업 원문의 `Case01` 하나다 — 원문이 글자수와 문자 조합을 한 메시지로 묶는다.
 * 직전 비밀번호 재사용(`Case02`)은 클라이언트가 알 수 없어 서버 판정이다.
 */
const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9\s]/];
const MIN_CLASSES = 3;
const message = { error: () => i18n.t('profile:form.errors.password') };

export const profilePasswordSchema = z
  .string()
  .min(8, message)
  .max(20, message)
  .refine(
    (value) => CHARACTER_CLASSES.filter((pattern) => pattern.test(value)).length >= MIN_CLASSES,
    message,
  )
  .refine((value) => !hasRepeatedOrSequentialAsciiTriplet(value), message);
