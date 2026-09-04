import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useKeywordDraft } from './use-keyword-draft';

describe('useKeywordDraft', () => {
  it('trims and adds a pending item, then clears only its value', () => {
    const { result } = renderHook(() =>
      useKeywordDraft<'ID' | 'NAME'>({
        committedItems: [],
        initialField: 'ID',
        resetKey: 'committed',
      }),
    );
    act(() => result.current.setPendingField('NAME'));
    act(() => result.current.setPendingValue('  Kim  '));

    let added: readonly { field: string; value: string }[] = [];
    act(() => {
      added = result.current.addPending();
    });

    expect(added).toEqual([{ field: 'NAME', value: 'Kim' }]);
    expect(result.current.items).toEqual([{ field: 'NAME', value: 'Kim' }]);
    expect(result.current.pending).toEqual({ field: 'NAME', value: '' });
  });

  it('does not add a whitespace-only pending item', () => {
    const { result } = renderHook(() =>
      useKeywordDraft({
        committedItems: [{ field: 'ID', value: 'kept' }],
        initialField: 'ID',
        resetKey: 'committed',
      }),
    );
    act(() => result.current.setPendingValue('   '));

    expect(result.current.addPending()).toEqual([
      { field: 'ID', value: 'kept' },
    ]);
    expect(result.current.items).toEqual([{ field: 'ID', value: 'kept' }]);
  });

  it('supports field-less keywords without a mode branch', () => {
    const { result } = renderHook(() =>
      useKeywordDraft<undefined>({
        committedItems: [{ field: undefined, value: 'committed' }],
        initialField: undefined,
        resetKey: 'committed',
      }),
    );
    act(() => result.current.setPendingValue(' pending '));

    expect(result.current.itemsIncludingPending()).toEqual([
      { field: undefined, value: 'committed' },
      { field: undefined, value: 'pending' },
    ]);
  });

  it('updates pending parts and removes or clears committed items', () => {
    const { result } = renderHook(() =>
      useKeywordDraft<'ID' | 'NAME'>({
        committedItems: [
          { field: 'ID', value: 'first' },
          { field: 'NAME', value: 'second' },
        ],
        initialField: 'ID',
        resetKey: 'committed',
      }),
    );

    act(() => result.current.setPendingField('NAME'));
    expect(result.current.pending.field).toBe('NAME');
    act(() => result.current.setPendingValue('third'));
    expect(result.current.pending.value).toBe('third');
    act(() => result.current.removeAt(0));
    expect(result.current.items).toEqual([{ field: 'NAME', value: 'second' }]);
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });

  it('rebuilds from committed values when the reset key changes', () => {
    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        useKeywordDraft({
          committedItems: [{ field: 'ID', value: resetKey }],
          initialField: 'ID',
          resetKey,
        }),
      { initialProps: { resetKey: 'first' } },
    );
    act(() => result.current.setPendingValue('uncommitted'));

    rerender({ resetKey: 'second' });

    expect(result.current.items).toEqual([{ field: 'ID', value: 'second' }]);
    expect(result.current.pending.value).toBe('');
  });

  it('rebuilds committed items and pending input when a caller resets the draft', () => {
    const { result } = renderHook(() =>
      useKeywordDraft<'ID' | 'PHONE'>({
        committedItems: [{ field: 'ID', value: 'saved' }],
        initialField: 'ID',
        resetKey: 'committed',
      }),
    );

    act(() => result.current.setPendingField('PHONE'));
    act(() => result.current.setPendingValue('010'));
    act(() => {
      result.current.addPending();
    });
    act(() => result.current.reset());

    expect(result.current.items).toEqual([{ field: 'ID', value: 'saved' }]);
    expect(result.current.pending).toEqual({ field: 'ID', value: '' });
  });
});
