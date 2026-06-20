import { notFound } from "next/navigation";
import { CheckCircle2, Radio, User } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import type { InfoTab } from "@/components/info-tabs";
import { LiveCompanion } from "@/components/live-companion";
import { RelationshipGraph } from "@/components/relationship-graph";
import { AppShell, Badge, SecondaryButton } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function LiveMeetingPage({
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

  const referenceTabs: InfoTab[] = [
    {
      id: "context",
      label: "Context",
      icon: <User className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <ClientContextPanel context={context} mode="profile" />
          <RelationshipGraph
            nodes={context.graph.nodes}
            edges={context.graph.edges}
            source={context.memorySource ?? "demo"}
          />
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <section className="surface-enter flex items-center justify-between gap-3 rounded-[1.6rem] border border-line/80 bg-panel/70 p-3 backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose/30 bg-rose/10 text-rose sm:h-11 sm:w-11">
            <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div>
            <Badge tone="rose">Live with {context.client.name}</Badge>
            <p className="mt-1.5 hidden max-w-xl text-sm leading-6 text-muted sm:block">
              I listen silently, tell advisor and client apart, suggest what to ask next, and capture
              useful memory automatically for next time. Nothing is sent to the client.
            </p>
          </div>
        </div>
        <SecondaryButton href={`/post-meeting/${meeting.id}`} icon={<CheckCircle2 className="h-4 w-4" />}>
          <span className="hidden sm:inline">End and review</span>
          <span className="sm:hidden">End</span>
        </SecondaryButton>
      </section>

      <LiveCompanion context={context} extraTabs={referenceTabs} />
    </AppShell>
  );
}
