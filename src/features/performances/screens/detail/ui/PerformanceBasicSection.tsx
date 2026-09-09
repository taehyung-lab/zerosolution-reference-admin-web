import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  displayTimeZone,
  formatDate,
  formatTimeInTimeZone,
} from "@/shared/lib/datetime";
import { DetailField } from "@/shared/ui/patterns/DetailField";
import { SectionCard } from "@/shared/ui/patterns/SectionCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/primitives/Tabs";
import { Table, TableCell, TableHead } from "@/shared/ui/primitives/Table";
import type { PerformanceBasicInfo } from "../../../model/performance-detail";

const languages = ["ko", "ja", "en"] as const;

function dateTime(value: string) {
  return `${formatDate(value)} ${formatTimeInTimeZone(value, displayTimeZone())}`;
}

export function PerformanceBasicSection({
  basic,
}: {
  readonly basic: PerformanceBasicInfo;
}) {
  const { t } = useTranslation("performances");
  const [language, setLanguage] = useState("ko");
  return (
    <SectionCard title={t("detail.basic")}>
      <dl className="grid md:grid-cols-2 md:gap-x-8">
        <DetailField label={t("fields.ticketKind")}>
          {basic.ticketKindLabel}
        </DetailField>
        <DetailField label={t("fields.performanceType")}>
          {basic.performanceTypeLabel}
        </DetailField>
      </dl>
      <Tabs value={language} onValueChange={setLanguage}>
        <TabsList aria-label={t("detail.language")}>
          {languages.map((code) => (
            <TabsTrigger key={code} value={code}>
              {t(`detail.languages.${code}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        {languages.map((code) => (
          <TabsContent key={code} value={code}>
            <dl className="grid md:grid-cols-2 md:gap-x-8">
              <DetailField label={t("fields.title")}>
                {basic.translations[code].title || t("detail.emptyValue")}
              </DetailField>
              <DetailField label={t("detail.subtitle")}>
                {basic.translations[code].subtitle || t("detail.emptyValue")}
              </DetailField>
              <DetailField label={t("fields.performers")}>
                {basic.translations[code].performers || t("detail.emptyValue")}
              </DetailField>
              <DetailField label={t("detail.organizer")}>
                {basic.translations[code].organizer || t("detail.emptyValue")}
              </DetailField>
            </dl>
          </TabsContent>
        ))}
      </Tabs>
      <dl>
        <DetailField label={t("fields.performedAt")}>
          {basic.sessions.map((session) => (
            <div key={session.id} className="mb-3">
              <p>{t("detail.session", { number: session.number })}</p>
              <p>
                {t("detail.interval", {
                  from: dateTime(session.startsAt),
                  to: dateTime(session.endsAt),
                })}
              </p>
            </div>
          ))}
        </DetailField>
        <DetailField label={t("detail.events")}>
          <Table>
            <thead>
              <tr>
                <TableHead>{t("detail.eventName")}</TableHead>
                <TableHead>{t("detail.eventPeriod")}</TableHead>
              </tr>
            </thead>
            <tbody>
              {basic.events.map((event) => (
                <tr key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {t("detail.interval", {
                      from: dateTime(event.startsAt),
                      to: dateTime(event.endsAt),
                    })}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </DetailField>
        <DetailField label={t("filters.venue")}>{basic.venueName}</DetailField>
        <DetailField label={t("detail.seats")}>
          <p>{basic.totalSeats.toLocaleString()}</p>
          {basic.sessions.map((session) => (
            <p key={session.id}>
              {t("detail.sessionSeats", {
                number: session.number,
                sold: session.soldSeats.toLocaleString(),
                unsold: session.unsoldSeats.toLocaleString(),
              })}
            </p>
          ))}
        </DetailField>
        <DetailField label={t("detail.grades")}>
          {basic.grades.map((grade) => grade.name).join(", ")}
        </DetailField>
      </dl>
    </SectionCard>
  );
}
