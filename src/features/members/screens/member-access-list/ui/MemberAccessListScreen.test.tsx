import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { AccessListSearch } from '../model/access-list-search';
import { MemberAccessListScreen } from './MemberAccessListScreen';

function Harness({ onCommit }: { readonly onCommit: (value: AccessListSearch) => void }) {
  const [search, setSearch] = useState<AccessListSearch>({});
  return (
    <MemberAccessListScreen
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onCreate={vi.fn()}
    />
  );
}

describe('MemberAccessListScreen (4.5 회원접속)', () => {
  it('다운로드는 검색 뒤에만 보이고, 선택 범위는 행이 있어야, 전체 범위는 확정 조건으로 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const onCommit = vi.fn();
    render(
      <TestQueryLocaleProvider>
        <Harness onCommit={onCommit} />
      </TestQueryLocaleProvider>,
    );
    expect(screen.queryByRole('button', { name: '다운로드' })).toBeNull();
    expect(screen.getByRole('button', { name: '등록' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true });
    await screen.findByRole('table');
    expect(screen.getByText('검색결과 : 101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다운로드' })).toBeDisabled();

    await chooseOptionIn('다운로드 범위', '선택한 항목');
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('다운로드할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(log).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getAllByRole('row')[1]!).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원접속 다운로드')));

    await chooseOptionIn('다운로드 범위', '검색결과 전체');
    fireEvent.click(screen.getByRole('button', { name: '다운로드' }));
    await waitFor(() => expect(log).toHaveBeenCalledTimes(2));
    log.mockRestore();
  });
});
