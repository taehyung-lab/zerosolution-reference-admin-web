import { useBlocker } from '@tanstack/react-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../patterns/ConfirmDialog';

interface GuardFacts {
  readonly when: boolean;
  readonly refuseSilently?: boolean;
}
interface RouteOwner {
  readonly register: (id: string, facts: GuardFacts) => () => void;
  readonly leave: (navigate: () => void) => void;
}
const RouteOwnerContext = createContext<RouteOwner | undefined>(undefined);

/** One Router blocker for all mounted forms; registered facts never include their values. */
export function UnsavedChangesProvider({ children }: { readonly children: ReactNode }) {
  const [forms, setForms] = useState<ReadonlyMap<string, GuardFacts>>(() => new Map());
  const register = useCallback((id: string, facts: GuardFacts) => {
    setForms((current) => new Map(current).set(id, facts));
    return () =>
      setForms((current) => {
        const next = new Map(current);
        next.delete(id);
        return next;
      });
  }, []);
  const facts = [...forms.values()];
  const guard = useGuard({
    when: facts.some((form) => form.when),
    refuseSilently: facts.some((form) => form.refuseSilently),
  });
  return (
    <RouteOwnerContext.Provider value={{ register, leave: guard.leave }}>
      {children}
      {guard.dialog}
    </RouteOwnerContext.Provider>
  );
}

/**
 * With a provider, route exits ask once for all mounted dirty forms; without it this hook owns
 * the route blocker. Local dismissal stays scoped to the caller, which keeps its form mounted
 * until discard is confirmed. No destination or form value is copied into the provider.
 * Pending saves refuse exits silently because the measured progress overlay obscures a question.
 * This remains the one shared file allowed to import the Router.
 */
export function useUnsavedChangesGuard({
  when,
  refuseSilently = false,
}: {
  readonly when: boolean;
  readonly refuseSilently?: boolean;
}) {
  const owner = useContext(RouteOwnerContext);
  const id = useId();
  const register = owner?.register;
  useLayoutEffect(
    () => register?.(id, { when, refuseSilently }),
    [register, id, when, refuseSilently],
  );
  return useGuard({ when, refuseSilently }, owner);
}

function useGuard(
  { when, refuseSilently = false }: GuardFacts,
  owner?: RouteOwner,
): {
  readonly dialog: ReactNode;
  readonly leave: (navigate: () => void) => void;
  readonly close: (discard: () => void, scope?: { readonly when: boolean }) => void;
} {
  const { t } = useTranslation('shared');
  const [reason, setReason] = useState<'navigate' | 'cancel'>('navigate');
  const [discard, setDiscard] = useState<(() => void) | undefined>();
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    withResolver: true,
    disabled: owner !== undefined || !when,
  });
  const blocked = blocker.status === 'blocked';
  const reset = blocked ? blocker.reset : undefined;
  useEffect(() => {
    if (refuseSilently) reset?.();
  }, [refuseSilently, reset]);

  const leave = (navigate: () => void) => {
    if (refuseSilently) return;
    if (owner) return owner.leave(navigate);
    if (when) setReason('cancel');
    navigate();
  };
  const close = (action: () => void, scope?: { readonly when: boolean }) => {
    if (refuseSilently) return;
    if (!(scope?.when ?? when)) return action();
    setDiscard(() => action);
  };

  if ((!blocked && discard === undefined) || refuseSilently) return { dialog: null, leave, close };

  const copy =
    discard !== undefined || reason === 'cancel'
      ? {
          description: t('formCancel.description'),
          confirm: t('formCancel.confirm'),
          cancel: t('formCancel.keep'),
        }
      : {
          description: t('unsavedChanges.description'),
          confirm: t('unsavedChanges.confirm'),
          cancel: t('unsavedChanges.cancel'),
        };

  return {
    leave,
    close,
    dialog: (
      <ConfirmDialog
        cancelLabel={copy.cancel}
        confirmLabel={copy.confirm}
        description={copy.description}
        onConfirm={() => {
          setReason('navigate');
          if (discard !== undefined) {
            setDiscard(undefined);
            discard();
          } else if (blocker.status === 'blocked') blocker.proceed();
        }}
        onOpenChange={(open) => {
          if (open) return;
          setReason('navigate');
          setDiscard(undefined);
          if (blocker.status === 'blocked') blocker.reset();
        }}
        open
        title={t('alert.title')}
      />
    ),
  };
}
