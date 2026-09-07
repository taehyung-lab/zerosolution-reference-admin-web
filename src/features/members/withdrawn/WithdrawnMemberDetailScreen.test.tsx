import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { WithdrawnMemberDetailScreen } from './WithdrawnMemberDetailScreen';
import { memberRecordFixtures } from '../fixtures/member-records';

it('binds the withdrawn member ID to the confirmed activity deletion', async () => {
  const member = memberRecordFixtures().withdrawn[0]!;
  const onDeleteActivity = vi.fn();
  render(<TestQueryLocaleProvider>
    <WithdrawnMemberDetailScreen
      member={member}
      onDeleteActivity={onDeleteActivity}
    />
  </TestQueryLocaleProvider>);
  fireEvent.click(
    await screen.findByRole(
      'checkbox',
      { name: 'EXAMPLE-001 선택' },
      { timeout: 5000 },
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '취소' }));
  expect(onDeleteActivity).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '선택삭제' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
  expect(onDeleteActivity).toHaveBeenCalledExactlyOnceWith({
    memberId: member.id,
    input: { tab: 'ticket', ids: [member.id + ':ticket:1'] },
  });
});
