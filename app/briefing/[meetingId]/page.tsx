import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, Panel, PrimaryButton } from "@/components/ui";
import { VoiceBriefing } from "@/components/voice-briefing";
import { getClientContext, getMeeting } from "@/lib/demo-data";

export default async function BriefingPage({
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
          <Badge tone="signal">pre-meeting</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            Brief Sarah before she meets {context.client.name}.
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Voice uses browser speech synthesis and dictation for a reliable local demo, while
            the API route is ready to mint OpenAI Realtime sessions when an API key is present.
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
            <p className="text-sm font-semibold text-ink">Session route</p>
            <p className="mt-1 text-sm leading-6 text-muted">POST /api/realtime/session</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Fallback</p>
            <p className="mt-1 text-sm leading-6 text-muted">Typed Q&amp;A and scripted voice briefing</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Grounding</p>
            <p className="mt-1 text-sm leading-6 text-muted">Client context is fetched before response generation</p>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
