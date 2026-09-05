import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePageRowSelection } from './use-page-row-selection';

type Row = { readonly id: string; readonly locked?: boolean };

const rows: readonly Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c', locked: true }];

const setup = (initial: { rows: readonly Row[]; resetKey: string }) =>
  renderHook(
    ({ rows: current, resetKey }: { rows: readonly Row[]; resetKey: string }) =>
      usePageRowSelection({
        rows: current,
        getId: (row) => row.id,
        isSelectable: (row) => row.locked !== true,
        resetKey,
      }),
    { initialProps: initial },
  );

describe('usePageRowSelection', () => {
  it('selects only the selectable rows of the current page', () => {
    const { result } = setup({ rows, resetKey: 'view-1' });

    act(() => result.current.togglePage(true));
    expect(result.current.selectedIds).toEqual(['a', 'b']);
    expect(result.current.isAllChecked).toBe(true);
    expect(result.current.isMixed).toBe(false);

    act(() => result.current.toggleRow(rows[0]!, false));
    expect(result.current.selectedIds).toEqual(['b']);
    expect(result.current.isMixed).toBe(true);
  });

  it('drops the selection when the committed view changes', () => {
    const { result, rerender } = setup({ rows, resetKey: 'view-1' });
    act(() => result.current.toggleRow(rows[0]!, true));

    rerender({ rows, resetKey: 'view-2' });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('does not restore an id that left and later returned to the same view', () => {
    const { result, rerender } = setup({ rows, resetKey: 'view-1' });
    act(() => result.current.toggleRow(rows[0]!, true));

    rerender({ rows: rows.slice(1), resetKey: 'view-1' });
    expect(result.current.selectedIds).toEqual([]);

    rerender({ rows, resetKey: 'view-1' });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('keeps an empty page from reporting an all-checked header', () => {
    const { result } = setup({ rows: [], resetKey: 'view-1' });
    expect(result.current.isAllChecked).toBe(false);
    expect(result.current.isMixed).toBe(false);
  });
});

describe('usePageRowSelection with a caller that maps rows every render', () => {
  it('keeps the selection when the same page arrives as a new array', () => {
    const { result, rerender } = setup({ rows: rows.map((row) => ({ ...row })), resetKey: 'view-1' });
    act(() => result.current.toggleRow(rows[0]!, true));

    rerender({ rows: rows.map((row) => ({ ...row })), resetKey: 'view-1' });
    expect(result.current.selectedIds).toEqual(['a']);
  });
});
