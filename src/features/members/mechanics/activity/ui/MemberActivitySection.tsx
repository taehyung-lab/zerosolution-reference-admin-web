import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemberActivity } from '@/features/members/api/useMemberActivity';
import { formatMemberInstant } from '@/features/members/lib/format-member-instant';
import {
  memberActivityTabs,
  type MemberActivityDelete,
  type MemberActivitySearch,
  type MemberActivityTab,
} from '@/features/members/model/member-activity';
import { usePageRowSelection } from '@/shared/model/use-page-row-selection';
import { useSelectionGate } from '@/shared/model/use-selection-gate';
import { SelectionAlert } from '@/shared/ui/dialog/SelectionAlert';
import { useConfirmation } from '@/shared/ui/dialog/useConfirmation';
import { ListResult } from '@/shared/ui/list/ListResult';
import { Pagination } from '@/shared/ui/list/Pagination';
import { Button } from '@/shared/ui/primitives/Button';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import { Input } from '@/shared/ui/primitives/Input';
import { Table, TableCell, TableHead } from '@/shared/ui/primitives/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/primitives/Tabs';

const initialSearch: MemberActivitySearch = { tab: 'ticket', keyword: '', page: 1, pageSize: 100 };

/**
 * 회원 조회와 탈퇴회원 조회가 공유하는 `활동정보` 절: 탭(티켓인증·관람인증·재관람·입장기록) · 검색어 · 페이지 · 현재 페이지
 * 선택 · 선택삭제 확인. 탭·검색·페이지는 URL 이 아니라 이 절이 소유하고, 조회는 그 조건으로 이 절이 직접 연다.
 * 입장기록은 삭제할 수 없다. 실행(`onDelete`)은 대상 회원을 아는 화면이 mutation 으로 준다.
 */
export function MemberActivitySection({
  memberId,
  onDelete,
}: {
  readonly memberId: string;
  readonly onDelete: (input: MemberActivityDelete) => Promise<unknown>;
}) {
  const { t } = useTranslation('members');
  const [search, setSearch] = useState(initialSearch);
  const [draft, setDraft] = useState('');
  const data = useMemberActivity(memberId, search);
  const selection = usePageRowSelection({
    rows: data.rows,
    getId: (row) => row.id,
    resetKey: JSON.stringify(search),
  });
  const gate = useSelectionGate(selection.selectedIds.length);
  const deletion = useConfirmation<MemberActivityDelete>({ run: onDelete, description: t('activity.confirmDelete') });
  const deletable = search.tab !== 'entry';
  const emptyText =
    search.keyword !== '' ? t('activity.noResults') : search.tab === 'entry' ? t('activity.entryEmpty') : t('activity.empty');

  const requestDelete = () => {
    const tab = search.tab;
    if (tab === 'entry' || !gate.requireSelection(t('activity.selectRequired'))) return;
    deletion.request({ tab, ids: selection.selectedIds });
  };

  return (
    <div className="space-y-4">
      <SelectionAlert controller={gate} />
      {deletion.dialog}
      <Tabs
        value={search.tab}
        onValueChange={(value) => {
          setDraft('');
          setSearch({ ...initialSearch, tab: value as MemberActivityTab });
        }}
      >
        <TabsList aria-label={t('activity.title')}>
          {memberActivityTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`activity.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={search.tab} className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch({ ...search, keyword: draft.trim(), page: 1 });
            }}
          >
            <Input
              aria-label={t('activity.search')}
              placeholder={t('activity.searchHint')}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit">{t('activity.search')}</Button>
            {search.keyword !== '' ? (
              <Button
                type="button"
                onClick={() => {
                  setDraft('');
                  setSearch({ ...search, keyword: '', page: 1 });
                }}
              >
                {t('activity.reset')}
              </Button>
            ) : null}
          </form>
          {deletable ? (
            <Button type="button" onClick={requestDelete}>
              {t('activity.deleteSelected')}
            </Button>
          ) : null}
          <ListResult
            data={data}
            copy={{ notSearched: emptyText, empty: emptyText }}
            footer={
              <Pagination
                page={search.page}
                totalPages={Math.max(1, Math.ceil(data.total / search.pageSize))}
                onPageChange={(page) => setSearch({ ...search, page })}
                ariaLabel={t('activity.pagination')}
                previousLabel={t('activity.previous')}
                nextLabel={t('activity.next')}
              />
            }
          >
            <Table>
              <thead>
                <tr>
                  {deletable ? (
                    <TableHead>
                      <Checkbox
                        aria-label={t('activity.selectAll')}
                        checked={selection.isAllChecked}
                        indeterminate={selection.isMixed}
                        onChange={(event) => selection.togglePage(event.target.checked)}
                      />
                    </TableHead>
                  ) : null}
                  <TableHead>{search.tab === 'entry' ? t('activity.enteredAt') : t('activity.occurredAt')}</TableHead>
                  <TableHead>{t('activity.performanceName')}</TableHead>
                  <TableHead>{t('activity.session')}</TableHead>
                  <TableHead>{t('activity.performanceAt')}</TableHead>
                  <TableHead>{t('activity.bookingNumber')}</TableHead>
                  <TableHead>{t('activity.seatNumber')}</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    {deletable ? (
                      <TableCell>
                        <Checkbox
                          aria-label={t('activity.selectRow', { number: row.bookingNumber })}
                          checked={selection.isChecked(row)}
                          onChange={(event) => selection.toggleRow(row, event.target.checked)}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>{formatMemberInstant(row.occurredAt)}</TableCell>
                    <TableCell>{row.performanceName}</TableCell>
                    <TableCell>{row.session}</TableCell>
                    <TableCell>{formatMemberInstant(row.performanceAt)}</TableCell>
                    <TableCell>{row.bookingNumber}</TableCell>
                    <TableCell>{row.seatNumber}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ListResult>
        </TabsContent>
      </Tabs>
    </div>
  );
}
