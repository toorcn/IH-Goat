import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, IconPill, PageIntro, Panel, PrimaryButton } from "@/components/ui";
import { VoiceBriefing } from "@/components/voice-briefing";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export default async function BriefingPage({
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
  const meeting = context.upcomingMeeting.id === meetingId ? context.upcomingMeeting : context.lastMeeting;

  return (
    <AppShell>
      <PageIntro
        eyebrow={<Badge tone="signal">pre-meeting</Badge>}
        title={<>Brief Sarah before she meets {context.client.name}.</>}
        description="Voice runs through OpenAI Realtime over WebRTC with a server-minted ephemeral token. The session is grounded in the Neo4j-backed client context shown below."
        action={<PrimaryButton href={`/meeting/${meeting.id}`}>Start live companion</PrimaryButton>}
      />

      <VoiceBriefing context={context} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />

      <Panel title="Realtime Integration Readiness" eyebrow="OpenAI">
        <div className="grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
          <IconPill icon={<span className="font-mono text-xs">POST</span>} label="Token route" value="/api/realtime/token" />
          <IconPill icon={<span className="font-mono text-xs">RTC</span>} label="Transport" value="Browser WebRTC plus oai-events data channel" tone="signal" />
          <div className="md:col-span-2">
            <IconPill icon={<span className="font-mono text-xs">KG</span>} label="Grounding" value="Neo4j memory is embedded before response generation" tone="amber" />
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
