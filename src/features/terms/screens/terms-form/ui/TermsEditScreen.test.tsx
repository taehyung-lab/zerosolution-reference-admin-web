import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';
import { TestQueryLocaleProvider } from '@/test/query-locale';
import { TermsEditScreen } from './TermsEditScreen';

vi.mock('@tanstack/react-router', () => ({
  useBlocker: () => ({ status: 'idle' }),
}));

function renderScreen(termsId = 'reference-terms-1') {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <TestQueryLocaleProvider>
      <UnsavedChangesProvider>
        <TermsEditScreen termsId={termsId} onSaved={onSaved} onCancel={onCancel} />
      </UnsavedChangesProvider>
    </TestQueryLocaleProvider>,
  );
  return { onSaved, onCancel };
}

describe('TermsEditScreen (11.2.4 약관 수정)', () => {
  it('등록과 같은 항목을 조회 값으로 채워 보여 준다', async () => {
    renderScreen();

    expect(await screen.findByRole('textbox', { name: /버전/ })).toHaveValue('1.2');
    expect(screen.getByRole('combobox', { name: '게시 상태' })).toHaveTextContent('게시안함');
    expect(screen.getByRole('textbox', { name: /본문/ })).toHaveDisplayValue(
      /Reference 서비스 이용약관/,
    );
  });

  it('값을 고치고 저장하면 확인을 지나 그 약관의 수정 요청에 닿는다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { onSaved } = renderScreen();
    await screen.findByRole('textbox', { name: /버전/ });

    fireEvent.change(screen.getByRole('textbox', { name: /버전/ }), { target: { value: '1.3' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('저장하시겠습니까?');
    fireEvent.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('[시나리오] 약관 수정')),
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('저장되었습니다.'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('reference-terms-1'));
    log.mockRestore();
  });

  it('취소는 공용 이탈 guard 를 지나 caller 의 되돌아가기를 부른다', async () => {
    const { onCancel } = renderScreen();
    await screen.findByRole('textbox', { name: /버전/ });

    fireEvent.click(screen.getByRole('button', { name: '취소' }));

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});
