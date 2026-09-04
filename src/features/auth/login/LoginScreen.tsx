import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/error'
import { isFeatureError } from '@/api/error-outcome'
import { Button } from '@/shared/ui/primitives/Button'
import { FormTextField } from '@/shared/ui/form/FormTextField'
import { useSignInMutation } from './useSignInMutation'
import { toSignInRequest } from './login-mapper'
import { loginSchema, type LoginValues } from './login-schema'

interface LoginScreenProps {
  readonly onAuthenticated: (accessToken: string) => void
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [rootError, setRootError] = useState<string>()
  const mutation = useSignInMutation()
  const form = useForm({
    defaultValues: { id: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      const values: LoginValues = loginSchema.parse(value)
      setRootError(undefined)
      try {
        const session = await mutation.mutateAsync(toSignInRequest(values))
        if (session.requirePasswordChange) {
          console.error('Password change flow is not implemented')
          setRootError(t('errors.flowNotImplemented'))
          return
        }
        onAuthenticated(session.accessToken)
        await navigate({ to: '/' })
      } catch (error: unknown) {
        applyLoginError(error)
      }
    },
  })

  function setFieldError(field: 'id' | 'password') {
    form.setFieldMeta(field, (previous) => ({
      ...previous,
      errorMap: { ...previous?.errorMap, onServer: t('errors.invalidField') },
    }))
  }

  function applyLoginError(error: unknown) {
    if (error instanceof ApiError && error.kind === 'validation') {
      for (const fieldError of error.fieldErrors) {
        if (fieldError.field === 'id' || fieldError.field === 'password') {
          setFieldError(fieldError.field)
        } else {
          setRootError(t('errors.general'))
        }
      }
      return
    }
    if (error instanceof ApiError) {
      if (!isFeatureError(error)) return
      if (error.kind === 'network' || error.kind === 'timeout') {
        setRootError(t('errors.connection'))
        return
      }
      if (error.kind === 'server-error') {
        setRootError(t('errors.server'))
        return
      }
      if (error.kind === 'rate-limited') {
        setRootError(t('errors.rateLimited'))
        return
      }
      if (error.kind === 'business') {
        setRootError(t('errors.invalidCredentials'))
        return
      }
    }
    setRootError(t('errors.general'))
  }

  return (
    <div className="grid min-h-dvh grid-rows-[1fr_auto] bg-white">
      <div className="grid md:grid-cols-2">
        <aside className="hidden bg-neutral-950 p-12 text-white md:block"><span className="text-2xl font-bold">{t('brand')}</span></aside>
        <main className="flex items-center justify-center p-8">
          <form className="w-full max-w-sm space-y-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
            <h1 className="text-center text-2xl font-semibold">{t('title')}</h1>
            {rootError === undefined ? null : <p role="alert" className="text-sm text-red-700">{rootError}</p>}
            <FormTextField name="id" label={t('fields.id')} form={form} required autoComplete="username" />
            <FormTextField name="password" label={t('fields.password')} form={form} required type="password" autoComplete="current-password" />
            <Button className="w-full" type="submit" disabled={mutation.isPending}>{t('actions.signIn')}</Button>
            {/* These slots remain intentionally unconnected until their workflows are implemented. */}
            <Button className="w-full" disabled>{t('actions.signUp')}</Button>
            <div className="flex justify-between text-xs text-neutral-600"><span>{t('slots.findCredentials')}</span><span>{t('slots.signUpResult')}</span></div>
          </form>
        </main>
      </div>
      <footer className="flex justify-between border-t px-6 py-4 text-xs text-neutral-600"><span>{t('footer.copyright')}</span><span>{t('footer.locale')}</span></footer>
    </div>
  )
}
