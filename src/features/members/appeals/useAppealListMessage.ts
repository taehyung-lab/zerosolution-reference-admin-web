import { useState } from "react";
import { memberRecordFixtures } from "../fixtures/member-records";
export function useAppealListMessage() {
  const [message, setMessage] = useState<{
    channel: "sms" | "email";
    ids: readonly string[];
  }>();
  const recipients = message
    ? memberRecordFixtures()
        .appeals.filter((row) => message.ids.includes(row.id))
        .map((row) => ({
          name: row.name,
          address: message.channel === "sms" ? row.phone : row.email,
        }))
    : [];
  return {
    message: message ? { channel: message.channel, recipients } : undefined,
    openMessage: (channel: "sms" | "email", ids: readonly string[]) =>
      setMessage({ channel, ids }),
    closeMessage: () => setMessage(undefined),
  };
}
