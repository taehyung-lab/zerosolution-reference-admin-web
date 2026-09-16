import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { chooseOptionIn } from '@/test/select';
import { ManagerEditScreen } from './ManagerEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function setup(managerId = 'example-active') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <ManagerEditScreen managerId={managerId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('ManagerEditScreen (11.1.4 운영자 수정)', () => {
  it('조회한 값으로 항목을 채우고 아이디는 읽기 전용이다', async () => {
    setup();

    expect(await screen.findByLabelText('이름*')).toHaveValue('Example3');
    expect(screen.getByText('example-active', { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByLabelText('아이디*')).toBeNull();
    expect(screen.queryByLabelText('비밀번호*')).toBeNull();
    await waitFor(() => expect(screen.getByRole('combobox', { name: '유형' })).toHaveTextContent('Example type'));
    expect(screen.getByRole('combobox', { name: '권한' })).toHaveTextContent('Example permission');
  });

  it('유형을 바꾸면 권한이 비워지고 다시 골라야 저장할 수 있다', async () => {
    setup();
    await screen.findByLabelText('이름*');
    await waitFor(() => expect(screen.getByRole('combobox', { name: '유형' })).toHaveTextContent('Example type'));

    await chooseOptionIn('유형', 'Example site type');
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toHaveTextContent('선택'));

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '권한' })).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('저장은 확인 → 요청 함수 → 저장 완료 → 조회 이동으로 이어진다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = setup();
    const name = await screen.findByLabelText('이름*');

    fireEvent.change(name, { target: { value: '변경' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const confirm = await screen.findByRole('dialog');
    expect(confirm).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }));

    const saved = await screen.findByText('저장되었습니다.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 운영자 수정 example-active'));
    fireEvent.click(within(saved.closest('[role="dialog"]')!).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('example-active'));
    log.mockRestore();
  });

  it('없는 ID 는 not-found 문구로 닫고 폼을 그리지 않는다', async () => {
    setup('no-such-manager');
    expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });
});
