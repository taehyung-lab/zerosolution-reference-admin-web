/**
 * 열린 작성창의 채널 정책을 조회한다. 정책이 없으면 발신자 기본값과 채널 사용 여부를 알 수 없으므로
 * 빈 값으로 폼을 열지 않고 공용 단건 판정(useDetailQuery)의 상태를 그대로 화면에 넘긴다.
 */
import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { messagePolicyQuery } from "./api/queries";
import type { MessageChannel } from "./useMessageComposer";

export function useMessagePolicy(channel: MessageChannel | undefined) {
  const { locale } = useLocale();
  return useDetailQuery(messagePolicyQuery(locale, channel));
}
