import { MemberListActions } from './MemberListActions';
import { fireEvent, render as renderUi, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { memberListDefinitions, type MemberListDefinition } from './member-list-definition';
import type { MemberListActionIntent, MemberListRow } from './member-row';
import { MemberListResult } from './MemberListResult';
import { resolveMemberSearch, type MemberRouteSearch } from './search-schema';
import type { MemberListData } from './useMemberListData';
import { useMemberListResult } from './useMemberListResult';

function I18nWrapper({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const render = (ui: ReactElement) => renderUi(ui, { wrapper: I18nWrapper });

/** Mirrors `MemberListScreen`'s assembly so the result keeps its real hook wiring under test. */
function Harness({
  definition = memberListDefinitions.all,
  search,
  rows,
  total,
  totalPages,
  onSearchChange = vi.fn(),
  onActionIntent = vi.fn(),
  onMemberActivate = vi.fn(),
  onRegister = vi.fn(),
  state = {},
}: {
  readonly definition?: MemberListDefinition;
  readonly search: MemberRouteSearch;
  readonly rows: readonly MemberListRow[];
  readonly total: number;
  readonly totalPages: number;
  readonly onSearchChange?: (next: MemberRouteSearch) => void;
  readonly onActionIntent?: (intent: MemberListActionIntent) => void;
  readonly onMemberActivate?: (memberId: string) => void;
  readonly onRegister?: () => void;
  readonly state?: Partial<Pick<MemberListData, "isPending" | "isError">>;
}) {
  const data: MemberListData = {
    rows,
    total,
    totalPages,
    searched: search.periodType !== undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    retry: () => Promise.resolve(undefined),
    ...state,
  };
  const result = useMemberListResult({
    search: resolveMemberSearch(search),
    data,
    definition,
    onSearchChange,
  });
  return (
    <MemberListResult
      data={data}
      result={result}
      toolbarRight={<MemberListActions searched={data.searched} selectedIds={result.selectedIds} onActionIntent={onActionIntent} onRegister={onRegister} />}
      onMemberActivate={onMemberActivate}
    />
  );
}

const rows: readonly MemberListRow[] = [
  {
    key: 'opaque-1',
    grade: 'VIP',
    signupMethod: '직접가입',
    email: 'your****@email.com',
    name: '김회원',
    phone: '010-****-1234',
    accountStatus: '일반회원',
    joinedAt: '2026-09-01',
    lastAccessedAt: '2026-09-04',
    restrictions: ['스페셜콘텐츠'],
  },
  {
    key: 'opaque-2',
    grade: 'BASIC',
    signupMethod: '카카오',
    email: 'mem****@email.com',
    name: '박회원',
    phone: '010-****-5678',
    accountStatus: '불량회원',
    joinedAt: '2026-08-01',
    lastAccessedAt: '2026-09-03',
    restrictions: [],
  },
];

const base = { search: { periodType: 'joinedAt' as const }, rows, total: 2, totalPages: 1 };

function chooseTarget(label: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: '변경 항목' }), { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: label }));
}

