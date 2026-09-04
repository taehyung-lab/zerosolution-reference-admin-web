import type { ReactNode } from "react";
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BlockingProgress } from '@/shared/ui/primitives/BlockingProgress'
import { useAuth } from "@/app/providers/AuthProvider";
import { appNavigationItems } from "@/app/config/navigation";
import { env } from "@/env";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { signOut } = useAuth();
  const { t } = useTranslation('shared')
  const saving = useIsMutating() > 0
  // Only observed, pending primary data covers the screen. Option/lookup queries declare
  // `meta.progress: 'inline'` and stay with their field; observerless warming never covers.
  const loading = useIsFetching({
    predicate: (query) =>
      query.state.status === 'pending' &&
      query.getObserversCount() > 0 &&
      query.meta?.progress === 'blocking',
  }) > 0
  return (
    <BlockingProgress open={saving || loading} message={saving ? t('progress.saving') : t('progress.loading')}>
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-white text-neutral-900">
      <AppHeader appName={env.VITE_APP_NAME} onSignOut={signOut} />
      <div className="flex min-h-0">
        <AppSidebar appName={env.VITE_APP_NAME} items={appNavigationItems} />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
      <AppFooter />
    </div>
    </BlockingProgress>
  );
}
