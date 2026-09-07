/**
 * 회원 상세 안의 상담 작성·기록 편집·삭제 영역이다.
 * 폼과 편집 상태는 API 이후에도 유지하며 레코드 저장소나 서버 성공 상태는 이 section에서 만들지 않는다.
 */
import { useCounselRecords } from "./useCounselRecords";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import { ListResult, type ListResultData } from "@/shared/ui/patterns/ListResult";
import { Button } from "@/shared/ui/primitives/Button";
import { MemberCounselForm } from "./MemberCounselForm";
import {
  toCounselDraft,
  type MemberCounselInput,
  type MemberCounselRecord,
} from "./member-counsel-schema";

/**
 * 상담 기록 절이 소비하는 조회 사실이다. 기록이 없는 것과 아직 오지 않은 것, 실패한 것을 구분한다.
 * 작성 폼은 이 상태와 무관하게 계속 mount 상태로 남아 초안을 잃지 않는다.
 */
export type MemberCounselRecords = ListResultData<MemberCounselRecord>;

export function MemberCounselSection({
  records,
  operatorName,
  openedAt,
  onCreate,
  onUpdate,
  onDelete,
}: {
  readonly records: MemberCounselRecords;
  readonly operatorName: string;
  readonly openedAt: string;
  readonly onCreate: (input: MemberCounselInput) => void;
  readonly onUpdate: (id: string, input: MemberCounselInput) => void;
  readonly onDelete: (id: string) => void;
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
    onDelete: onDelete,
  });

  return (
    <div className="space-y-6">
      {guard.dialog}
      <ConfirmDialog
        open={deletion.state.kind === "confirm"}
        title={shared("alert.title")}
        description={t("counsel.confirmDelete")}
        confirmLabel={shared("bulkAction.acknowledge")}
        cancelLabel={shared("bulkAction.cancel")}
        onOpenChange={(open) => {
          if (!open) deletion.close();
        }}
        onConfirm={deletion.confirm}
      />
      <MemberCounselForm
        initialValues={initialDraft}
        label={t("counsel.create")}
        onSave={onCreate}
        onDirtyChange={setCreateDirty}
      />
      <ListResult
        data={records}
        copy={{
          // 이 절에는 검색 시작 게이트가 없어 notSearched에 도달하지 않는다.
          notSearched: t("counsel.empty"),
          empty: t("counsel.empty"),
        }}
      >
        {[...records.rows]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((record) => (
            <article
              key={record.id}
              aria-label={t("counsel.record", { name: record.operatorName })}
              className="space-y-2 border-t pt-4"
            >
              {editing === record.id ? (
                <MemberCounselForm
                  key={record.id}
                  initialValues={toCounselDraft(record)}
                  label={t("counsel.edit")}
                  onSave={(input) => onUpdate(record.id, input)}
                  onCancel={() => edit()}
                  onDirtyChange={setEditDirty}
                />
              ) : (
                <>
                  <dl className="grid gap-2 md:grid-cols-2">
                    <div>
                      <dt>{t("counsel.receivedAt")}</dt>
                      <dd>
                        {toCounselDraft(record).receivedAt.replace("T", " ")}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("counsel.operatorName")}</dt>
                      <dd>{record.operatorName}</dd>
                    </div>
                    <div>
                      <dt>{t("counsel.inquiryType")}</dt>
                      <dd>{t(`counsel.types.${record.inquiryType}`)}</dd>
                    </div>
                    <div>
                      <dt>{t("counsel.answeredAt")}</dt>
                      <dd>
                        {toCounselDraft(record).answeredAt.replace("T", " ")}
                      </dd>
                    </div>
                  </dl>
                  <p className="whitespace-pre-wrap">{record.content}</p>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => edit(record.id)}>
                      {t("counsel.edit")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => deletion.requestConfirmation(record.id)}
                    >
                      {t("counsel.delete")}
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))}
      </ListResult>
    </div>
  );
}
