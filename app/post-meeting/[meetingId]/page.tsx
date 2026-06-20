import { notFound } from "next/navigation";
import { RelationshipGraph } from "@/components/relationship-graph";
import { ReviewBoard } from "@/components/review-board";
import { AppShell, MetricCard, PrimaryButton, SectionHeader } from "@/components/ui";
import { getMeeting } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function PostMeetingPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const meeting = getMeeting(meetingId);
  if (!meeting) notFound();

  const context = await getClientContextWithMemoryLayer(meeting.clientId);

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Post-meeting review"
        title="Convert the conversation into follow-through Sarah controls."
        description="This page proves the human-in-the-loop checkpoint: proposed actions and graph updates stay pending until the advisor approves or ignores them."
        action={<PrimaryButton href={`/client/${context.client.id}`}>View client graph</PrimaryButton>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Follow-ups" value="Drafted" detail="Advisor can approve, edit, or ignore next actions." tone="signal" />
        <MetricCard label="Memory updates" value="Pending" detail="Graph mutations require explicit approval." tone="orange" />
        <MetricCard label="Evidence" value="Linked" detail="Review stays connected to the client graph." tone="cobalt" />
      </div>

      <ReviewBoard context={context} />

      <SectionHeader
        eyebrow="Updated memory view"
        title="See how approved facts fit the relationship graph."
        description="The graph remains the durable client memory surface after review."
      />
      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
