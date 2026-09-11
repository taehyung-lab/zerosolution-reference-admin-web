import { createFileRoute, Outlet, redirect, type ErrorComponentProps, type NotFoundRouteProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RootErrorComponent, RootNotFoundComponent } from "./__root";
import { readAccessToken } from "@/api/http/credential";
import { AppShell } from "@/app/shell/AppShell";
import { UnsavedChangesProvider } from '@/shared/ui/form/UnsavedChangesGuard';

export const Route = createFileRoute("/_app")({
  /**
   * 저장된 access token 이 없으면 화면을 열지 않는다. 토큰 없이 들어오면 화면이 뜬 뒤
   * 401 로 되돌아 나가고, 사용자는 자기가 무엇을 잘못했는지 알 수 없다.
   * 토큰의 유효성은 서버만 판정하므로 여기서는 자격증명의 존재만 본다.
   */
  beforeLoad: ({ location }) => {
    if (readAccessToken() === null) {
      redirect({ to: "/login", search: { redirect: location.href }, throw: true });
    }
  },
  component: AppLayout,
  // A record 404 or a failed loader inside the app keeps the shell (LNB, header); root stays shell-less.
  notFoundComponent: AppNotFound,
  errorComponent: AppError,
});

function AppFrame({ children }: { readonly children: ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <AppShell>{children}</AppShell>
    </UnsavedChangesProvider>
  );
}

function AppLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  );
}

function AppNotFound(props: NotFoundRouteProps) {
  return (
    <AppFrame>
      <RootNotFoundComponent {...props} />
    </AppFrame>
  );
}

function AppError(props: ErrorComponentProps) {
  return (
    <AppFrame>
      <RootErrorComponent {...props} />
    </AppFrame>
  );
}
