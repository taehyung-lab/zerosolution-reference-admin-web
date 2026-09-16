import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { withdrawnListSearch } from '../model/withdrawn-list-search';
import { WithdrawnMemberListScreen } from './WithdrawnMemberListScreen';

describe('WithdrawnMemberListScreen (4.4 탈퇴회원)', () => {
  it('헤더 정렬은 canonical URL 로 나가고 행 클릭은 checkbox 와 분리되어 탈퇴회원 조회로 간다', async () => {
    const onSearchChange = vi.fn();
    const onActivate = vi.fn();
    const onCreate = vi.fn();
    render(
      <TestQueryLocaleProvider>
        <WithdrawnMemberListScreen
          search={withdrawnListSearch.canonical.parse({ searched: true })}
          onSearchChange={onSearchChange}
          onActivate={onActivate}
          onCreate={onCreate}
        />
      </TestQueryLocaleProvider>,
    );
    const table = await screen.findByRole('table');
    expect(screen.getByText('검색결과 : 1')).toBeInTheDocument();
    expect(screen.queryByText('Example member')).toBeNull();

    fireEvent.click(within(table).getAllByRole('checkbox')[1]!);
    expect(onActivate).not.toHaveBeenCalled();
    fireEvent.click(within(table).getAllByRole('row')[1]!);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith('withdrawn-1');

    fireEvent.click(within(table).getByRole('button', { name: '이메일' }));
    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith({ searched: true, sortType: 'email' });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('검색 전에는 안내만 보이고 검색어 대상은 이메일 하나다', () => {
    const onSearchChange = vi.fn();
    render(
      <TestQueryLocaleProvider>
        <WithdrawnMemberListScreen search={{}} onSearchChange={onSearchChange} onActivate={vi.fn()} onCreate={vi.fn()} />
      </TestQueryLocaleProvider>,
    );
    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), { target: { value: 'reference' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onSearchChange).toHaveBeenCalledWith({ searched: true, keywords: [{ field: 'email', value: 'reference' }] });
  });
});
