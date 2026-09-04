import { ApiError } from '@/api/error'
import { isFeatureError } from '@/api/error-outcome'

/**
 * How a save can fail without a field to attach the message to. The vocabulary is product
 * copy, not server kinds: `shared` declares the same three names structurally so it can render
 * them without importing this layer.
 */
export type FormSaveFailure = 'general' | 'validation' | 'connection'

export interface FormErrorOutcome<TField extends string> {
  /** Fields the server rejected, in the caller's declared order. */
  readonly fields: readonly TField[]
  readonly root?: FormSaveFailure
}

/**
 * Classifies a rejected save for the form. `undefined` means the form has nothing to show:
 * the transport already published unauthorized/forbidden as an app incident before rejecting,
 * and a cancelled request has no surface.
 */
export function classifyFormError<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): FormErrorOutcome<TField> | undefined {
  if (!(error instanceof ApiError)) return { fields: [], root: 'general' }
  if (!isFeatureError(error)) return undefined
  if (error.kind === 'validation') {
    const rejected = fields.filter((field) => error.fieldErrors.some((issue) => issue.field === field))
    return rejected.length === 0 ? { fields: [], root: 'validation' } : { fields: rejected }
  }
  if (error.kind === 'network' || error.kind === 'timeout') return { fields: [], root: 'connection' }
  return { fields: [], root: 'general' }
}