describe('member list result', () => {
  it('renders masked values and adds the restriction column only for the flagged screen', () => {
    const { rerender } = render(<Harness {...base} />);
    expect(screen.queryByRole('columnheader', { name: '활동제한' })).not.toBeInTheDocument();
    expect(screen.getByText('your****@email.com')).toBeInTheDocument();
    expect(screen.getByText('010-****-1234')).toBeInTheDocument();

    rerender(<Harness {...base} definition={memberListDefinitions.flagged} />);
    expect(screen.getByRole('columnheader', { name: '활동제한' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '스페셜콘텐츠' })).toBeInTheDocument();
  });

  it('keeps selection out of row activation and freezes bulk intent on confirmation', () => {
    const onMemberActivate = vi.fn();
    const onActionIntent = vi.fn();
    render(<Harness {...base} onMemberActivate={onMemberActivate} onActionIntent={onActionIntent} />);

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    const firstRow = screen.getByRole('row', { name: /김회원/ });
    fireEvent.click(within(firstRow).getByRole('checkbox'));
    expect(onMemberActivate).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' })).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(firstRow);
    expect(onMemberActivate).toHaveBeenCalledWith('opaque-1');

    chooseTarget('일반회원');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).toHaveBeenCalledExactlyOnceWith({
      type: 'bulkChange',
      targetIds: ['opaque-1'],
      values: { accountStatus: 'general', restrictions: [] },
    });
  });

  it.each(['notSearched', 'loading', 'error', 'empty'] as const)('keeps confirmation and its snapshot through %s', (state) => {
    const onActionIntent = vi.fn();
    const { rerender } = render(<Harness {...base} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    chooseTarget('일반회원');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    rerender(<Harness {...base}
      search={state === 'notSearched' ? {} : base.search}
      state={{ isPending: state === 'loading', isError: state === 'error' }}
      rows={state === 'empty' ? [] : rows}
      onActionIntent={onActionIntent}
    />);
    expect(screen.getByRole('dialog')).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).toHaveBeenCalledExactlyOnceWith({ type: 'bulkChange', targetIds: ['opaque-1'], values: { accountStatus: 'general', restrictions: [] } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses one active aria-sort and resets page when a sortable header changes', () => {
    const onSearchChange = vi.fn();
    render(
      <Harness
        {...base}
        search={{ periodType: 'joinedAt', page: 3 }}
        total={300}
        totalPages={3}
        onSearchChange={onSearchChange}
      />,
    );

    expect(screen.getAllByRole('columnheader').filter((header) => header.hasAttribute('aria-sort'))).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '이름' }));
    expect(onSearchChange).toHaveBeenCalledWith({ periodType: 'joinedAt', sortType: 'name' });
  });

  it('preserves page-size and sort values when paging', () => {
    const onSearchChange = vi.fn();
    render(
      <Harness
        {...base}
        search={{ periodType: 'joinedAt', page: 2, pageSize: 200, sortType: 'name' }}
        total={600}
        totalPages={3}
        onSearchChange={onSearchChange}
      />,
    );

    expect(screen.getByRole('combobox', { name: '보기' })).toHaveTextContent('200');
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveTextContent('이름');
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onSearchChange).toHaveBeenCalledWith({
      periodType: 'joinedAt',
      page: 3,
      pageSize: 200,
      sortType: 'name',
    });
  });

  it('clears selection when the committed view identity changes', () => {
    const { rerender } = render(<Harness {...base} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    rerender(<Harness {...base} search={{ periodType: 'joinedAt', sortType: 'name' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
  });

  it('does not restore a selected id after it leaves and later returns to the same result set', async () => {
    const { rerender } = render(<Harness {...base} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));

    rerender(<Harness {...base} rows={rows.slice(1)} total={1} />);
    await waitFor(() => expect(screen.getByRole('checkbox', { name: '박회원 선택' })).not.toBeChecked());
    rerender(<Harness {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
  });

  it('keeps the flagged cascade feature-local and blocks an incomplete intent', () => {
    const onActionIntent = vi.fn();
    render(<Harness {...base} definition={memberListDefinitions.flagged} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    chooseTarget('불량회원');
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    expect(screen.getByRole('alert')).toHaveTextContent('변경할 계정 상태와 활동제한을 선택해주세요.');
    expect(onActionIntent).not.toHaveBeenCalled();
  });

  it('keeps the flagged cascade through cancel and freezes it only on confirmation', () => {
    const onActionIntent = vi.fn();
    render(<Harness {...base} definition={memberListDefinitions.flagged} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    chooseTarget('불량회원');
    fireEvent.click(within(screen.getByRole('group', { name: '활동제한' })).getByRole('checkbox', { name: '스페셜콘텐츠' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onActionIntent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).toHaveBeenCalledWith({
      type: 'bulkChange',
      targetIds: ['opaque-1'],
      values: { accountStatus: 'flagged', restrictions: ['specialContent'] },
    });
  });

  it.each([
    ['SMS', 'SMS 발송', 'sms'],
    ['이메일', '이메일 발송', 'email'],
  ] as const)('opens %s directly after selection without a confirmation step', (button, title, type) => {
    const onActionIntent = vi.fn();
    render(<Harness {...base} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getAllByRole('button', { name: '이메일' })[0]!);
    expect(screen.getByRole('dialog')).toHaveTextContent('이메일을 발송할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    fireEvent.click(screen.getAllByRole('button', { name: button })[0]!);
    expect(screen.getByRole('dialog')).toHaveAccessibleName(title);
    expect(screen.queryByRole('button', { name: '확인' })).not.toBeInTheDocument();
    expect(onActionIntent).toHaveBeenCalledExactlyOnceWith({ type, targetIds: ['opaque-1'] });
  });
});
