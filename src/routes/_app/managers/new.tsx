import {
  managerAgencyOptionsQuery,
  managerTypeOptionsQuery,
} from '@/features/managers/api/queries';
import { ManagerCreateScreen } from '@/features/managers/form/ManagerCreateScreen';
import { noop } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/managers/new')({
  // Option data is warmed on entry (and on preload intent) so the form never opens the blocking
  // overlay for select choices; a failed warm-up is left to the field's own inline state.
  loader: ({ context: { locale, queryClient } }) => {
    void queryClient.query(managerTypeOptionsQuery(locale)).catch(noop);
    void queryClient.query(managerAgencyOptionsQuery(locale)).catch(noop);
  },
  component: ManagerCreateRoute,
});
function ManagerCreateRoute() {
  return <ManagerCreateScreen />;
}
