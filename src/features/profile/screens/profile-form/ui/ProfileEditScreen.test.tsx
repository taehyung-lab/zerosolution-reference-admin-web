import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { ProfileEditScreen } from './ProfileEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <ProfileEditScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('ProfileEditScreen (13.2 내정보 수정)', () => {
  it('조회한 값으로 항목을 채우고 아이디는 읽기 전용이다', async () => {
    setup();

    expect(await screen.findByLabelText('이름*')).toHaveValue('Example');
    expect(screen.getByLabelText('휴대폰번호*')).toHaveValue('010-0000-0000');
    expect(screen.getByLabelText('소속')).toHaveValue('Example org');
    expect(screen.getByText('example-operator', { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByLabelText('아이디*')).toBeNull();
  });

  it('비밀번호 입력은 수정 체크박스가 꺼진 채로 시작해 비활성이다', async () => {
    setup();
    await screen.findByLabelText('이름*');

    const checkbox = screen.getByLabelText('수정');
    expect(checkbox).not.toBeChecked();
    expect(screen.getByLabelText('비밀번호*')).toBeDisabled();
    expect(screen.getByLabelText('비밀번호 확인*')).toBeDisabled();

    fireEvent.click(checkbox);
    await waitFor(() => expect(screen.getByLabelText('비밀번호*')).toBeEnabled());
    expect(screen.getByLabelText('비밀번호 확인*')).toBeEnabled();
  });

  it('확인이 다르면 제출 전에도 포커스가 떠날 때 알려 준다', async () => {
    setup();
    await screen.findByLabelText('이름*');
    fireEvent.click(screen.getByLabelText('수정'));

    fireEvent.change(screen.getByLabelText('비밀번호*'), { target: { value: 'Qw9!zXr2' } });
    const confirm = screen.getByLabelText('비밀번호 확인*');
    fireEvent.change(confirm, { target: { value: 'Qw9!zXr3' } });
    fireEvent.blur(confirm);

    expect(await screen.findByText('비밀번호와 동일하게 입력해주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('빈 필수 입력은 확인창을 열지 않고 첫 오류에 focus 한다', async () => {
    setup();
    const name = await screen.findByLabelText('이름*');
    fireEvent.change(name, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(name).toHaveFocus();
  });

  it('저장은 확인 → 요청 함수 → 저장 완료 → 조회 이동으로 이어지고 비밀번호를 로그에 싣지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    fireEvent.change(await screen.findByLabelText('이름*'), { target: { value: '변경' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const confirm = await screen.findByRole('dialog');
    expect(confirm).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }));

    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 내정보 수정'));
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('변경'));
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    log.mockRestore();
  });

  it('저장 확인의 취소는 아무것도 부르지 않는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    fireEvent.change(await screen.findByLabelText('이름*'), { target: { value: '변경' } });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(within(confirm).getByRole('button', { name: '취소' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(log).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('취소는 공용 이탈 guard 를 지나 목적지로 나간다', async () => {
    // dirty 취소 질문 자체는 app 의 Router blocker 가 소유한다(`UnsavedChangesGuard.router.test.tsx`).
    // 여기서 닫는 것은 이 화면이 그 guard 를 거쳐 취소를 넘긴다는 배선이다.
    const { onCancel } = setup();
    fireEvent.change(await screen.findByLabelText('이름*'), { target: { value: '변경' } });

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});
