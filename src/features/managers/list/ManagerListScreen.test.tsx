import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { chooseOptionIn } from '@/test/select';
import { TestLocaleProvider } from '@/test/locale';
import { ManagerListScreen } from './ManagerListScreen';
import type { ManagerListActionRequest } from './useManagerListActions';
import { managerListSearchSchema, type ManagerListSearch } from './manager-list-search';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children }: { children: ReactNode }) => <a href="/managers/new">{children}</a>,
}));

function Harness({
  onCommit,
  onActionRequest,
}: {
  readonly onCommit: (value: ManagerListSearch) => void;
  readonly onActionRequest: (request: ManagerListActionRequest) => void;
}) {
  const [search, setSearch] = useState<ManagerListSearch>({});
  return (
    <ManagerListScreen
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onActionRequest={onActionRequest}
    />
  );
}

describe('manager product search input', () => {
  it('allows the used permission of another type and displays per-record email and access date', async () => {
    const onCommit = vi.fn();
    render(<TestLocaleProvider><Harness onCommit={onCommit} onActionRequest={vi.fn()} /></TestLocaleProvider>);
    await chooseOptionIn('권한', 'Example site permission');
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onCommit).toHaveBeenLastCalledWith(expect.objectContaining({ permission: '2' }));
    expect(screen.getByText('operator1@example.com')).toBeInTheDocument();
    expect(screen.getByText('operator2@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('2026-08-03').length).toBeGreaterThan(0);
    expect(screen.queryByText('2026-08-02')).not.toBeInTheDocument();
  });
  it('accepts product states and email keyword without mapping to rehearsal values', () => {
    const search = {
      periodType: 'joinedAt',
      statuses: ['rejected', 'inactive'],
      keywords: [{ field: 'email', value: 'test@example.com' }],
      permission: '1',
    };
    expect(managerListSearchSchema.parse(search)).toEqual(search);
  });

  it('removes a reversed date pair but preserves independently valid input', () => {
    expect(
      managerListSearchSchema.parse({
        periodType: 'joinedAt',
        permission: '1',
        startDateTime: '2026-09-06T00:00:00Z',
        endDateTime: '2026-09-05T00:00:00Z',
      }),
    ).toEqual({ periodType: 'joinedAt', permission: '1' });
  });

  it('commits email, permission and status then retains view settings on a later search', async () => {
    const onCommit = vi.fn();
    render(
      <TestLocaleProvider>
        <Harness onCommit={onCommit} onActionRequest={vi.fn()} />
      </TestLocaleProvider>,
    );
    await chooseOptionIn('검색어 구분', '이메일');
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: 'test@example.com' },
    });
    await chooseOptionIn('권한', 'Example permission');
    fireEvent.click(screen.getByRole('checkbox', { name: '거절' }));
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        periodType: 'joinedAt',
        permission: '1',
        statuses: ['awaiting', 'active', 'inactive', 'locked'],
        keywords: [{ field: 'email', value: 'test@example.com' }],
      }),
    );
    await chooseOptionIn('보기', '200');
    await chooseOptionIn('정렬', '이메일');
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageSize: 200, sort: 'email' }),
    );
  });

  it('validates selection and confirms only eligible product-state rows', async () => {
    const onActionRequest = vi.fn<(request: ManagerListActionRequest) => void>();
    render(
      <TestLocaleProvider>
        <Harness onCommit={vi.fn()} onActionRequest={onActionRequest} />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    await chooseOptionIn('변경 항목', '활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(onActionRequest).toHaveBeenCalledExactlyOnceWith({
      type: 'bulkChange',
      targetIds: expect.arrayContaining(['example-active', 'example-inactive']),
      values: { accountStatus: 'active' },
    });
    expect(onActionRequest.mock.calls[0]?.[0].targetIds).toHaveLength(40);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' })).not.toBeChecked();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
