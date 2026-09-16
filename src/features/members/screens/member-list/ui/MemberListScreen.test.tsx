import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { memberListDefinitions, type MemberListDefinition } from '../model/member-list-definition';
import type { MemberListSearch } from '../model/member-list-search';
import { MemberListScreen } from './MemberListScreen';

/** route 처럼 canonical search 를 상태로 들고 화면에 되돌려 준다. */
function Harness({
  definition = memberListDefinitions.all,
  initial = {},
  onCommit,
  onActivate = vi.fn(),
  onCreate = vi.fn(),
  onMessage = vi.fn(),
}: {
  readonly definition?: MemberListDefinition;
  readonly initial?: MemberListSearch;
  readonly onCommit: (value: MemberListSearch) => void;
  readonly onActivate?: (id: string) => void;
  readonly onCreate?: () => void;
  readonly onMessage?: (channel: 'sms' | 'email', ids: readonly string[]) => void;
}) {
  const [search, setSearch] = useState<MemberListSearch>(initial);
  return (
    <MemberListScreen
      definition={definition}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onActivate={onActivate}
      onCreate={onCreate}
      onMessage={onMessage}
    />
  );
}

function renderScreen(props: Parameters<typeof Harness>[0] = { onCommit: vi.fn() }) {
  return render(
    <TestQueryLocaleProvider>
      <Harness {...props} />
    </TestQueryLocaleProvider>,
  );
}

const search = () => fireEvent.click(screen.getByRole('button', { name: '검색' }));

describe('MemberListScreen (4.1 활성 회원 목록)', () => {
  it('진입은 검색 전 안내만 보이고, 검색을 누르면 searched 표식과 함께 마스킹된 행을 조회한다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });

    expect(screen.getByRole('heading', { name: '전체회원' })).toBeInTheDocument();
    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('combobox', { name: '정렬' })).toBeNull();

    search();
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true });
    expect(await screen.findByText('검색결과 : 2')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('gene***@example.test')).toBeInTheDocument();
    expect(screen.getByText('010-****-3000')).toBeInTheDocument();
    expect(screen.queryByText('general@example.test')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: '활동제한' })).toBeNull();
  });

  it('세 정의는 제목·필터·컬럼만 다르고 요청은 계정 상태를 고정한다', async () => {
    renderScreen({ onCommit: vi.fn(), definition: memberListDefinitions.general });
    expect(screen.getByRole('heading', { name: '일반회원' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '계정 상태' })).toBeNull();
    expect(screen.queryByRole('group', { name: '활동제한' })).toBeNull();
    search();
    expect(await screen.findByText('검색결과 : 1')).toBeInTheDocument();
    expect(screen.getByText('예시회원')).toBeInTheDocument();

    const { unmount } = renderScreen({ onCommit: vi.fn(), definition: memberListDefinitions.flagged });
    expect(screen.getByRole('heading', { name: '불량회원' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '계정 상태' })).toBeNull();
    expect(screen.getAllByRole('group', { name: '활동제한' }).length).toBeGreaterThan(0);
    unmount();
  });

  it('불량회원 화면은 활동제한 컬럼을 더하고 그 상태의 회원만 조회한다', async () => {
    renderScreen({ onCommit: vi.fn(), definition: memberListDefinitions.flagged });
    search();
    expect(await screen.findByText('검색결과 : 1')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '활동제한' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1:1문의' })).toBeInTheDocument();
    expect(screen.queryByText('예시회원')).toBeNull();
  });

  it('일괄변경은 미선택·미완성 값을 한 alert 로 거절하고 완성되면 확인창을 지나 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    search();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    await chooseOptionIn('변경 항목', '불량회원');
    expect(screen.getAllByRole('group', { name: '활동제한' })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 계정 상태와 활동제한을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(log).not.toHaveBeenCalled();

    await chooseOptionIn('변경 항목', '일반회원');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 일괄변경'));
    log.mockRestore();
  });

  it('SMS·이메일은 선택이 있어야 채널과 대상을 화면 밖으로 알린다', async () => {
    const onMessage = vi.fn();
    renderScreen({ onCommit: vi.fn(), onMessage });
    search();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    expect(onMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox', { name: '예시회원 선택' }));
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(onMessage).toHaveBeenCalledExactlyOnceWith('sms', ['example-general']);
  });

  it('헤더 정렬·보기·페이지 전이는 canonical URL 로 나가고 활성 컬럼 하나만 aria-sort 를 가진다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });
    search();
    const table = await screen.findByRole('table');
    const active = within(table).getAllByRole('columnheader').filter((header) => header.hasAttribute('aria-sort'));
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('aria-sort', 'descending');
    expect(within(active[0]!).getByRole('button')).toHaveAccessibleName('가입일');

    fireEvent.click(within(table).getByRole('button', { name: '이름' }));
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true, sortType: 'name' });
    fireEvent.click(within(table).getByRole('button', { name: '이름' }));
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true, sortType: 'name', sortDirection: 'asc' });

    await chooseOptionIn('보기', '200');
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true, sortType: 'name', sortDirection: 'asc', pageSize: 200 });
  });

  it('초기화는 검색 전 URL 로 돌아가고, 행 클릭과 등록은 밖으로 나간다', async () => {
    const onCommit = vi.fn();
    const onActivate = vi.fn();
    const onCreate = vi.fn();
    renderScreen({ onCommit, onActivate, onCreate });
    search();
    fireEvent.click(await screen.findByRole('cell', { name: '예시불량' }));
    expect(onActivate).toHaveBeenCalledWith('example-flagged');
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onCreate).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(onCommit).toHaveBeenLastCalledWith({});
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
  });
});
