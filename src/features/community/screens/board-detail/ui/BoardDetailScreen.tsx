/**
 * 9.1.2 게시판 조회 — Figma frame(2026-09-11 aside 실측, 원장 14행): `기본정보` 섹션이 설정 항목을 읽기 전용으로
 * frame 의 행 단위로 보여 주고(카테고리 값 옆 `카테고리 설정` 버튼; `팝업`·등록일·최근업데이트일은 frame 에 없어 그리지
 * 않는다; `제목 지정`은 frame 에 없지만 운영자가 제목 지정일 때만 보인다 — 추론, 원장 14행 미확인), 업데이트 내역 섹션
 * (Figma 표기 `업데이트 이력`, 라벨은 판독 규칙상 Notion 어휘)과 하단 `수정`·`삭제`. 삭제는 공통 삭제 확인(1.1.3.1.1)을
 * 거쳐 mutation 에 닿는다. 그룹 소제목은 `dl` 밖의 heading 이고 frame 의 한 행이 `dl` 하나다(dl 은 dt/dd 만 담는다).
 * 헤더는 상태 경계 밖에 두어 조회 실패에도 제목이 남는다. 진입 실패는 route loader 가 처리했다.
 */
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteBoardMutation, saveBoardCategoriesMutation } from '@/features/community/api/mutations';
import { useBoardDetail } from '@/features/community/api/useBoardDetail';
import type { BoardDetail, BoardPermissionSetting } from '@/features/community/model/board';
import { useLocale } from '@/shared/i18n/locale-context';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { DetailField } from '@/shared/ui/detail/DetailField';
import { DetailStateBoundary } from '@/shared/ui/detail/DetailStateBoundary';
import { UpdateHistory } from '@/shared/ui/detail/UpdateHistory';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SectionCard } from '@/shared/ui/layout/SectionCard';
import { Button } from '@/shared/ui/primitives/Button';
import { toBoardHistoryEntries } from '../model/board-history';
import { CategorySettingsDialog } from './CategorySettingsDialog';

export function BoardDetailScreen({
  boardId,
  onEdit,
  onDeleted,
}: {
  readonly boardId: string;
  readonly onEdit: (boardId: string) => void;
  /** 삭제가 실제로 성공한 뒤의 이동. 서버가 없는 동안은 닿지 않는다. */
  readonly onDeleted: () => void;
}) {
  const { t } = useTranslation('community');
  const detail = useBoardDetail(boardId);

  return (
    <section>
      <PageHeader
        breadcrumbs={[
          t('board.breadcrumb.community'),
          t('board.breadcrumb.boards'),
          t('board.breadcrumb.detail'),
        ]}
        title={t('board.detail.title')}
      />
      <DetailStateBoundary query={detail}>
        {(board) => <BoardDetailContent board={board} onEdit={onEdit} onDeleted={onDeleted} />}
      </DetailStateBoundary>
    </section>
  );
}

