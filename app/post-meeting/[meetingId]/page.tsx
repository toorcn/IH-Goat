import { notFound } from "next/navigation";
import { RelationshipGraph } from "@/components/relationship-graph";
import { ReviewBoard } from "@/components/review-board";
import { AppShell, Badge, PageIntro, PrimaryButton } from "@/components/ui";
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
      <PageIntro
        eyebrow={<Badge tone="signal">post-meeting review</Badge>}
        title="Convert the conversation into follow-through Sarah controls."
        description="Proposed actions and graph updates stay pending until the advisor approves or ignores them."
        action={<PrimaryButton href={`/client/${context.client.id}`}>View client graph</PrimaryButton>}
      />

      <ReviewBoard context={context} />
      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
