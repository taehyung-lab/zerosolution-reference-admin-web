import type { MemberListActionRequest } from "@/features/members/list/member-row";
import { useState } from "react";
import type { MemberProfile } from "../model/member-profile";

export function useMemberActionRequest({
  findMember,
  onBulkChange,
}: {
  readonly findMember: (id: string) => MemberProfile | undefined;
  readonly onBulkChange: (
    request: Extract<MemberListActionRequest, { type: "bulkChange" }>,
  ) => void;
}) {
  const [message, setMessage] =
    useState<Extract<MemberListActionRequest, { type: "sms" | "email" }>>();
  const onActionRequest = (request: MemberListActionRequest) => {
    if (request.type === "bulkChange") onBulkChange(request);
    else setMessage(request);
  };
  const recipients =
    message?.targetIds.flatMap((id) => {
      const member = findMember(id);
      return member === undefined
        ? []
        : [
            {
              address:
                message.type === "sms" ? member.values.phone : member.email,
              name: member.values.name,
            },
          ];
    }) ?? [];
  return {
    onActionRequest,
    message:
      message === undefined ? undefined : { channel: message.type, recipients },
    closeMessage: () => setMessage(undefined),
  };
}
