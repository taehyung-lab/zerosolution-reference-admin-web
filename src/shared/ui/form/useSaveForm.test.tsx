import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { i18n } from '@/shared/i18n/i18n'
import { SectionCard } from '../patterns/SectionCard'
import { FormSaveFailureMessage } from './FormSaveDialogs'
import { FormTextField } from './FormTextField'
import { UnsavedChangesProvider } from './UnsavedChangesGuard'
import { useSaveForm, type FormErrorOutcome } from './useSaveForm'

/**
 * These tests run the real Router (memory history, real `useBlocker`) on purpose: the guard's
 * contract is "the acknowledged save leaves without asking, the dirty leave asks with the right
 * sentence", and a mocked blocker cannot tell whether the blocker was actually registered when
 * navigation committed.
 */

const schema = z.object({ name: z.string().min(1, 'name required'), email: z.string().min(1, 'email required') })
type Input = z.input<typeof schema>
const fields = ['name', 'email'] as const

const run = vi.fn<(values: z.output<typeof schema>) => Promise<{ canonical?: Input } | void>>()
let mapError: (error: unknown) => FormErrorOutcome<(typeof fields)[number]> | undefined = () => ({
  fields: [],
  root: 'general',
})

function Harness() {
  const [pending, setPending] = useState(false)
  const save = useSaveForm({
    schema,
    defaultValues: { name: '', email: '' } satisfies Input,
    sections: { info: fields },
    save: {
      run: async (values) => {
        setPending(true)
        try {
          return await run(values)
        } finally {
          setPending(false)
        }
      },
      getDefaultValues: (result) => result?.canonical,
      isPending: pending,
    },
    mapError,
    onDone: () => {
      router.history.push('/done')
    },
  })
  return (
    <>
      {save.dialogs}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void save.submit.run()
        }}
      >
        {save.stage.kind === 'failed' ? <FormSaveFailureMessage failure={save.stage.root} /> : null}
        <SectionCard title="info" {...save.sections.sectionProps('info')}>
          <FormTextField form={save.form} name="name" label="name" />
          <FormTextField form={save.form} name="email" label="email" />
        </SectionCard>
        <button type="submit">save</button>
        <button type="button" onClick={() => save.guard.leave(() => router.history.push('/done'))}>
          cancel
        </button>
      </form>
      {/* Navigation the user did not start from the form (LNB, back). The app's registered route
          types do not know this harness's paths, so it drives history directly — the blocker lives there. */}
      <button type="button" onClick={() => router.history.push('/done')}>
        lnb
      </button>
    </>
  )
}

const rootRoute = createRootRoute({ component: () => <UnsavedChangesProvider><Outlet /></UnsavedChangesProvider> })
const formRoute = createRoute({ getParentRoute: () => rootRoute, path: '/form', component: Harness })
const doneRoute = createRoute({ getParentRoute: () => rootRoute, path: '/done', component: () => <h1>done</h1> })
let router = createRouter({ routeTree: rootRoute.addChildren([formRoute, doneRoute]) })

function renderForm() {
  router = createRouter({
    routeTree: rootRoute.addChildren([formRoute, doneRoute]),
    history: createMemoryHistory({ initialEntries: ['/form'] }),
  })
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  )
  return router
}

const noDialog = () => expect(screen.queryByRole('dialog')).toBeNull()
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp(`^${label}`) }), { target: { value } })
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'save' }))
const sectionTrigger = () => screen.getByRole('button', { name: /^info/ })
const nameField = () => screen.getByRole('textbox', { name: /^name/ })

async function fillAndSubmit() {
  type('name', 'Kim')
  type('email', 'kim@example.com')
  submit()
  const confirm = await screen.findByRole('dialog')
  expect(confirm).toHaveTextContent('저장하시겠습니까?')
  return confirm
}

beforeEach(() => {
  run.mockReset()
  mapError = () => ({ fields: [], root: 'general' })
})

