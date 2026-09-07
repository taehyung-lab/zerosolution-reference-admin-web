import { useState } from "react";
import type { MessageRecipient } from "./message-schema";

export type MessageChannel = "sms" | "email";

// 연락처는 저장하지 않고 현재 데이터에서 다시 해석한다. 선택 당시의 대상과 채널만 보관한다.
export function useMessageComposer<TTarget>(
  resolveRecipients: (
    channel: MessageChannel,
    target: TTarget,
  ) => readonly MessageRecipient[],
) {
  const [intent, setIntent] = useState<{
    channel: MessageChannel;
    target: TTarget;
  }>();
  return {
    message:
      intent === undefined
        ? undefined
        : {
            channel: intent.channel,
            recipients: resolveRecipients(intent.channel, intent.target),
          },
    openMessage: (channel: MessageChannel, target: TTarget) =>
      setIntent({ channel, target }),
    closeMessage: () => setIntent(undefined),
  };
}
