import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDraftCommit } from './use-draft-commit';

describe('useDraftCommit', () => {
  it('preserves local draft for the same key and rebuilds it when the committed key changes', () => {
    const { result, rerender } = renderHook(
      ({ committed }) => useDraftCommit({ committed, keyOf: (value) => value.id, createDraft: (value) => ({ name: value.name }) }),
      { initialProps: { committed: { id: '1', name: 'Ada' } } },
    );

    act(() => result.current.setDraft({ name: 'Local' }));
    rerender({ committed: { id: '1', name: 'Server' } });
    expect(result.current.draft).toEqual({ name: 'Local' });

    rerender({ committed: { id: '2', name: 'Grace' } });
    expect(result.current.draft).toEqual({ name: 'Grace' });
  });
});
