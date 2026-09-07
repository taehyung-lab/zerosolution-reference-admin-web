/** 상담 ID 조회는 공용 상세 Query로 실행한다. 옵션·출력 예시는 각 서버 계약 확인 전 임시 입력이다. */
import { useDetailQuery } from "@/api/required-query";
import { useLocale } from "@/shared/i18n/locale-context";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  counselDetailQuery,
  counselReissueInputQuery,
} from "../../../api/detail-queries";

// TRANSPLANT_PENDING_MEMBER_COUNSEL_QUERY: detail, category and printer reads await their server contracts.
export function useMemberCounselData(counselId: string | undefined) {
  const { t } = useTranslation("members");
  const { locale } = useLocale();
  const query = useDetailQuery(counselDetailQuery(locale, counselId));
  // 프린터 목록·미리보기는 상담 상세와 별개의 조회다. 실패와 "프린터 없음"은 다른 사실이므로 상태를 그대로 넘긴다.
  // 이미 받은 목록이 있으면 갱신 실패로 선택지를 빼앗지 않는다. 로딩·실패는 아직 보여줄 값이 없을 때만이다.
  const printing = useQuery(counselReissueInputQuery(locale));
  const printed = printing.data;
  return {
    ...query,
    detail: query.data,
    inquiryOptions: [
      { value: "reference", label: t("secondary.example.category") },
    ],
    operatorName: t("secondary.example.operator"),
    printing: {
      printers: printed?.printers ?? [],
      preview: printed?.preview ?? null,
      isPending: printed === undefined && printing.isPending,
      isError: printed === undefined && printing.isError,
      onRetry: () => {
        void printing.refetch();
      },
    },
  };
}
