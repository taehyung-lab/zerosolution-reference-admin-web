import { useState } from "react";
import type { AppealRecord } from "./AppealDetailScreen";

export function useAppealDetailMessage(record: AppealRecord | undefined) {
  const [channel, setChannel] = useState<"sms" | "email">();
  return {
    message:
      channel && record
        ? {
            channel,
            recipients: [
              {
                name: record.name,
                address: channel === "sms" ? record.phone : record.email,
              },
            ],
          }
        : undefined,
    openMessage: setChannel,
    closeMessage: () => setChannel(undefined),
  };
}
