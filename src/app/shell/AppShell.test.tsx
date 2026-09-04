import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/shared/i18n/i18n'
import { inlineProgress } from '@/api/query-meta'
import { AppShell } from './AppShell'

vi.mock('@/app/providers/AuthProvider', () => ({ useAuth: () => ({ signOut: vi.fn() }) }))
vi.mock('./AppHeader', () => ({ AppHeader: () => <header>Header</header> }))
vi.mock('./AppSidebar', () => ({ AppSidebar: () => <aside>Sidebar</aside> }))
vi.mock('./AppFooter', () => ({ AppFooter: () => <footer>Footer</footer> }))

const pending: Promise<never> = new Promise(() => undefined)

function renderShell(client: QueryClient) {
  return render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><AppShell><p>Existing content</p></AppShell></I18nextProvider></QueryClientProvider>)
}

function PendingMutationButton() {
  const mutation = useMutation({ mutationFn: () => pending })
  return <button onClick={() => mutation.mutate()}>Start mutation</button>
}

function ObservedPendingQuery() {
  useQuery({
    queryKey: ['observed'],
    queryFn: () => pending,
    meta: { progress: 'blocking' },
  })
  return null
}

function ObservedContentQuery() {
  useQuery({
    queryKey: ['content'],
    queryFn: () => pending,
    meta: { progress: 'content' },
  })
  return null
}

function ObservedInlineOptionQuery() {
  useQuery({ queryKey: ['options'], queryFn: () => pending, ...inlineProgress })
  return null
}

function renderMutationShell(client: QueryClient) {
  return render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><AppShell><PendingMutationButton /></AppShell></I18nextProvider></QueryClientProvider>)
}

afterEach(() => vi.restoreAllMocks())

describe('AppShell progress', () => {
  it('shows loading for a pending first fetch', async () => {
    const client = new QueryClient()
    render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><AppShell><ObservedPendingQuery /></AppShell></I18nextProvider></QueryClientProvider>)
    expect(await screen.findByRole('status')).toHaveTextContent('데이터를 불러오는 중입니다')
  })

  it('leaves option data that declares inline progress to its own field', async () => {
    const client = new QueryClient()
    render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><AppShell><ObservedInlineOptionQuery /><p>Existing content</p></AppShell></I18nextProvider></QueryClientProvider>)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Existing content')).toBeVisible()
  })

  it('keeps an existing content surface uncovered while its query key changes', async () => {
    const client = new QueryClient()
    render(<QueryClientProvider client={client}><I18nextProvider i18n={i18n}><AppShell><ObservedContentQuery /><p>Existing content</p></AppShell></I18nextProvider></QueryClientProvider>)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Existing content')).toBeVisible()
  })

  it('does not cover the current screen for an observerless prefetch', () => {
    const client = new QueryClient()
    void client.query({ queryKey: ['prefetch'], queryFn: () => pending })
    renderShell(client)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps cached content uncovered during a background refetch', () => {
    const client = new QueryClient()
    client.setQueryData(['cached'], { id: 1 })
    void client.query({ queryKey: ['cached'], queryFn: () => pending, staleTime: 0 })
    renderShell(client)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Existing content')).toBeVisible()
  })

  it('announces saving when a mutation and first fetch overlap', async () => {
    const client = new QueryClient()
    renderMutationShell(client)
    fireEvent.click(screen.getByRole('button', { name: 'Start mutation' }))
    void client.query({ queryKey: ['first'], queryFn: () => pending })
    expect(await screen.findByRole('status')).toHaveTextContent('등록 중입니다')
  })
})
