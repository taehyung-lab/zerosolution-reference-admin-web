// TRANSPLANT_PENDING_MESSAGE_POLICY: replace development input with the confirmed marketing policy query.
export function messagePolicyFixture(channel: "sms" | "email") {
  return {
    enabled: true,
    channelEnabled: true,
    senderName: "REFERENCE",
    senderAddress: channel === "sms" ? "0200000000" : "sender@example.test",
  };
}
