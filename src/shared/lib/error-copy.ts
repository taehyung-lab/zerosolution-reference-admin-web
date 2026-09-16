/** The diagnostic facts a rejected request may carry. Read structurally; shared owns no error class. */
export function errorTraceOf(error: unknown): {
  readonly kind?: string | undefined;
  readonly requestId?: string | undefined;
  readonly status?: number | undefined;
} {
  if (typeof error !== 'object' || error === null) return {};
  const value = error as { kind?: unknown; requestId?: unknown; status?: unknown };
  return {
    kind: typeof value.kind === 'string' ? value.kind : undefined,
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
    status: typeof value.status === 'number' ? value.status : undefined,
  };
}

/**
 * A normalized failure kind → the `shared` copy key a surface may show for it. Shared UI knows the
 * kind only as a string; the layer that classifies responses owns the vocabulary. An unknown or
 * missing kind reads as the generic "could not process" line.
 */
export function errorMessageKey(kind: string | undefined) {
  switch (kind) {
    case 'network': return 'error.kind.network' as const;
    case 'timeout': return 'error.kind.timeout' as const;
    case 'cancelled': return 'error.kind.cancelled' as const;
    case 'business': return 'error.kind.business' as const;
    case 'unauthorized': return 'error.kind.unauthorized' as const;
    case 'forbidden': return 'error.kind.forbidden' as const;
    case 'validation': return 'error.kind.validation' as const;
    case 'not-found': return 'error.kind.notFound' as const;
    case 'conflict': return 'error.kind.conflict' as const;
    case 'rate-limited': return 'error.kind.rateLimited' as const;
    case 'server-error': return 'error.kind.serverError' as const;
    case 'contract': return 'error.kind.contract' as const;
    default: return 'error.unexpected.body' as const;
  }
}
