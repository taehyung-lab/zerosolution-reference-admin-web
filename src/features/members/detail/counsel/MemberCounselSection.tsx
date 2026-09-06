import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUnsavedChangesGuard } from "@/shared/ui/form/UnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/patterns/ConfirmDialog";
import { Button } from "@/shared/ui/primitives/Button";
import { MemberCounselForm } from "./MemberCounselForm";
import {
  toCounselDraft,
  type MemberCounselInput,
  type MemberCounselRecord,
  type MemberCounselValues,
} from "./member-counsel-schema";

export function MemberCounselSection({
  records,
  operatorName,
  openedAt,
  onCreate,
  onUpdate,
  onDelete,
}: {
  readonly records: readonly MemberCounselRecord[];
  readonly operatorName: string;
  readonly openedAt: string;
  readonly onCreate: (input: MemberCounselInput) => void;
  readonly onUpdate: (id: string, input: MemberCounselInput) => void;
  readonly onDelete: (id: string) => void;
}) {
  const { t } = useTranslation("members");
  const { t: shared } = useTranslation("shared");
  const [initialDraft] = useState<MemberCounselValues>(() => ({
    ...toCounselDraft({
      receivedAt: openedAt,
      answeredAt: openedAt,
      operatorName,
      inquiryType: "other",
      content: "",
    }),
    inquiryType: "",
  }));
  const [editing, setEditing] = useState<string>();
  const [createDirty, setCreateDirty] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [deleting, setDeleting] = useState<string>();
  const guard = useUnsavedChangesGuard({ when: createDirty || editDirty });
  const edit = (id?: string) =>
    guard.close(() => setEditing(id), { when: editDirty });

  return (
    <div className="space-y-6">
      {guard.dialog}
      <ConfirmDialog
        open={deleting !== undefined}
        title={shared("alert.title")}
        description={t("counsel.confirmDelete")}
        confirmLabel={shared("bulkAction.acknowledge")}
        cancelLabel={shared("bulkAction.cancel")}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        onConfirm={() => {
          if (deleting === undefined) return;
          const id = deleting;
          setDeleting(undefined);
          onDelete(id);
        }}
      />
      <MemberCounselForm
        initialValues={initialDraft}
        label={t("counsel.create")}
        onSave={onCreate}
        onDirtyChange={setCreateDirty}
      />
      {records.length === 0 ? (
        <p>{t("counsel.empty")}</p>
      ) : (
        [...records]
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
                      onClick={() => setDeleting(record.id)}
                    >
                      {t("counsel.delete")}
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))
      )}
    </div>
  );
}
