import { act, fireEvent, render as renderBare, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { useConfirmation } from './useConfirmation';

const I18n = ({ children }: { readonly children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);
const render = (ui: ReactElement) => renderBare(ui, { wrapper: I18n });

function Host({ run }: { readonly run: (id: string) => void | Promise<unknown> }) {
  const deletion = useConfirmation<string>({ run, description: '삭제하시겠습니까?' });
  return (
    <>
      <button type="button" onClick={() => deletion.request('r-1')}>
        delete
      </button>
      <span data-testid="pending">{String(deletion.pending)}</span>
      {deletion.dialog}
    </>
  );
}

describe('useConfirmation', () => {
  it('asks, runs with the requested values, and closes when the run settles', async () => {
    const run = vi.fn(() => Promise.resolve());
    render(<Host run={run} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('삭제하시겠습니까?');

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(run).toHaveBeenCalledWith('r-1');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels without running', () => {
    const run = vi.fn();
    render(<Host run={run} />);
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(run).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open with the failure line when the run rejects, and blocks a second run while pending', async () => {
    let settle: (() => void) | undefined;
    const run = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          settle = () =>
            reject(Object.assign(new Error('timeout'), { kind: 'timeout', requestId: 'req-9' }));
        }),
    );
    render(<Host run={run} />);
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByTestId('pending')).toHaveTextContent('true');
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();

    await act(async () => {
      settle?.();
      await Promise.resolve();
    });

    expect(run).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '요청 시간이 초과되었습니다. 다시 시도해 주세요.',
    );
    expect(screen.getByTestId('pending')).toHaveTextContent('false');
    expect(screen.getByRole('button', { name: '확인' })).toBeEnabled();
  });
});
