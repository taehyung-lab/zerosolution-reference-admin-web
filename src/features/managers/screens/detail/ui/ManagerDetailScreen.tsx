/**
 * 운영자 상세 조회 상태와 내용 표시를 분리한 화면이다.
 * ManagerDetailContent는 제품 상태/액션 callback 유무에 따라 표시가 달라진다. 실제 API 연결 시 상태 매핑과 액션 연결을 대조해 이중 의미를 정리해야 한다.
 */
import { formatDate } from "@/shared/lib/datetime";
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { ConfirmDialog } from "@/shared/ui/dialog/ConfirmDialog";
import { DetailField } from "@/shared/ui/detail/DetailField";
import { DetailStateBoundary } from "@/shared/ui/detail/DetailStateBoundary";
import { ErrorTrace } from "@/shared/ui/feedback/ErrorTrace";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { SectionCard } from "@/shared/ui/layout/SectionCard";
import { UpdateHistory } from "@/shared/ui/detail/UpdateHistory";
import { Badge } from "@/shared/ui/primitives/Badge";
import { Button } from "@/shared/ui/primitives/Button";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerDetail } from "../../../api/manager-detail-contract";
import { safeErrorKey } from "@/api/error-copy";
import { managerStatusMeta } from "../../../model/status";
import { toManagerHistoryEntries } from "../model/manager-history";
import { useManagerDetail } from "../../../api/useManagerDetail";
import { ManagerActionForm } from "./ManagerActionForm";

import type { ManagerAccountStatus } from "../../../model/account-status";
import type { ManagerDetailActionRequest } from "../model/manager-detail-actions";

export function ManagerDetailScreen({
  managerId,
}: {
  readonly managerId: string;
}) {
  const { t } = useTranslation("managers");
  const { t: sharedT } = useTranslation("shared");
  const detail = useManagerDetail(managerId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[t("path.settings"), t("path.managers"), t("path.detail")]}
        title={t("detailTitle")}
      />
      <DetailStateBoundary
        state={detail.state}
        labels={{
          error: detail.error
            ? sharedT(safeErrorKey(detail.error.kind))
            : t("detail.error"),
          notFound: t("detail.notFound"),
        }}
        retryLabel={t("result.retry")}
        onRetry={() => void detail.retry()}
        trace={detail.error ? <ErrorTrace value={detail.error} /> : null}
      >
        {detail.data ? (
          <ManagerDetailContent manager={detail.data} managerId={managerId} />
        ) : null}
      </DetailStateBoundary>
    </section>
  );
}

