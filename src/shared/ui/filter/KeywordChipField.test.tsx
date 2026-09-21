import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/shared/i18n/i18n';
import { describe, expect, it, vi } from 'vitest';
import { KeywordChipField } from './KeywordChipField';

function renderWithI18n(node: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
}

function renderField(onAdd: () => void) {
  return renderWithI18n(
    <form>
      <KeywordChipField
        items={[]}
        formatItem={(item) => item.value}
        pendingValue="ada"
        onPendingValueChange={vi.fn()}
        onAdd={onAdd}
        onRemoveAt={vi.fn()}
      />
    </form>,
  );
}

describe('KeywordChipField', () => {
  it('adds the pending keyword on Enter so it never leaks to the search form', () => {
    const onAdd = vi.fn();
    const { container } = renderField(onAdd);
    const event = createEvent.keyDown(screen.getByRole('textbox', { name: '검색어' }), {
      key: 'Enter',
    });
    fireEvent(container.querySelector('input') as HTMLInputElement, event);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves Enter alone while an IME composition is open', () => {
    const onAdd = vi.fn();
    renderField(onAdd);

    fireEvent.keyDown(screen.getByRole('textbox', { name: '검색어' }), {
      key: 'Enter',
      isComposing: true,
    });

    expect(onAdd).not.toHaveBeenCalled();
  });
});
