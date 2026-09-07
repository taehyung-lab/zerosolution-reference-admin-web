export type MessageChannel = "sms" | "email";

export interface MessagePolicy {
  readonly enabled: boolean;
  readonly channelEnabled: boolean;
  readonly senderName: string;
  readonly senderAddress: string;
}
export interface MessageRecipient {
  readonly address: string;
  readonly name?: string;
}
export interface MessageValues {
  readonly senderName: string;
  readonly senderAddress: string;
  readonly recipients: readonly MessageRecipient[];
  readonly messageType: "information" | "advertisement";
  readonly body: string;
}
