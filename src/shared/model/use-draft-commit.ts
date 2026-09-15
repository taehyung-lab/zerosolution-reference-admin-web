import { useState, type Dispatch, type SetStateAction } from 'react';

/** Owns only the draft/committed-key transition; callers define identity and draft shape. */
export function useDraftCommit<TCommitted, TDraft, TKey>({
  committed,
  keyOf,
  createDraft,
}: {
  readonly committed: TCommitted;
  readonly keyOf: (committed: TCommitted) => TKey;
  readonly createDraft: (committed: TCommitted) => TDraft;
}): {
  readonly draft: TDraft;
  readonly setDraft: Dispatch<SetStateAction<TDraft>>;
  readonly patchDraft: (patch: Partial<TDraft>) => void;
  readonly resetDraft: () => void;
} {
  const key = keyOf(committed);
  const [stored, setStored] = useState(() => ({ key, draft: createDraft(committed) }));
  const current = Object.is(stored.key, key) ? stored : { key, draft: createDraft(committed) };

  if (current !== stored) setStored(current);

  const setDraft: Dispatch<SetStateAction<TDraft>> = (next) =>
    setStored((value) => ({
      key: value.key,
      draft: typeof next === 'function' ? (next as (draft: TDraft) => TDraft)(value.draft) : next,
    }));

  return {
    draft: current.draft,
    setDraft,
    /** Shallow merge form of `setDraft`; the caller still chooses which fields it may patch. */
    patchDraft: (patch) => setDraft((value) => ({ ...value, ...patch })),
    /**
     * Rebuilds from the current committed value. A commit already rebuilds on its own, so this
     * exists for the case where the caller discards a draft without changing the committed key.
     */
    resetDraft: () => setDraft(createDraft(committed)),
  };
}
