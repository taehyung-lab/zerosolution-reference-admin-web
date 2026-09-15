import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KeywordChipField } from './KeywordChipField';

function renderField(onAdd: () => void) {
  return render(
    <form>
      <KeywordChipField
        items={[]}
        addLabel="추가"
        removeLabel={(item) => `${item.value} 삭제`}
        inputLabel="검색어"
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
