import {
  managerAgencyOptionsQuery,
  managerTypeOptionsQuery,
} from '@/features/managers/api/queries';
import { ManagerCreateScreen } from '@/features/managers/form/ManagerCreateScreen';
import { noop } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { env } from '@/env';
import { ManagerCreateInputScreen } from '@/features/managers/form/ManagerInputScreens';
import { managerOptionFixtures } from '@/features/managers/fixtures/managers';
import { useState } from 'react';
import { DevelopmentNotice } from '@/app/shell/DevelopmentNotice';

export const Route = createFileRoute('/_app/managers/new')({
  // Option data is warmed on entry (and on preload intent) so the form never opens the blocking
  // overlay for select choices; a failed warm-up is left to the field's own inline state.
  loader: ({ context: { locale, queryClient } }) => {
    if (env.VITE_REFERENCE_SCENARIOS) return;
    void queryClient.query(managerTypeOptionsQuery(locale)).catch(noop);
    void queryClient.query(managerAgencyOptionsQuery(locale)).catch(noop);
  },
  component: ManagerCreateRoute,
});
function ManagerCreateRoute() {
  const [ready, setReady] = useState(false);
  // TRANSPLANT_PENDING_MANAGER_CREATE_INPUT: connect validated input when the product API exists.
  if (env.VITE_REFERENCE_SCENARIOS)
    return (<>
      <DevelopmentNotice ready={ready} />
      <ManagerCreateInputScreen
        optionsForType={managerOptionFixtures}
        onConfirm={() => setReady(true)}
      />
    </>);
  return <ManagerCreateScreen />;
}
