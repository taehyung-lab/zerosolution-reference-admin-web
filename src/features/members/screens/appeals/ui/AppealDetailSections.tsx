/**
 * 소명 상세의 회원 정보·첨부 신청 내용·저장된 처리 결과를 표시하는 section 컴포넌트다.
 * 표시 책임은 API 이후에도 유지하며 조회·저장·발송은 수행하지 않는다.
 */
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { DetailField } from "@/shared/ui/detail/DetailField";
import { SectionCard } from "@/shared/ui/layout/SectionCard";
import { useTranslation } from "react-i18next";
import { formatMemberInstant } from "../../../lib/format-member-instant";

import type { AppealRecord } from "../../../model/appeal-record";

export function AppealMemberSection({
  record,
  memberHref,
}: {
  readonly record: AppealRecord;
  readonly memberHref: string;
}) {
  const { t } = useTranslation("members");
  return (
    <SectionCard title={t("secondary.fields.member")}>
      <dl>
        <DetailField label={t("columns.accountStatus")}>
          {t(`accountStatus.${record.accountStatus}`)}
        </DetailField>
        <DetailField label={t("filters.restrictions")}>
          {record.restrictions
            .map((value) => t(`restriction.${value}`))
            .join(", ")}
        </DetailField>
        <DetailField label={t("form.birthDate")}>
          {record.birthDate}
        </DetailField>
        <DetailField label={t("columns.joinedAt")}>
          {formatMemberInstant(record.joinedAt)}
        </DetailField>
        <DetailField label={t("columns.signupMethod")}>
          {t(`signup.${record.signupMethod}`)}
        </DetailField>
        <DetailField label={t("columns.email")}>
          {maskEmail(record.email)}
        </DetailField>
        <DetailField label={t("columns.name")}>{record.name}</DetailField>
        <DetailField label={t("columns.phone")}>
          {maskPhone(record.phone)}
        </DetailField>
      </dl>
      <a href={memberHref} target="_blank" rel="noopener noreferrer">
        {t("secondary.appeal.memberLink")}
      </a>
    </SectionCard>
  );
}
export function AppealApplicationSection({
  record,
}: {
  readonly record: AppealRecord;
}) {
  const { t } = useTranslation("members");
  return (
    <SectionCard title={t("secondary.appeal.application")}>
      <DetailField label={t("secondary.fields.appliedAt")}>
        {formatMemberInstant(record.appliedAt)}
      </DetailField>
      <p>{record.application}</p>
      {record.attachments.map((file) => (
        <a key={file.href} href={file.href} download>
          {file.name}
        </a>
      ))}
    </SectionCard>
  );
}
export function AppealProcessingDetails({
  record,
}: {
  readonly record: AppealRecord;
}) {
  const { t } = useTranslation("members");
  return (
    <>
      <dl>
        <DetailField label={t("secondary.fields.status")}>
          {t(`secondary.states.${record.processing.status}`)}
        </DetailField>
        <DetailField label={t("secondary.fields.result")}>
          {t(`secondary.states.${record.processing.result}`)}
        </DetailField>
        {record.processing.result === "rejected" ? (
          <>
            <DetailField label={t("secondary.appeal.reason")}>
              {record.processing.reason
                ? t(`secondary.appeal.${record.processing.reason}`)
                : "—"}
            </DetailField>
            {record.processing.reason === "other" ? (
              <DetailField label={t("secondary.appeal.direct")}>
                {record.processing.direct}
              </DetailField>
            ) : null}
          </>
        ) : null}
        <DetailField label={t("secondary.appeal.opinion")}>
          {record.processing.opinion}
        </DetailField>
      </dl>
      <p>{t("secondary.appeal.notified")}</p>
    </>
  );
}
