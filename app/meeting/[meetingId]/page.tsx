import { notFound } from "next/navigation";
import { CheckCircle2, Network, Radio, User } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import { InfoTabs } from "@/components/info-tabs";
import { MeetingCompanion } from "@/components/meeting-companion";
import { RelationshipGraph } from "@/components/relationship-graph";
import { AppShell, Badge, SecondaryButton } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function MeetingPage({
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
      <section className="surface-enter flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rose/30 bg-rose/10 text-rose">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <Badge tone="rose">With {context.client.name} now</Badge>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
              Keep the conversation human — quiet prompts appear here, only you can see them.
            </p>
          </div>
        </div>
        <SecondaryButton href={`/post-meeting/${meeting.id}`} icon={<CheckCircle2 className="h-4 w-4" />}>
          End and review
        </SecondaryButton>
      </section>

      <MeetingCompanion context={context} />

      <InfoTabs
        tabs={[
          {
            id: "context",
            label: "Client",
            icon: <User className="h-4 w-4" />,
            content: <ClientContextPanel context={context} />
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
