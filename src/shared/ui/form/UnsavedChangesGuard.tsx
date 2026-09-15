import { useBlocker } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../dialog/ConfirmDialog'

interface GuardFacts {
  readonly when: boolean
  readonly refuseSilently: boolean
}

interface RouteOwner {
  readonly register: (id: string, facts: GuardFacts) => () => void
  readonly leave: (navigate: () => void) => void
}

const RouteOwnerContext = createContext<RouteOwner | undefined>(undefined)

/** Owns the app's single Router blocker and browser-exit listener for registered draft forms. */
export function UnsavedChangesProvider({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation('shared')
  const [forms, setForms] = useState<ReadonlyMap<string, GuardFacts>>(() => new Map())
  const [reason, setReason] = useState<'navigate' | 'cancel'>('navigate')
  const register = useCallback((id: string, facts: GuardFacts) => {
    setForms((current) => new Map(current).set(id, facts))
    return () => {
      setForms((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
    }
  }, [])
  const facts = [...forms.values()]
  const isDirty = facts.some((form) => form.when)
  const isPending = facts.some((form) => form.refuseSilently)
  const shouldBlock = isDirty || isPending
  const blocker = useBlocker({
    shouldBlockFn: () => shouldBlock,
    withResolver: true,
    disabled: !shouldBlock,
  })
  const blocked = blocker.status === 'blocked'
  const reset = blocked ? blocker.reset : undefined

  useEffect(() => {
    if (isPending) reset?.()
  }, [isPending, reset])

  useEffect(() => {
    if (!shouldBlock) return
    const preventExit = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', preventExit)
    return () => window.removeEventListener('beforeunload', preventExit)
  }, [shouldBlock])

  const leave = useCallback((navigate: () => void) => {
    if (isPending) return
    if (isDirty) setReason('cancel')
    navigate()
  }, [isDirty, isPending])
  const owner = useMemo(() => ({ register, leave }), [leave, register])
  const copy = reason === 'cancel'
    ? {
        description: t('formCancel.description'),
        confirm: t('formCancel.confirm'),
        cancel: t('formCancel.keep'),
      }
    : {
        description: t('unsavedChanges.description'),
        confirm: t('unsavedChanges.confirm'),
        cancel: t('unsavedChanges.cancel'),
      }

  return (
    <RouteOwnerContext.Provider value={owner}>
      {children}
      {blocked && !isPending ? (
        <ConfirmDialog
          cancelLabel={copy.cancel}
          confirmLabel={copy.confirm}
          description={copy.description}
          onConfirm={() => {
            setReason('navigate')
            blocker.proceed()
          }}
          onOpenChange={(open) => {
            if (open) return
            setReason('navigate')
            blocker.reset()
          }}
          open
          title={t('alert.title')}
        />
      ) : null}
    </RouteOwnerContext.Provider>
  )
}

/** Registers one form and guards its local cancel, close, Escape, and outside-dismiss actions. */
export function useUnsavedChangesGuard({
  when,
  refuseSilently = false,
}: {
  readonly when: boolean
  readonly refuseSilently?: boolean
}) {
  const { t } = useTranslation('shared')
  const owner = useContext(RouteOwnerContext)
  if (owner === undefined) {
    throw new Error('useUnsavedChangesGuard requires UnsavedChangesProvider')
  }
  const id = useId()
  const [discard, setDiscard] = useState<(() => void) | undefined>()
  useLayoutEffect(
    () => owner.register(id, { when, refuseSilently }),
    [id, owner, when, refuseSilently],
  )

  const leave = (navigate: () => void) => owner.leave(navigate)
  const close = (action: () => void, scope?: { readonly when: boolean }) => {
    if (refuseSilently) return
    if (!(scope?.when ?? when)) return action()
    setDiscard(() => action)
  }

  return {
    leave,
    close,
    dialog: discard === undefined ? null : (
      <ConfirmDialog
        cancelLabel={t('formCancel.keep')}
        confirmLabel={t('formCancel.confirm')}
        description={t('formCancel.description')}
        onConfirm={() => {
          const action = discard
          setDiscard(undefined)
          action()
        }}
        onOpenChange={(open) => {
          if (!open) setDiscard(undefined)
        }}
        open
        title={t('alert.title')}
      />
    ),
  }
}
