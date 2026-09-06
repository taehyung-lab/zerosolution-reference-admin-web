import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { chooseOptionIn } from '@/test/select';
import { TestLocaleProvider } from '@/test/locale';
import { managerOptionFixtures, findManagerFixture } from '../fixtures/managers';
import { ManagerCreateInputScreen, ManagerEditInputScreen } from './ManagerInputScreens';
import { toManagerEditDefaults } from './manager-form-defaults';

let guardDisabled = true;
const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useBlocker: (options: { disabled: boolean }) => {
    guardDisabled = options.disabled;
    return { status: 'idle' };
  },
}));

describe('manager request-only forms', () => {
  it('shows first blur mismatch then accepts a corrected Enter submission once', async () => {
    render(<TestLocaleProvider><ManagerCreateInputScreen optionsForType={managerOptionFixtures} onConfirm={vi.fn()} /></TestLocaleProvider>);
    await chooseOptionIn('유형', 'Example type');
    await chooseOptionIn('권한', 'Example permission');
    for (const [label, value] of [['아이디*','operator99'],['비밀번호*','Safe!729'],['비밀번호 확인*','wrong'],['이름*','김'],['휴대폰번호*','010-1234-5678'],['이메일*','operator@example.com']] as const)
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const confirmation = screen.getByLabelText('비밀번호 확인*');
    fireEvent.blur(confirmation);
    expect(await screen.findByRole('alert')).toHaveTextContent('일치');
    fireEvent.change(confirmation, { target: { value: 'Safe!729' } });
    fireEvent.submit(confirmation.closest('form')!);
    expect(await screen.findByRole('dialog')).toHaveTextContent('저장하시겠습니까?');
  });
  it('validates, confirms and preserves dirty input without a saved acknowledgement', async () => {
    const onConfirm = vi.fn();
    render(
      <TestLocaleProvider>
        <ManagerCreateInputScreen optionsForType={managerOptionFixtures} onConfirm={onConfirm} />
      </TestLocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '유형' })).toHaveFocus());
    await chooseOptionIn('유형', 'Example type');
    await chooseOptionIn('권한', 'Example permission');
    for (const [label, value] of [
      ['아이디*', 'operator99'],
      ['비밀번호*', 'Safe!729'],
      ['비밀번호 확인*', 'Safe!729'],
      ['이름*', '김'],
      ['휴대폰번호*', '010-1234-5678'],
      ['이메일*', 'operator@example.com'],
    ])
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: '확인',
      }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'operator99', name: '김' }),
    );
    expect(screen.queryByText('저장되었습니다.')).not.toBeInTheDocument();
    expect(guardDisabled).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('restores clean state and clears permission after changing type', async () => {
    const record = findManagerFixture('example-active')!;
    render(
      <TestLocaleProvider>
        <ManagerEditInputScreen
          managerId="example-active"
          defaults={toManagerEditDefaults(record.detail)}
          optionsForType={managerOptionFixtures}
          onConfirm={vi.fn()}
        />
      </TestLocaleProvider>,
    );
    expect(guardDisabled).toBe(true);
    fireEvent.change(screen.getByLabelText('이름*'), {
      target: { value: 'Changed' },
    });
    expect(guardDisabled).toBe(false);
    fireEvent.change(screen.getByLabelText('이름*'), {
      target: { value: record.detail.name },
    });
    expect(guardDisabled).toBe(true);
    await chooseOptionIn('유형', 'Example site type');
    expect(screen.getByRole('combobox', { name: '권한' })).toHaveTextContent('선택');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: '권한' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
