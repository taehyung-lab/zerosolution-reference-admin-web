import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { i18n } from '@/shared/i18n/i18n';
import { useSelectionGate } from '@/shared/model/use-selection-gate';
import { SelectionAlert } from './SelectionAlert';

describe('SelectionAlert', () => {
  it('lets one gate reject different actions and passes once a selection exists', () => {
    const run = vi.fn();
    function Harness({ count }: { readonly count: number }) {
      const gate = useSelectionGate(count);
      return (
        <>
          <button
            onClick={() => {
              if (gate.requireSelection('Choose recipients')) run();
            }}
          >
            Send
          </button>
          <button
            onClick={() => {
              if (gate.requireSelection('Choose rows')) run();
            }}
          >
            Copy
          </button>
          <SelectionAlert controller={gate} />
        </>
      );
    }
    const { rerender } = render(<Harness count={0} />, {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Choose recipients');
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Choose rows');
    expect(run).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    rerender(<Harness count={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
