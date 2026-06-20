import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, Panel, PrimaryButton } from "@/components/ui";
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="signal">pre-meeting</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            Brief Sarah before she meets {context.client.name}.
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Voice runs through OpenAI Realtime over WebRTC with a server-minted ephemeral
            token. The session is grounded in the Neo4j-backed client context shown below.
          </p>
        </div>
        <PrimaryButton href={`/meeting/${meeting.id}`}>Start live companion</PrimaryButton>
      </div>

      <VoiceBriefing context={context} />

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
