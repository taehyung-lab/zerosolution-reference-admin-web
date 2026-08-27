import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers/AppProviders'
import { IncidentBoundary } from '@/app/error-boundary/IncidentBoundary'
import { queryClient, router } from '@/app/router/router'
import '@/styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root element를 찾을 수 없습니다.')

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <IncidentBoundary>
        <RouterProvider router={router} />
      </IncidentBoundary>
    </AppProviders>
  </StrictMode>,
)
