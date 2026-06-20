import { notFound } from "next/navigation";
import { RelationshipGraph } from "@/components/relationship-graph";
import { ReviewBoard } from "@/components/review-board";
import { AppShell, Badge, PrimaryButton } from "@/components/ui";
import { getClientContext, getMeeting } from "@/lib/demo-data";

export default async function PostMeetingPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const meeting = getMeeting(meetingId);
  if (!meeting) notFound();

  const context = getClientContext(meeting.clientId);

  return (
    <AppShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="signal">post-meeting review</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            Convert the conversation into follow-through Sarah controls.
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Proposed actions and graph updates stay pending until the advisor approves or
            ignores them.
          </p>
        </div>
        <PrimaryButton href={`/client/${context.client.id}`}>View client graph</PrimaryButton>
      </div>

      <ReviewBoard context={context} />
      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
