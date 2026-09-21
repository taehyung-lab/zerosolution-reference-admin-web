import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/error';
import { readManagerPermissionOptions, readManagerTypeOptions } from '@/features/managers/fixtures/managers';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import type { ManagerListSearch } from '../model/manager-list-search';
import { ManagerListScreen } from './ManagerListScreen';

/** 옵션 응답만 대체해 지연·실패를 만든다. Query 실행과 화면 조립 경로는 제품과 같다. */
vi.mock(import('@/features/managers/fixtures/managers'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readManagerTypeOptions: vi.fn(actual.readManagerTypeOptions),
    readManagerPermissionOptions: vi.fn(actual.readManagerPermissionOptions),
  };
});

/** route 처럼 canonical search 를 상태로 들고 화면에 되돌려 준다. */
function Harness({
  initial = {},
  onCommit,
  onActivate = vi.fn(),
  onCreate = vi.fn(),
}: {
  readonly initial?: ManagerListSearch;
  readonly onCommit: (value: ManagerListSearch) => void;
  readonly onActivate?: (id: string) => void;
  readonly onCreate?: () => void;
}) {
  const [search, setSearch] = useState<ManagerListSearch>(initial);
  return (
    <ManagerListScreen
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        onCommit(value);
      }}
      onActivate={onActivate}
      onCreate={onCreate}
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

const search = () => fireEvent.click(screen.getByRole('button', { name: '검색' }));

describe('ManagerListScreen (11.1 운영자 목록)', () => {
  it('진입은 검색 전 안내만 보이고, 검색을 누르면 searched 표식과 함께 조회한다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });

    expect(screen.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('combobox', { name: '정렬' })).toBeNull();

    search();

    expect(onCommit).toHaveBeenLastCalledWith({ searched: true });
    expect(await screen.findByText('검색결과 : 105')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(101);
  });

  it('연락처는 마스킹해 보인다', async () => {
    renderScreen();
    search();

    // 해제 경로는 조회의 재인증 액션뿐이다 (CONTACT-MASKING).
    expect((await screen.findAllByText('010-****-0000')).length).toBeGreaterThan(0);
    expect(screen.queryByText('010-0000-0000')).toBeNull();
    expect(screen.queryByText('operator1@example.com')).toBeNull();
  });

  it('권한은 다른 유형의 권한도 고를 수 있고 전체로 되돌리면 조건이 사라진다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toBeEnabled());

    await chooseOptionIn('권한', 'Example site permission');
    search();
    expect(onCommit).toHaveBeenLastCalledWith({ permission: '2', searched: true });
    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();

    await chooseOptionIn('권한', '전체');
    search();
    expect(onCommit).toHaveBeenLastCalledWith({ searched: true });
    expect(await screen.findByText('검색결과 : 105')).toBeInTheDocument();
  });

  it('이메일 검색어·권한·상태를 커밋하고 뒤의 보기·정렬 변경은 조건을 유지한다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });

    await chooseOptionIn('검색 대상', '이메일');
    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), { target: { value: 'test@example.com' } });
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toBeEnabled());
    await chooseOptionIn('권한', 'Example permission');
    fireEvent.click(screen.getByRole('checkbox', { name: '거절' }));
    search();

    expect(onCommit).toHaveBeenLastCalledWith({
      searched: true,
      permission: '1',
      statuses: ['awaiting', 'active', 'inactive', 'locked'],
      keywords: [{ field: 'email', value: 'test@example.com' }],
    });

    await screen.findByText('일치하는 검색결과가 없습니다.');
    await chooseOptionIn('보기', '200');
    expect(onCommit).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 200, permission: '1' }));
    await chooseOptionIn('정렬', '이메일');
    expect(onCommit).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 200, sortType: 'email' }));
  });

  it('보기 정렬 목록과 정렬 가능한 헤더가 같은 집합이고 활성 컬럼 하나만 aria-sort 를 가진다', async () => {
    renderScreen();
    search();
    const table = await screen.findByRole('table');
    const active = () =>
      within(table).getAllByRole('columnheader').filter((header) => header.hasAttribute('aria-sort'));

    fireEvent.keyDown(screen.getByRole('combobox', { name: '정렬' }), { key: 'Enter' });
    const listbox = await screen.findByRole('listbox');
    const sortOptions = within(listbox).getAllByRole('option').map((option) => option.textContent ?? '');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    const sortable = within(table)
      .getAllByRole('columnheader')
      .filter((header) => within(header).queryAllByRole('button').length > 0);
    expect(sortable).toHaveLength(sortOptions.length);
    for (const name of sortOptions) expect(within(table).getByRole('button', { name })).toBeInTheDocument();

    expect(active()).toHaveLength(1);
    expect(active()[0]).toHaveAttribute('aria-sort', 'descending');
    expect(within(active()[0]!).getByRole('button')).toHaveAccessibleName('가입일');

    fireEvent.click(within(table).getByRole('button', { name: '이메일' }));
    await waitFor(() => expect(within(active()[0]!).getByRole('button')).toHaveAccessibleName('이메일'));
    expect(active()).toHaveLength(1);
  });

  it('일괄변경은 미선택이면 alert, 선택 뒤에는 대상만 확인창을 지나 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    search();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    await chooseOptionIn('변경 항목', '활성');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('[대기, 거절, 잠금]은 상태를 변경할 수 없습니다.');
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 일괄변경'));
    log.mockRestore();
  });

  it('페이지를 넘기면 선택이 풀리고 초기화는 검색 전 URL 로 돌아간다', async () => {
    const onCommit = vi.fn();
    renderScreen({ onCommit });
    search();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onCommit).toHaveBeenLastCalledWith({ page: 2, searched: true });
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(6));
    expect(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' })).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    expect(onCommit).toHaveBeenLastCalledWith({});
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('검색 조건을 입력한 뒤 검색해 주세요.')).toBeInTheDocument();
  });

  it('행 클릭은 조회로, 등록은 등록 화면으로 나간다', async () => {
    const onActivate = vi.fn();
    const onCreate = vi.fn();
    renderScreen({ onCommit: vi.fn(), onActivate, onCreate });
    search();
    fireEvent.click(await screen.findByRole('cell', { name: 'example-active' }));
    expect(onActivate).toHaveBeenCalledWith('example-active');

    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('옵션이 도착하기 전에는 로딩을, 실패는 필드별 재시도로 복구한다', async () => {
    const permissions = vi.mocked(readManagerPermissionOptions);
    const original = permissions.getMockImplementation()!;
    permissions.mockImplementation(() => Promise.reject(new ApiError({ kind: 'network', message: 'test' })));
    renderScreen();

    expect(screen.getByRole('status', { name: '유형' })).toHaveTextContent('옵션을 불러오는 중입니다.');
    expect(await screen.findByRole('alert', { name: '권한' })).toHaveTextContent('옵션을 불러오지 못했습니다.');
    // 실패한 필드만 대체된다. 같은 화면의 유형 옵션은 계속 선택할 수 있다.
    expect(await screen.findByRole('checkbox', { name: 'Example type' })).toBeInTheDocument();
    expect(vi.mocked(readManagerTypeOptions)).toHaveBeenCalled();

    permissions.mockImplementation(original);
    fireEvent.click(screen.getByRole('button', { name: '권한 다시 시도' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toBeEnabled());
  });
});