export function ManagerDetailContent({
  manager,
  managerId,
  accountStatus,
  onActionRequest,
}: {
  readonly manager: ManagerDetail;
  readonly managerId: string;
} & (
  | {
      readonly accountStatus: ManagerAccountStatus;
      readonly onActionRequest: (request: ManagerDetailActionRequest) => void;
    }
  | { readonly accountStatus?: undefined; readonly onActionRequest?: never }
)) {
  const { t } = useTranslation("managers");
  const { t: shared } = useTranslation("shared");
  const [action, setAction] = useState<ManagerDetailActionRequest["type"]>();
  const status = managerStatusMeta(manager.status?.id);
  const empty = t("detail.emptyValue");
  const editable =
    accountStatus === "active" ||
    accountStatus === "inactive" ||
    accountStatus === "locked";
  const confirmAction =
    action === "approve" ||
    action === "delete" ||
    action === "activate" ||
    action === "deactivate"
      ? action
      : undefined;
  return (
    <>
      <SectionCard title={t("detail.section")}>
        <dl className="grid md:grid-cols-2 md:gap-x-8">
          <DetailField label={t("detail.type")}>
            {manager.type?.name ?? empty}
          </DetailField>
          <DetailField label={t("detail.id")}>
            {manager.id ?? empty}
          </DetailField>
          {accountStatus ? (
            <DetailField label={t("form.password")}>
              <Button
                disabled={!editable}
                onClick={() => setAction("password")}
              >
                {t("actions.password")}
              </Button>
            </DetailField>
          ) : null}
          <DetailField label={t("detail.name")}>
            {manager.name ?? empty}
          </DetailField>
          <DetailField label={t("detail.phone")}>
            {manager.phone
              ? accountStatus
                ? maskPhone(manager.phone)
                : manager.phone
              : empty}
          </DetailField>
          <DetailField label={t("detail.email")}>
            {manager.email
              ? accountStatus
                ? maskEmail(manager.email)
                : manager.email
              : empty}
          </DetailField>
          <DetailField label={t("detail.organization")}>
            {manager.organization ?? manager.agency?.name ?? empty}
          </DetailField>
          <DetailField label={t("detail.permission")}>
            {manager.permission?.name ?? empty}
          </DetailField>
          <DetailField label={t("detail.registrationRoute")}>
            {manager.registrationRoute?.name ?? empty}
          </DetailField>
          <DetailField label={t("detail.status")}>
            <Badge tone={status.tone}>
              {accountStatus
                ? t(`accountStatus.${accountStatus}`)
                : t(status.labelKey)}
            </Badge>
            {accountStatus === "active" ? (
              <Button onClick={() => setAction("deactivate")}>
                {t("actions.deactivate")}
              </Button>
            ) : null}
            {accountStatus === "inactive" ? (
              <Button onClick={() => setAction("activate")}>
                {t("actions.activate")}
              </Button>
            ) : null}
            {accountStatus === "locked" ? (
              <Button onClick={() => setAction("unlock")}>
                {t("actions.unlock")}
              </Button>
            ) : null}
          </DetailField>
          <DetailField label={t("detail.createdAt")}>
            {formatDate(manager.createdAt) || empty}
          </DetailField>
          {(accountStatus === "rejected" ||
            (accountStatus === undefined &&
              manager.status?.id === "INACTIVE")) &&
          manager.statusReason ? (
            <DetailField label={t("detail.statusReason")}>
              {manager.statusReason}
            </DetailField>
          ) : null}
        </dl>
      </SectionCard>
      {accountStatus ? (
        <div className="mt-6 flex justify-center gap-2">
          {accountStatus !== "rejected" ? (
            <Button onClick={() => setAction("reveal")}>
              {t("actions.reveal")}
            </Button>
          ) : null}
          {accountStatus === "awaiting" ? (
            <>
              <Button onClick={() => setAction("approve")}>
                {t("actions.approve")}
              </Button>
              <Button onClick={() => setAction("reject")}>
                {t("actions.reject")}
              </Button>
            </>
          ) : null}
          {accountStatus === "rejected" ? (
            <Button onClick={() => setAction("delete")}>
              {t("actions.delete")}
            </Button>
          ) : null}
          {editable ? (
            <Button onClick={() => setAction("verifyWithdrawal")}>
              {t("actions.verifyWithdrawal")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-5">
        <SectionCard title={t("detail.history")}>
          <UpdateHistory
            entries={toManagerHistoryEntries(manager.changeLogs, t)}
            labels={{
              date: t("detail.historyDate"),
              change: t("detail.historyChange"),
              actor: t("detail.historyManager"),
            }}
            emptyText={t("detail.historyEmpty")}
          />
        </SectionCard>
      </div>
      {accountStatus === undefined || editable ? (
        <div className="mt-8 flex justify-center">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-8 text-sm font-medium text-white"
            params={{ managerId }}
            to="/managers/$managerId/edit"
          >
            {t("form.editAction")}
          </Link>
        </div>
      ) : null}
      {onActionRequest !== undefined && confirmAction ? (
        <ConfirmDialog
          open
          title={shared("alert.title")}
          // 삭제 확인은 공통 alert 카탈로그(1.1.3.1.1) 문장이라 shared 가 소유한다(dialogs.md).
          description={confirmAction === "delete" ? shared("deleteConfirm.description") : t(`actions.${confirmAction}Description`)}
          confirmLabel={
            confirmAction === "approve"
              ? t("actions.approveConfirm")
              : shared("formSave.confirm")
          }
          cancelLabel={shared("formSave.cancel")}
          onOpenChange={(open) => {
            if (!open) setAction(undefined);
          }}
          onConfirm={() => {
            onActionRequest({ type: confirmAction, managerId });
            setAction(undefined);
          }}
        />
      ) : null}
      {onActionRequest !== undefined &&
      action !== undefined &&
      confirmAction === undefined ? (
        <ManagerActionForm
          key={action}
          action={
            action as
              "reject" | "password" | "unlock" | "reveal" | "verifyWithdrawal"
          }
          managerId={managerId}
          onClose={() => setAction(undefined)}
          onActionRequest={onActionRequest}
        />
      ) : null}
    </>
  );
}
