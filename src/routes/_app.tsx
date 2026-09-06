import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
});

function AppLayout() {
  return (
    <UnsavedChangesProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </UnsavedChangesProvider>
  );
}
