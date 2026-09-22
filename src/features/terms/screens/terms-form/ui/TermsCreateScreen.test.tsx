import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { TermsCreateScreen } from './TermsCreateScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

/**
 * 날짜 입력은 공용 `Calendar`(달력 그리드) 하나다 — 텍스트 입력이 아니라서 보이는 날짜 칸을 누른다.
 * 달력은 오늘이 든 달을 먼저 그리므로 그 달의 `day` 일을 골라 값과 기대값을 함께 만든다.
 */
function pickDayIn(label: RegExp, day: number): string {
  const group = screen.getByRole('group', { name: label });
  const cell = within(group)
    .getAllByRole('button')
    .find((button) => button.textContent?.trim() === String(day));
  fireEvent.click(cell!);
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function renderScreen() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <TermsCreateScreen onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('TermsCreateScreen (11.2.3 약관 등록)', () => {
  it('frame 초기 상태를 그린다 — 게시 상태 게시, 나머지는 빈 값', async () => {
    renderScreen();

    expect(await screen.findByRole('combobox', { name: '게시 상태' })).toHaveTextContent('게시');
    expect(screen.getByRole('textbox', { name: /버전/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /본문/ })).toHaveValue('');
    // 시행일 default 는 Notion 의 `미선택` 이고 게시일도 frame 이 빈 입력을 그린다.
    for (const label of [/시행일/, /게시일/]) {
      const group = screen.getByRole('group', { name: label });
      expect(within(group).queryByRole('button', { pressed: true })).toBeNull();
    }
  });

  it('필수 입력을 비운 채 저장하면 저장 요청 없이 필드 문구가 나온다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '게시 상태' });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('버전을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('시행일을 선택해주세요.')).toBeInTheDocument();
    expect(screen.getByText('게시일을 선택해주세요.')).toBeInTheDocument();
    expect(screen.getByText('본문을 입력해주세요.')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  // Notion: `버전 → 입력가능문자 : 숫자, 점(.)` · `입력가능글자수 : 10자 이하`.
  it('버전이 숫자·점이 아니거나 10자를 넘으면 저장 전에 거절한다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    renderScreen();
    await screen.findByRole('combobox', { name: '게시 상태' });

    fireEvent.change(screen.getByRole('textbox', { name: /버전/ }), { target: { value: 'V1.2' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('버전은 숫자와 점(.)만 입력할 수 있습니다.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /버전/ }), {
      target: { value: '1.2.3.4.5.6' },
    });
    await waitFor(() =>
      expect(screen.getByText('버전은 10자 이하로 입력해주세요.')).toBeInTheDocument(),
    );
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('값을 채우고 저장하면 확인을 지나 요청 함수에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = renderScreen();
    await screen.findByRole('combobox', { name: '게시 상태' });

    fireEvent.change(screen.getByRole('textbox', { name: /버전/ }), { target: { value: '1.3' } });
    pickDayIn(/시행일/, 1);
    pickDayIn(/게시일/, 2);
    fireEvent.change(screen.getByRole('textbox', { name: /본문/ }), {
      target: { value: 'Reference 새 약관 본문' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 등록')),
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('저장되었습니다.'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    log.mockRestore();
  });
});
