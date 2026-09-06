import { createFileRoute, notFound } from "@tanstack/react-router";
import { env } from "@/env";
import { WithdrawnMemberDetailScreen } from "@/features/members/withdrawn/WithdrawnMemberDetailScreen";
import { memberRecordFixtures } from "@/features/members/fixtures/member-records";
import { selectMemberActivityFixture } from "@/features/members/fixtures/members";
export const Route = createFileRoute("/_app/members/withdrawn/$memberId")({
  component: WithdrawnDetailRoute,
});
function WithdrawnDetailRoute() {
  const { memberId } = Route.useParams();
  const member = env.VITE_REFERENCE_SCENARIOS
    ? memberRecordFixtures().withdrawn.find((row) => row.id === memberId)
    : undefined;
  if (!member) return notFound({ throw: true });
  // TRANSPLANT_PENDING_WITHDRAWN_ACTIVITY_CONTRACT: activity actions stop before the member API.
  return (
    <WithdrawnMemberDetailScreen
      member={member}
      selectActivity={(query) => selectMemberActivityFixture(member.id, query)}
      onDeleteActivity={() => undefined}
    />
  );
}