function BoardDetailContent({
  board,
  onEdit,
  onDeleted,
}: {
  readonly board: BoardDetail;
  readonly onEdit: (boardId: string) => void;
  readonly onDeleted: () => void;
}) {
  const { t } = useTranslation('community');
  const { t: shared } = useTranslation('shared');
  const { locale } = useLocale();
  const remove = useMutation(deleteBoardMutation(locale));
  const saveCategories = useMutation(saveBoardCategoriesMutation(locale));
  const deletion = useConfirmation<string>({
    run: (boardId) => remove.mutateAsync(boardId).then(onDeleted),
    description: shared('deleteConfirm.description'),
  });
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const empty = t('board.detail.emptyValue');
  const usage = (value: string | undefined) => (value === undefined ? empty : t(`board.values.usage.${value}`));
  const permission = (setting: BoardPermissionSetting) =>
    setting.permission === 'MEMBER_GRADE' && setting.memberGrade
      ? `${t('board.values.permission.MEMBER_GRADE')} > ${t(`board.values.memberGrade.${setting.memberGrade}`)}`
      : t(`board.values.permission.${setting.permission}`);

  return (
    <div className="space-y-5">
      <SectionCard title={t('board.detail.section')}>
        <div className="space-y-4">
          <Fields>
            <DetailField label={t('board.columns.type')}>{t(`board.values.type.${board.type}`)}</DetailField>
            <DetailField label={t('board.columns.category')}>{t(`board.values.category.${board.category}`)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('board.columns.name')}>{board.name || empty}</DetailField>
          </Fields>
          <GroupTitle>{t('board.form.permission')}</GroupTitle>
          <Fields>
            <DetailField label={t('board.form.write')}>{permission(board.write)}</DetailField>
            <DetailField label={t('board.form.read')}>{permission(board.read)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('board.form.categoryUsage')}>
              <span className="inline-flex flex-wrap items-center gap-3">
                {usage(board.categoryUsage)}
                <Button type="button" className="bg-white text-neutral-900 ring-1 ring-neutral-300" onClick={() => setCategoriesOpen(true)}>
                  {t('board.categories.open')}
                </Button>
              </span>
            </DetailField>
          </Fields>
          <GroupTitle>{t('board.form.writing')}</GroupTitle>
          <Fields>
            <DetailField label={t('board.form.postTitleMode')}>{t(`board.values.postTitleMode.${board.postTitleMode}`)}</DetailField>
            {board.postTitleMode === 'MANAGER_TITLES' ? (
              <DetailField label={t('board.form.managerTitles')}>
                {board.managerTitles.length > 0 ? board.managerTitles.join(', ') : empty}
              </DetailField>
            ) : null}
          </Fields>
          <Fields>
            <DetailField label={t('board.form.html')}>{usage(board.html)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('board.form.attachment')}>{usage(board.attachment)}</DetailField>
            <DetailField label={t('board.form.attachmentLimitMb')}>
              {board.attachmentLimitMb === undefined ? empty : t('board.detail.megabytes', { value: board.attachmentLimitMb })}
            </DetailField>
          </Fields>
          <GroupTitle>{t('board.form.feedback')}</GroupTitle>
          <Fields>
            <DetailField label={t('board.form.rating')}>{t(`board.values.rating.${board.rating}`)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('board.form.comment')}>{usage(board.comment)}</DetailField>
            <DetailField label={t('board.form.secretComment')}>
              {board.secretComment ? t(`board.values.secretComment.${board.secretComment}`) : empty}
            </DetailField>
            <DetailField label={t('board.form.commentNotice')}>
              {board.commentNotice ? t(`board.values.commentNotice.${board.commentNotice}`) : empty}
            </DetailField>
          </Fields>
          <GroupTitle>{t('board.form.viewCount')}</GroupTitle>
          <Fields>
            <DetailField label={t('board.form.viewCountDisplay')}>{usage(board.viewCountDisplay)}</DetailField>
            <DetailField label={t('board.form.viewCountDuplicate')}>{usage(board.viewCountDuplicate)}</DetailField>
          </Fields>
          <Fields>
            <DetailField label={t('board.columns.usage')}>{usage(board.usage)}</DetailField>
          </Fields>
        </div>
      </SectionCard>
      <SectionCard title={t('board.detail.history')}>
        <UpdateHistory
          entries={toBoardHistoryEntries(board.changeLogs, t)}
          labels={{
            date: t('board.detail.historyDate'),
            change: t('board.detail.historyChange'),
            actor: t('board.detail.historyManager'),
          }}
          emptyText={t('board.detail.historyEmpty')}
        />
      </SectionCard>
      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={() => onEdit(board.id)}>{t('board.detail.edit')}</Button>
        <Button className="bg-white text-neutral-900 ring-1 ring-neutral-300" onClick={() => deletion.request(board.id)}>
          {t('board.detail.delete')}
        </Button>
      </div>
      {deletion.dialog}
      {categoriesOpen ? (
        <CategorySettingsDialog
          open
          categories={board.categories}
          onOpenChange={(open) => {
            if (!open) setCategoriesOpen(false);
          }}
          onSave={(categories) => saveCategories.mutateAsync({ boardId: board.id, categories })}
        />
      ) : null}
    </div>
  );
}

/** frame 의 한 행. `dl` 은 dt/dd 쌍(DetailField)만 담아 content model 을 지킨다. */
function Fields({ children }: { readonly children: ReactNode }) {
  return <dl className="grid gap-x-8 md:grid-cols-3">{children}</dl>;
}

function GroupTitle({ children }: { readonly children: ReactNode }) {
  return <h4 className="pt-2 text-sm font-medium text-neutral-800">{children}</h4>;
}
