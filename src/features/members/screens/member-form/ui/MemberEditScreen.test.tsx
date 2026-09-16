import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { MemberEditScreen } from './MemberEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(memberId = 'example-flagged') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <MemberEditScreen memberId={memberId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('MemberEditScreen (4.2.3 회원 수정)', () => {
  it('조회한 값으로 항목을 채우고 이메일은 읽기 전용, 불량회원의 활동제한이 보인다', async () => {
    setup();
    expect(await screen.findByLabelText('이름*')).toHaveValue('예시불량');
    expect(screen.getByText('flagged@example.test', { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByLabelText('이메일*')).toBeNull();
    expect(screen.getByRole('checkbox', { name: '1:1문의' })).toBeChecked();
  });

  it('일반회원으로 바꾸면 활동제한이 숨고 다시 불량회원이면 같은 선택이 돌아오며, 저장은 요청 함수 뒤 조회로 간다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    await screen.findByRole('checkbox', { name: '1:1문의' });

    await chooseOptionIn('계정 상태', '일반회원');
    expect(screen.queryByRole('checkbox', { name: '1:1문의' })).toBeNull();
    await chooseOptionIn('계정 상태', '불량회원');
    expect(await screen.findByRole('checkbox', { name: '1:1문의' })).toBeChecked();

    await chooseOptionIn('계정 상태', '일반회원');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '확인' }));
    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 회원 수정'));
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('example-flagged'));
    log.mockRestore();
  });

  it('불량회원인데 활동제한이 비면 저장을 막고 확인창을 열지 않는다', async () => {
    setup();
    fireEvent.click(await screen.findByRole('checkbox', { name: '1:1문의' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('활동제한을 선택해주세요.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('없는 ID 는 not-found 문구로 닫고 폼을 그리지 않는다', async () => {
    setup('no-such-member');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });
});
