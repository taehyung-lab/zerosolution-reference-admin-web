/** 발송 정책의 임시 응답을 Query로 실행하는 연결부다. 서버 계약 확인 후 queryFn만 교체한다. */
import { queryOptions } from '@tanstack/react-query';
import { ApiError } from '@/api/error';
import { localizedQueryKey } from '@/api/query-key';
import { inlineProgress } from '@/api/query-meta';
import { messagePolicyFixture } from '../fixtures/message-policy';
import type { MessagePolicy } from '../message-schema';

/**
 * 채널별 발신자 기본값과 사용 여부다. 작성창 안에서만 필요한 조회이므로 앱 진입 overlay를 열지 않는다.
 * 열린 작성창이 없으면 조회할 채널도 없다.
 * TRANSPLANT_PENDING_MESSAGE_POLICY_CONTRACT: 실제 발송 정책 endpoint와 채널 코드가 미확인이다.
 */
export function messagePolicyQuery(
  locale: string,
  channel: 'sms' | 'email' | undefined
) {
  return queryOptions({
    queryKey: [...localizedQueryKey(locale, 'messaging', 'policy'), channel],
    enabled: channel !== undefined,
    queryFn: () =>
      Promise.resolve().then((): MessagePolicy => {
        if (channel === undefined)
          throw new ApiError({
            kind: 'not-found',
            message: '발송 채널이 없습니다.',
          });
        return messagePolicyFixture(channel);
      }),
    ...inlineProgress,
  });
}
