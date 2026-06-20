import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, MetricCard, Panel, PrimaryButton, SectionHeader } from "@/components/ui";
import { VoiceBriefing } from "@/components/voice-briefing";
import { getMeeting } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export default async function BriefingPage({
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
        eyebrow="Pre-meeting voice briefing"
        title={`Brief Sarah before she meets ${context.client.name}.`}
        description="This page proves the advisor can get a spoken, memory-grounded briefing and ask follow-up questions before entering the client conversation."
        action={<PrimaryButton href={`/meeting/${meeting.id}`}>Start live companion</PrimaryButton>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Voice transport" value="WebRTC" detail="Realtime session with an ephemeral server token." tone="signal" />
        <MetricCard label="Grounding" value={context.memorySource === "neo4j" ? "Neo4j" : "Demo"} detail="Briefing uses the same client context shown below." tone="cobalt" />
        <MetricCard label="Next step" value="Companion" detail="Move directly into silent meeting support." tone="amber" />
      </div>

      <VoiceBriefing context={context} />

      <SectionHeader
        eyebrow="Grounding context"
        title="What the assistant is allowed to use."
        description="The briefing is intentionally bounded by known memories, timeline evidence, and relationship graph facts."
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />

      <Panel title="Realtime Integration Readiness" eyebrow="OpenAI">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Token route</p>
            <p className="mt-1 text-sm leading-6 text-muted">POST /api/realtime/token</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Transport</p>
            <p className="mt-1 text-sm leading-6 text-muted">Browser WebRTC plus oai-events data channel</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Grounding</p>
            <p className="mt-1 text-sm leading-6 text-muted">Neo4j memory is embedded before response generation</p>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
