import { IncidentBoundary } from "@/app/error-boundary/IncidentBoundary";
import { AppProviders, createQueryClient } from "@/app/providers/AppProviders";
import { AppRouterProvider, createAppRouter } from "@/app/router/router";
import "@/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element를 찾을 수 없습니다.");

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      {/* TODO(auth-contract): 신규 session lifecycle과 401/403 목적지가 확정되면
        IncidentBoundary의 만료·권한 handler를 AuthProvider/route guard와 함께 연결한다. */}
      <IncidentBoundary
        onLoginRequired={() => { void router.navigate({ to: '/login' }) }}
        onGoBack={() => { window.history.back() }}
      >
        <AppRouterProvider router={router} />
      </IncidentBoundary>
    </AppProviders>
  </StrictMode>,
);
