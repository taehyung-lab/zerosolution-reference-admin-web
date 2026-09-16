import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { MemberActivitySection } from './MemberActivitySection';

function setup() {
  const onDelete = vi.fn(() => Promise.resolve());
  render(
    <TestQueryLocaleProvider>
      <MemberActivitySection memberId="example-general" onDelete={onDelete} />
    </TestQueryLocaleProvider>,
  );
  return { onDelete };
}

describe('MemberActivitySection', () => {
  it('checks selection, preserves cancel, and sends only confirmed target IDs of the active tab', async () => {
    const { onDelete } = setup();
    await screen.findByRole('checkbox', { name: 'EXAMPLE-001 선택' });
    fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('변경할 항목을 선택해주세요.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'EXAMPLE-001 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '취소' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'EXAMPLE-001 선택' })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledExactlyOnceWith({ tab: 'ticket', ids: ['example-general:ticket:1'] }));
  });

  it('searches within the tab, pages by 100, and hides deletion on the entry tab', async () => {
    setup();
    await screen.findByRole('checkbox', { name: 'EXAMPLE-001 선택' });
    expect(screen.getAllByRole('row')).toHaveLength(101);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));

    fireEvent.change(screen.getByRole('textbox', { name: '검색' }), { target: { value: 'not-found' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect(await screen.findByText('일치하는 검색결과가 없습니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '초기화' }));
    await screen.findByRole('checkbox', { name: 'EXAMPLE-001 선택' });

    fireEvent.mouseDown(screen.getByRole('tab', { name: '입장기록' }), { button: 0 });
    await waitFor(() => expect(screen.queryByRole('button', { name: '선택삭제' })).toBeNull());
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByRole('columnheader', { name: '입장일' })).toBeInTheDocument();
  });
});