describe('useSaveForm — 실제 Router 위의 저장 흐름', () => {
  it('초기값으로 복원하면 버릴 변경이 없어 바로 이동한다', async () => {
    const router = renderForm()
    await screen.findByRole('button', { name: 'save' })
    type('name', 'Kim')
    type('name', '')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/done'))
    noDialog()
  })

  it('저장 → 확인 → 완료 확인으로 이동할 때 이탈 다이얼로그가 뜨지 않고, 저장값이 유지된다', async () => {
    run.mockResolvedValue(undefined)
    const router = renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(run).toHaveBeenCalledWith({ name: 'Kim', email: 'kim@example.com' }))

    const saved = await screen.findByRole('dialog')
    expect(saved).toHaveTextContent('저장되었습니다.')
    // The submitted snapshot becomes the current value and dirty baseline before acknowledgement.
    // Role queries cannot see behind the modal, so read the value directly.
    expect(screen.getByDisplayValue('Kim')).toBeInTheDocument()

    fireEvent.click(within(saved).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/done'))
    expect(await screen.findByRole('heading', { name: 'done' })).toBeInTheDocument()
    noDialog()
  })

  it('저장 응답의 기준값이 있으면 그 값으로 재설정한다', async () => {
    run.mockResolvedValue({ canonical: { name: 'KIM', email: 'kim@example.com' } })
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))

    await screen.findByText('저장되었습니다.')
    expect(screen.getByDisplayValue('KIM')).toBeInTheDocument()
  })

  it('저장 중 값이 달라져도 요청에 제출한 snapshot만 새 기준으로 만든다', async () => {
    let resolveRun: (() => void) | undefined
    run.mockImplementation(() => new Promise<void>((resolve) => { resolveRun = resolve }))
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(run).toHaveBeenCalledOnce())
    type('name', 'Later edit')
    resolveRun?.()

    await screen.findByText('저장되었습니다.')
    expect(screen.getByDisplayValue('Kim')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Later edit')).toBeNull()
  })

  it('입력 후 취소 버튼은 취소 문구로, LNB 이동은 화면 이동 문구로 막고, 입력이 없으면 바로 나간다', async () => {
    const router = renderForm()
    await screen.findByRole('button', { name: 'save' })

    type('name', 'Kim')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    const cancelDialog = await screen.findByRole('dialog')
    expect(cancelDialog).toHaveTextContent('입력을 취소하시겠습니까?')
    fireEvent.click(within(cancelDialog).getByRole('button', { name: '취소' }))
    await waitFor(noDialog)
    expect(router.state.location.pathname).toBe('/form')
    expect(screen.getByRole('textbox', { name: /^name/ })).toHaveValue('Kim')

    fireEvent.click(screen.getByRole('button', { name: 'lnb' }))
    const leaveDialog = await screen.findByRole('dialog')
    expect(leaveDialog).toHaveTextContent('화면으로 이동하시겠습니까?')
    fireEvent.click(within(leaveDialog).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/done'))
  })

  it('깨끗한 폼의 취소는 확인 없이 이동한다', async () => {
    const router = renderForm()
    await screen.findByRole('button', { name: 'save' })
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/done'))
    noDialog()
  })

  it('저장 중(pending) 이탈은 묻지 않고 거부하고, 저장이 끝나면 완료 알림만 뜬다', async () => {
    let resolveRun: (() => void) | undefined
    run.mockImplementation(() => new Promise<void>((resolve) => (resolveRun = resolve)))
    const router = renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(run).toHaveBeenCalledOnce())

    fireEvent.click(screen.getByRole('button', { name: 'lnb' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/form'))
    noDialog()
    resolveRun?.()
    const saved = await screen.findByRole('dialog')
    expect(saved).toHaveTextContent('저장되었습니다.')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('서버 필드 거부는 해당 필드에 남고, 다시 저장하면 지운 뒤 서버가 다시 판단한다', async () => {
    mapError = () => ({ fields: ['email'] })
    run.mockRejectedValueOnce(new Error('rejected'))
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    expect(await screen.findByText('서버에서 사용할 수 없는 값입니다.')).toBeInTheDocument()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /^email/ })))

    // Nothing changed, but the server decides again: the stale rejection must not block submit.
    run.mockResolvedValueOnce(undefined)
    submit()
    expect(await screen.findByRole('dialog')).toHaveTextContent('저장하시겠습니까?')
    expect(screen.queryByText('서버에서 사용할 수 없는 값입니다.')).toBeNull()
  })

  it('필드에 붙일 수 없는 실패는 루트 문구로 보이고, 다음 유효 제출이 대체한다', async () => {
    mapError = () => ({ fields: [], root: 'connection' })
    run.mockRejectedValueOnce(new Error('offline'))
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 연결을 확인해 주세요.')

    submit()
    expect(await screen.findByRole('dialog')).toHaveTextContent('저장하시겠습니까?')
    expect(screen.queryByText('네트워크 연결을 확인해 주세요.')).toBeNull()
  })

  it('mapError가 undefined면 폼은 아무것도 표시하지 않는다(incident boundary가 소유)', async () => {
    mapError = () => undefined
    run.mockRejectedValueOnce(new Error('forbidden'))
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    const confirm = await fillAndSubmit()
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))
    await waitFor(() => expect(run).toHaveBeenCalledOnce())
    await waitFor(noDialog)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('useSaveForm — 닫힌 섹션과 오류 노출', () => {
  it('닫힌 섹션으로 저장하면 조용히 실패하지 않고 섹션을 열어 오류를 보여주고 첫 오류로 포커스한다', async () => {
    renderForm()
    await screen.findByRole('button', { name: 'save' })
    fireEvent.click(sectionTrigger())
    expect(screen.queryByRole('textbox', { name: /^name/ })).toBeNull()

    submit()

    await waitFor(() => expect(nameField()).toBeInTheDocument())
    expect(sectionTrigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(document.activeElement).toBe(nameField())
    expect(run).not.toHaveBeenCalled()
    noDialog()
  })

  it('다시 접어도 헤더가 남은 오류 수를 알리고, 필드를 고치면 줄어든다', async () => {
    renderForm()
    await screen.findByRole('button', { name: 'save' })
    submit()
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'info 오류 2개' }))
    expect(screen.getByRole('button', { name: 'info 오류 2개' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('alert')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'info 오류 2개' }))
    type('name', 'Kim')
    await waitFor(() => expect(screen.getByRole('button', { name: 'info 오류 1개' })).toBeInTheDocument())
    expect(run).not.toHaveBeenCalled()
  })

  it('저장 실패 뒤 필드를 벗어나기만 해도 오류가 사라지지 않고, 고쳐야 사라진다', async () => {
    renderForm()
    await screen.findByRole('button', { name: 'save' })
    submit()
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))

    fireEvent.blur(nameField())
    fireEvent.blur(screen.getByRole('textbox', { name: /^email/ }))
    expect(screen.getAllByRole('alert')).toHaveLength(2)

    type('name', 'Kim')
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
  })

  it('닫힌 섹션의 서버 필드 오류를 보존해 열고 알리고 첫 rejected field로 포커스한다', async () => {
    mapError = () => ({ fields: ['email'] })
    run.mockRejectedValueOnce(new Error('rejected'))
    renderForm()
    await screen.findByRole('button', { name: 'save' })

    type('name', 'Kim')
    type('email', 'kim@example.com')
    fireEvent.click(sectionTrigger())
    expect(screen.queryByRole('textbox', { name: /^email/ })).toBeNull()
    submit()
    const confirm = await screen.findByRole('dialog')
    fireEvent.click(within(confirm).getByRole('button', { name: '확인' }))

    await waitFor(() => expect(sectionTrigger()).toHaveAttribute('aria-expanded', 'true'))
    expect(await screen.findByText('서버에서 사용할 수 없는 값입니다.')).toBeInTheDocument()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /^email/ })))
  })
})
