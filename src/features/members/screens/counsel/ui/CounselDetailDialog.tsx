import { type CounselDetail } from "../../../model/counsel-detail";
/**
 * 선택한 상담의 회원·예약 정보와 상담 기록 CRUD, 재발행 진입을 조립하는 팝업이다.
 * 실제 API에서도 팝업/폼 역할은 유지한다. 조회·저장 응답을 임의로 만들지 않고 입력과 대상 ID를 callback에 전달한다.
 */
import { toCounselDraft } from "@/features/members/mechanics/counsel-record/model/member-counsel-schema";
import { MemberCounselForm } from "@/features/members/mechanics/counsel-record/ui/MemberCounselForm";
import { maskEmail, maskPhone } from "@/shared/lib/mask-contact";
import { ConfirmDialog } from "@/shared/ui/dialog/ConfirmDialog";
import { DetailField } from "@/shared/ui/detail/DetailField";
import { Button } from "@/shared/ui/primitives/Button";
import { Dialog } from "@/shared/ui/primitives/Dialog";
import { useTranslation } from "react-i18next";
import { useCounselRecords } from "../../../mechanics/counsel-record/model/useCounselRecords";
import { formatMemberInstant } from "../../../lib/format-member-instant";
import { type MemberCounselInput } from "../../../model/member-counsel";
export function CounselDetailDialog({
  detail,
  operatorName,
  openedAt,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onReissue,
}: {
  readonly detail: CounselDetail;
  readonly operatorName: string;
  readonly openedAt: string;
  readonly onClose: () => void;
  readonly onCreate: (request: {
    counselId: string;
    input: MemberCounselInput;
  }) => void;
  readonly onUpdate: (request: {
    counselId: string;
    noteId: string;
    input: MemberCounselInput;
  }) => void;
  readonly onDelete: (request: { counselId: string; noteId: string }) => void;
  readonly onReissue: (id: string) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const {
    initialDraft,
    editing,
    setCreateDirty,
    setEditDirty,
    guard,
    deletion,
    edit,
  } = useCounselRecords({
    operatorName,
    openedAt,
    onDelete: (noteId) => onDelete({ counselId: detail.id, noteId }),
  });

  return (
    <>
      <Dialog
        open
        title={t("secondary.counsel")}
        closeLabel={shared("formAction.cancel")}
        onOpenChange={(open) => {
          if (!open) guard.close(onClose);
        }}
      >
        <h2>{t("secondary.fields.content")}</h2>
        <p>{detail.content}</p>
        <p>{formatMemberInstant(detail.receivedAt)}</p>
        <MemberCounselForm
          initialValues={initialDraft}
          label={t("counsel.create")}
          onSave={(input) => onCreate({ counselId: detail.id, input })}
          onDirtyChange={setCreateDirty}
        />
        {[...detail.records]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((record) => (
            <article key={record.id}>
              {editing === record.id ? (
                <MemberCounselForm
                  initialValues={toCounselDraft(record)}
                  label={t("counsel.edit")}
                  onDirtyChange={setEditDirty}
                  onSave={(input) =>
                    onUpdate({ counselId: detail.id, noteId: record.id, input })
                  }
                  onCancel={() => edit()}
                />
              ) : (
                <>
                  <dl>
                    <DetailField label={t("counsel.receivedAt")}>
                      {toCounselDraft(record).receivedAt.replace("T", " ")}
                    </DetailField>
                    <DetailField label={t("counsel.operatorName")}>
                      {record.operatorName}
                    </DetailField>
                    <DetailField label={t("counsel.inquiryType")}>
                      {t(`counsel.types.${record.inquiryType}`)}
                    </DetailField>
                    <DetailField label={t("counsel.answeredAt")}>
                      {toCounselDraft(record).answeredAt.replace("T", " ")}
                    </DetailField>
                  </dl>
                  <p>{record.content}</p>
                  <Button onClick={() => edit(record.id)}>
                    {t("counsel.edit")}
                  </Button>
                  <Button
                    onClick={() => deletion.requestConfirmation(record.id)}
                  >
                    {t("counsel.delete")}
                  </Button>
                  {record.inquiryType.startsWith("reprint") ? (
                    <Button onClick={() => onReissue(record.id)}>
                      {t("secondary.reissue")}
                    </Button>
                  ) : null}
                </>
              )}
            </article>
          ))}
        <h2>{t("secondary.fields.member")}</h2>
        <dl>
          <DetailField label={t("columns.email")}>
            {maskEmail(detail.email)}
          </DetailField>
          <DetailField label={t("columns.name")}>{detail.name}</DetailField>
          <DetailField label={t("columns.phone")}>
            {maskPhone(detail.phone)}
          </DetailField>
          <DetailField label={t("columns.accountStatus")}>
            {t(`accountStatus.${detail.accountStatus}`)}
          </DetailField>
        </dl>
        {detail.booking ? (
          <>
            <h2>{t("secondary.fields.performance")}</h2>
            <p>{detail.booking.performance}</p>
            <h2>{t("secondary.fields.booking")}</h2>
            <p>{detail.booking.booking}</p>
            <h2>{t("secondary.fields.booker")}</h2>
            <p>{detail.booking.booker}</p>
          </>
        ) : null}
      </Dialog>
      {guard.dialog}
      <ConfirmDialog
        open={deletion.state.kind === "confirm"}
        title={shared("alert.title")}
        description={shared("deleteConfirm.description")}
        confirmLabel={shared("formSave.confirm")}
        cancelLabel={shared("formSave.cancel")}
        onOpenChange={(open) => {
          if (!open) deletion.close();
        }}
        onConfirm={deletion.confirm}
      />
    </>
  );
}
