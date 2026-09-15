import { useTranslation } from "react-i18next";
import { DetailStateBoundary } from "@/shared/ui/patterns/DetailStateBoundary";
import { ErrorTrace } from "@/shared/ui/patterns/ErrorTrace";
import { PageHeader } from "@/shared/ui/patterns/PageHeader";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { UpdateHistory } from "@/shared/ui/patterns/UpdateHistory";
import { usePerformanceDetail } from "../../../api/usePerformanceDetail";
import { PerformanceBasicSection } from "./PerformanceBasicSection";
import { PerformanceAdmissionSection } from "./PerformanceAdmissionSection";
import { toPerformanceHistoryEntries } from "../model/performance-history";

export function PerformanceDetailScreen({
  performanceId,
  onEdit,
}: {
  readonly performanceId: string;
  readonly onEdit: (id: string) => void;
}) {
  const { t } = useTranslation("performances");
  const { t: shared } = useTranslation("shared");
  const detail = usePerformanceDetail(performanceId);
  return (
    <section>
      <PageHeader
        title={t("detail.title")}
        breadcrumbs={[t("detail.path"), t("title"), t("detail.view")]}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: shared("error.kind.business"),
          notFound: shared("error.kind.notFound"),
        }}
        onRetry={() => void detail.retry()}
        retryLabel={shared("error.unexpected.retry")}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <div className="space-y-5">
            <PerformanceAdmissionSection
              admission={detail.data.admission}
              onEdit={() => onEdit(performanceId)}
            />
            <PerformanceBasicSection
              key={performanceId}
              basic={detail.data.basic}
            />
            {detail.data.history.length > 0 ? (
              <SectionCard title={t("detail.history")}>
                <UpdateHistory
                  entries={toPerformanceHistoryEntries(detail.data.history, t)}
                  labels={{
                    date: t("detail.historyDate"),
                    change: t("detail.historyChange"),
          actor: t("detail.historyManager"),
                  }}
                  emptyText={t("detail.emptyValue")}
                />
              </SectionCard>
            ) : null}
          </div>
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}
