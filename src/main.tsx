import { IncidentBoundary } from "@/app/error-boundary/IncidentBoundary";
import { AppProviders, createQueryClient } from "@/app/providers/AppProviders";
import { AppRouterProvider, createAppRouter } from "@/app/router/router";
import "@/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element를 찾을 수 없습니다.");

if (import.meta.env.DEV && import.meta.env.MODE === 'mock') {
  const { startApiMocks } = await import('@/api/mocks/browser');
  await startApiMocks();
}

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      {/* TODO(auth-contract): 신규 session lifecycle과 401/403 목적지가 확정되면
        IncidentBoundary의 만료·권한 handler를 AuthProvider/route guard와 함께 연결한다. */}
      <IncidentBoundary
        onLoginRequired={() => { void router.navigate({ to: '/login' }) }}
        // 직접 진입(히스토리 없음)에서 뒤로가기는 아무 일도 하지 않으므로 홈으로 떨어뜨린다.
        onGoBack={() => { if (router.history.canGoBack()) router.history.back(); else void router.navigate({ to: '/' }) }}
      >
        <AppRouterProvider router={router} />
      </IncidentBoundary>
    </AppProviders>
  </StrictMode>,
);
