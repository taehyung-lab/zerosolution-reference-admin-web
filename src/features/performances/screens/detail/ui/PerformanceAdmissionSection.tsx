import { useTranslation } from "react-i18next";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import { Button } from "@/shared/ui/primitives/Button";
import { Table, TableHead, TableCell } from "@/shared/ui/primitives/Table";
import type { PerformanceAdmission } from "../../../model/performance-detail";

export function PerformanceAdmissionSection({
  admission,
  onEdit,
}: {
  readonly admission: PerformanceAdmission | null;
  readonly onEdit: () => void;
}) {
  const { t } = useTranslation("performances");
  return (
    <SectionCard title={t("detail.admission")}>
      {admission ? (
        <>
          <dl>
            <DetailField label={t("detail.drawing")}>
              <a
                href={admission.drawing.url}
                download={admission.drawing.name}
                className="underline"
              >
                {admission.drawing.name}
              </a>
            </DetailField>
          </dl>
          <h3>{t("detail.guide")}</h3>
          <dl>
            <DetailField label={t("detail.inputMode")}>
              {t(`detail.modes.${admission.inputMode}`)}
            </DetailField>
          </dl>
          <Table>
            <thead>
              <tr>
                <TableHead>{t("detail.gate")}</TableHead>
                <TableHead>
                  {t(`detail.modes.${admission.inputMode}`)}
                </TableHead>
              </tr>
            </thead>
            <tbody>
              {admission.guides.map((guide) => (
                <tr key={guide.id}>
                  <TableCell>{guide.gate}</TableCell>
                  <TableCell>{guide.areas.join(", ")}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <p>{t("detail.noAdmission")}</p>
      )}
      <div className="mt-5 flex justify-center">
        <Button onClick={onEdit}>{t("detail.edit")}</Button>
      </div>
    </SectionCard>
  );
}
