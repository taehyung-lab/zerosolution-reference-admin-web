import { fireEvent, render as renderUi, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import {
  AllMemberListScreen,
  FlaggedMemberListScreen,
  GeneralMemberListScreen,
  type MemberListRow,
} from './MemberListScreens';

function I18nWrapper({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const render = (ui: ReactElement) => renderUi(ui, { wrapper: I18nWrapper });

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
    restrictions: [],
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
    restrictions: ['스페셜콘텐츠'],
  },
];

const baseProps = {
  search: { periodType: 'joinedAt' as const },
  data: { rows, total: 2, totalPages: 1 },
  onSearchChange: vi.fn(),
  onActionIntent: vi.fn(),
  onMemberActivate: vi.fn(),
  onRegister: vi.fn(),
};

describe('active member list screens', () => {
  it('keeps the three route identities and their filter/column differences explicit', () => {
    const { rerender } = render(<AllMemberListScreen {...baseProps} />);
    expect(screen.getByRole('heading', { name: '전체회원' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '계정 상태' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '활동제한' })).toBeInTheDocument();

    rerender(<GeneralMemberListScreen {...baseProps} />);
    expect(screen.getByRole('heading', { name: '일반회원' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '계정 상태' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '활동제한' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '활동제한' })).not.toBeInTheDocument();

    rerender(<FlaggedMemberListScreen {...baseProps} />);
    expect(screen.getByRole('heading', { name: '불량회원' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '계정 상태' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: '활동제한' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '활동제한' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '스페셜콘텐츠' })).toBeInTheDocument();
    expect(screen.getByText('your****@email.com')).toBeInTheDocument();
    expect(screen.getByText('010-****-1234')).toBeInTheDocument();
  });

  it('shows only the registration action before search and commits defaults once', () => {
    const onSearchChange = vi.fn();
    render(
      <AllMemberListScreen
        {...baseProps}
        search={{}}
        data={{ rows: [], total: 0, totalPages: 1 }}
        onSearchChange={onSearchChange}
      />,
    );

    expect(screen.getByText('검색해주세요.')).toBeInTheDocument();
    expect(screen.queryByText('검색결과 : 0')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(onSearchChange).toHaveBeenCalledWith({ periodType: 'joinedAt' });
  });

  it('rejects a second chip for the same target and preserves the pending value', () => {
    render(<AllMemberListScreen {...baseProps} search={{}} />);
    const keyword = screen.getByRole('textbox', { name: '검색어' });
    fireEvent.change(keyword, { target: { value: 'first@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    fireEvent.change(keyword, { target: { value: 'second@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(screen.getByRole('alert')).toHaveTextContent('같은 검색 대상은 한 번만 추가할 수 있습니다.');
    expect(keyword).toHaveValue('second@example.com');
  });

  it('keeps selection feature-local, excludes checkbox activation, and freezes bulk intent', () => {
    const onMemberActivate = vi.fn();
    const onActionIntent = vi.fn();
    render(
      <AllMemberListScreen
        {...baseProps}
        onMemberActivate={onMemberActivate}
        onActionIntent={onActionIntent}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    const firstRow = screen.getByRole('row', { name: /김회원/ });
    fireEvent.click(within(firstRow).getByRole('checkbox'));
    expect(onMemberActivate).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: '현재 페이지 전체 선택' })).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(firstRow);
    expect(onMemberActivate).toHaveBeenCalledWith('opaque-1');

    fireEvent.change(screen.getByRole('combobox', { name: '변경 항목' }), {
      target: { value: 'general' },
    });
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('선택 항목을 변경하시겠습니까?');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).toHaveBeenCalledWith({
      type: 'bulkChange',
      memberIds: ['opaque-1'],
      values: { accountStatus: 'general', restrictions: [] },
    });
  });

  it('keeps an invalid direct period in draft and does not commit it', () => {
    const onSearchChange = vi.fn();
    render(<AllMemberListScreen {...baseProps} search={{}} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '2026-09-05' } });
    fireEvent.change(screen.getByLabelText('종료일'), { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    expect(screen.getByRole('alert')).toHaveTextContent('시작일은 종료일보다 늦을 수 없습니다.');
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it('uses one active aria-sort and resets page when a sortable header changes', () => {
    const onSearchChange = vi.fn();
    render(
      <AllMemberListScreen
        {...baseProps}
        search={{ periodType: 'joinedAt', page: 3 }}
        data={{ rows, total: 300, totalPages: 3 }}
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
      <AllMemberListScreen
        {...baseProps}
        search={{ periodType: 'joinedAt', page: 2, pageSize: 200, sortType: 'name' }}
        data={{ rows, total: 600, totalPages: 3 }}
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

  it('clears selection when committed view identity changes', () => {
    const { rerender } = render(<AllMemberListScreen {...baseProps} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    rerender(<AllMemberListScreen {...baseProps} search={{ periodType: 'joinedAt', sortType: 'name' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
  });

  it('does not restore a selected id after it leaves and later returns to the same result set', async () => {
    const { rerender } = render(<AllMemberListScreen {...baseProps} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));

    rerender(<AllMemberListScreen {...baseProps} data={{ rows: rows.slice(1), total: 1, totalPages: 1 }} />);
    await waitFor(() => expect(screen.getByRole('checkbox', { name: '박회원 선택' })).not.toBeChecked());
    rerender(<AllMemberListScreen {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
  });

  it('keeps the flagged cascade feature-local and blocks an incomplete intent', () => {
    const onActionIntent = vi.fn();
    render(<FlaggedMemberListScreen {...baseProps} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    fireEvent.change(screen.getByRole('combobox', { name: '변경 항목' }), { target: { value: 'flagged' } });
    fireEvent.click(screen.getByRole('button', { name: '변경' }));

    expect(screen.getByRole('alert')).toHaveTextContent('변경할 계정 상태와 활동제한을 선택해주세요.');
    expect(onActionIntent).not.toHaveBeenCalled();
  });

  it('keeps the flagged cascade through cancel and freezes it only on confirmation', () => {
    const onActionIntent = vi.fn();
    render(<FlaggedMemberListScreen {...baseProps} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '김회원 선택' }));
    fireEvent.change(screen.getByRole('combobox', { name: '변경 항목' }), { target: { value: 'flagged' } });
    const bulkRestrictions = screen.getAllByRole('group', { name: '활동제한' })[1]!;
    fireEvent.click(within(bulkRestrictions).getByRole('checkbox', { name: '스페셜콘텐츠' }));
    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onActionIntent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '변경' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onActionIntent).toHaveBeenCalledWith({
      type: 'bulkChange',
      memberIds: ['opaque-1'],
      values: { accountStatus: 'flagged', restrictions: ['specialContent'] },
    });
  });

  it('opens SMS and email only with frozen selected ids', () => {
    const onActionIntent = vi.fn();
    render(<AllMemberListScreen {...baseProps} onActionIntent={onActionIntent} />);
    fireEvent.click(screen.getByRole('button', { name: 'SMS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('SMS를 발송할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getAllByRole('button', { name: '이메일' })[0]!);
    expect(screen.getByRole('dialog')).toHaveTextContent('이메일을 발송할 항목을 선택해주세요.');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getAllByRole('checkbox', { name: /선택/ })[1]!);
    fireEvent.click(screen.getAllByRole('button', { name: '이메일' })[0]!);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('이메일 발송');
    expect(onActionIntent).toHaveBeenCalledWith({
      type: 'email',
      memberIds: ['opaque-1'],
    });
  });
});
