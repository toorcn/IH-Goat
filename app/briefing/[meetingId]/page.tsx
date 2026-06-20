import { notFound } from "next/navigation";
import { CalendarClock, Network, ScrollText, User } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import { InfoTabs } from "@/components/info-tabs";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge } from "@/components/ui";
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
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell>
      {/* Slim, plain-language header: who, when, why. */}
      <section className="surface-enter flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="signal">Before you meet {context.client.name}</Badge>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {meetingTime} · {context.upcomingMeeting.objective}
            </p>
          </div>
        </div>
      </section>

      <VoiceBriefing context={context} />

      {/* Everything else is one tap away — the advisor pulls up only what they want. */}
      <InfoTabs
        tabs={[
          {
            id: "context",
            label: "Client",
            icon: <User className="h-4 w-4" />,
            content: <ClientContextPanel context={context} />
          },
          {
            id: "timeline",
            label: "Timeline",
            icon: <ScrollText className="h-4 w-4" />,
            content: <Timeline context={context} />
          },
          {
            id: "network",
            label: "Network",
            icon: <Network className="h-4 w-4" />,
            content: <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
          }
        ]}
      />
    </AppShell>
  );
}
