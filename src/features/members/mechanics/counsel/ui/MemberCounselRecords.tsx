import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  MemberCounselInput,
  MemberCounselRecord,
  MemberCounselRecords as MemberCounselRecordsData,
  MemberCounselValues,
} from '@/features/members/model/member-counsel';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { useUnsavedChangesGuard } from '@/shared/ui/form/UnsavedChangesGuard';
import { ListResult } from '@/shared/ui/list/ListResult';
import { Button } from '@/shared/ui/primitives/Button';
import { toCounselDraft } from '../model/member-counsel-schema';
import { MemberCounselForm } from './MemberCounselForm';

/**
 * 상담 기록 절: 신규 상담 폼 + 기록 목록(inline 수정·삭제 확인). 회원 조회와 회원상담 팝업이 같은 절을 쓰고,
 * 팝업은 `recordAction` 으로 재발권 진입을 덧붙인다. 신규 초안은 기록 조회의 로딩·실패와 무관하게 mount 를 유지해
 * 입력을 잃지 않는다. 편집 전환에는 편집 폼의 dirty 만 묻고, 신규 초안과 route 이탈은 함께 보호한다.
 */
export function MemberCounselRecords({
  records,
  operatorName,
  onCreate,
  onUpdate,
  onDelete,
  onDirtyChange,
  recordAction,
}: {
  readonly records: MemberCounselRecordsData;
  readonly operatorName: string;
  readonly onCreate: (input: MemberCounselInput) => Promise<unknown>;
  readonly onUpdate: (id: string, input: MemberCounselInput) => Promise<unknown>;
  readonly onDelete: (id: string) => Promise<unknown>;
  readonly onDirtyChange?: (dirty: boolean) => void;
  readonly recordAction?: (record: MemberCounselRecord) => ReactNode;
}) {
  const { t } = useTranslation('members');
  const { t: shared } = useTranslation('shared');
  const [openedAt] = useState(() => new Date().toISOString());
  const [initialDraft] = useState<MemberCounselValues>(() => ({
    ...toCounselDraft({ receivedAt: openedAt, answeredAt: openedAt, operatorName, inquiryType: 'other', content: '' }),
    inquiryType: '',
  }));
  const [editing, setEditing] = useState<string>();
  const [createDirty, setCreateDirty] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const dirty = createDirty || editDirty;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const guard = useUnsavedChangesGuard({ when: dirty });
  const deletion = useConfirmation<string>({ run: onDelete, description: shared('deleteConfirm.description') });
  const edit = (id?: string) => guard.close(() => setEditing(id), { when: editDirty });

  return (
    <div className="space-y-6">
      {guard.dialog}
      {deletion.dialog}
      <MemberCounselForm
        initialValues={initialDraft}
        label={t('counsel.create')}
        onSave={onCreate}
        onDirtyChange={setCreateDirty}
      />
      <ListResult data={records} copy={{ notSearched: t('counsel.empty'), empty: t('counsel.empty') }}>
        {[...records.rows]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((record) => (
            <article
              key={record.id}
              aria-label={t('counsel.record', { name: record.operatorName })}
              className="space-y-2 border-t pt-4"
            >
              {editing === record.id ? (
                <MemberCounselForm
                  key={record.id}
                  initialValues={toCounselDraft(record)}
                  label={t('counsel.edit')}
                  onSave={(input) => onUpdate(record.id, input)}
                  onCancel={() => edit()}
                  onDirtyChange={setEditDirty}
                />
              ) : (
                <>
                  <dl className="grid gap-2 md:grid-cols-2">
                    <div>
                      <dt>{t('counsel.receivedAt')}</dt>
                      <dd>{toCounselDraft(record).receivedAt.replace('T', ' ')}</dd>
                    </div>
                    <div>
                      <dt>{t('counsel.operatorName')}</dt>
                      <dd>{record.operatorName}</dd>
                    </div>
                    <div>
                      <dt>{t('counsel.inquiryType')}</dt>
                      <dd>{t(`counsel.types.${record.inquiryType}`)}</dd>
                    </div>
                    <div>
                      <dt>{t('counsel.answeredAt')}</dt>
                      <dd>{toCounselDraft(record).answeredAt.replace('T', ' ')}</dd>
                    </div>
                  </dl>
                  <p className="whitespace-pre-wrap">{record.content}</p>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => edit(record.id)}>
                      {t('counsel.edit')}
                    </Button>
                    <Button type="button" onClick={() => deletion.request(record.id)}>
                      {t('counsel.delete')}
                    </Button>
                    {recordAction?.(record)}
                  </div>
                </>
              )}
            </article>
          ))}
      </ListResult>
    </div>
  );
}
