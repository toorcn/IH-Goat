import { notFound } from "next/navigation";
import { RelationshipGraph } from "@/components/relationship-graph";
import { ReviewBoard } from "@/components/review-board";
import { AppShell, Badge, PageIntro, PrimaryButton, SectionHeader } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function PostMeetingPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  let context;
  try {
    context = await getClientContextForMeeting(meetingId);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <PageIntro
        eyebrow={<Badge tone="signal">post-meeting review</Badge>}
        title="Convert the conversation into follow-through Sarah controls."
        description="Proposed actions and graph updates stay pending until the advisor approves or ignores them."
        action={<PrimaryButton href={`/client/${context.client.id}`}>View client graph</PrimaryButton>}
      />

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
