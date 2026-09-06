import { useTranslation } from "react-i18next";
import { env } from "@/env";
import {
  counselDetailFixture,
  reissueInputFixture,
} from "../fixtures/member-records";

// TRANSPLANT_PENDING_MEMBER_COUNSEL_QUERY: detail, category and printer reads await their server contracts.
export function useMemberCounselData(counselId: string | undefined) {
  const { t } = useTranslation("members");
  return {
    detail:
      counselId && env.VITE_REFERENCE_SCENARIOS
        ? counselDetailFixture(counselId)
        : undefined,
    inquiryOptions: env.VITE_REFERENCE_SCENARIOS
      ? [{ value: "reference", label: t("secondary.example.category") }]
      : [],
    operatorName: env.VITE_REFERENCE_SCENARIOS
      ? t("secondary.example.operator")
      : "",
    printing: env.VITE_REFERENCE_SCENARIOS
      ? reissueInputFixture()
      : { printers: [], preview: "" },
  };
}
