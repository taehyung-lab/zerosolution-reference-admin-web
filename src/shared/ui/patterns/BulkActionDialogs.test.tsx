import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBulkActionDialogs } from './BulkActionDialogs';

describe('useBulkActionDialogs', () => {
  it('opens the missing-selection alert without running an action', () => {
    const run = vi.fn();
    const { result } = renderHook(() =>
      useBulkActionDialogs({ selectedCount: 0, run }),
    );

    act(() => expect(result.current.requireSelection()).toBe(false));

    expect(result.current.state.kind).toBe('missingSelection');
    expect(run).not.toHaveBeenCalled();
  });

  it('freezes values for confirmation and runs exactly those values', () => {
    const run = vi.fn();
    const values = { status: 'flagged' };
    const { result, rerender } = renderHook(
      ({ count }) => useBulkActionDialogs({ selectedCount: count, run }),
      { initialProps: { count: 2 } },
    );

    act(() => {
      expect(result.current.requireSelection()).toBe(true);
      result.current.requestConfirmation(values);
    });
    rerender({ count: 0 });
    act(() => result.current.confirm());

    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith(values);
    expect(result.current.state.kind).toBe('closed');
  });
});
