import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import type { DormantListSearch } from '../model/dormant-list-search';
import { DormantMemberListScreen } from './DormantMemberListScreen';

function Harness({
  onCommit,
  onActivate = vi.fn(),
  onMessage = vi.fn(),
}: {
  readonly onCommit: (value: DormantListSearch) => void;
  readonly onActivate?: (id: string) => void;
  readonly onMessage?: (channel: 'sms' | 'email', ids: readonly string[]) => void;
}) {
  const [search, setSearch] = useState<DormantListSearch>({});
  return (
    <DormantMemberListScreen
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onActivate={onActivate}
      onCreate={vi.fn()}
      onMessage={onMessage}
    />
  );
}

function renderScreen(props: Parameters<typeof Harness>[0] = { onCommit: vi.fn() }) {
  render(
    <TestQueryLocaleProvider>
      <Harness {...props} />
    </TestQueryLocaleProvider>,
  );
}

describe('DormantMemberListScreen (4.3 휴면회원)', () => {
  it('검색 뒤 101건을 두 페이지로 보이고, 페이지 이동은 선택을 풀며 canonical URL 로 나간다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });
    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SMS' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true });
    expect(await screen.findByText('검색결과 : 101')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(101);

    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onCommit).toHaveBeenLastCalledWith({ page: 2, searched: true });
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
    expect(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' })).not.toBeChecked();
  });

  it('SMS 는 선택이 있어야 대상과 채널을 알리고, 행 클릭은 회원 조회로 나간다', async () => {
    const onMessage = vi.fn();
    const onActivate = vi.fn();
    renderScreen({ onCommit: vi.fn(), onMessage, onActivate });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));

    fireEvent.click(within(screen.getAllByRole('row')[1]!).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledExactlyOnceWith('sms', ['dormant-1']);

    fireEvent.click(screen.getAllByRole('row')[1]!);
    expect(onActivate).toHaveBeenCalledWith('dormant-1');
  });
});
