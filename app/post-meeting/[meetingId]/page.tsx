import { notFound } from "next/navigation";
import { CheckCircle2, Network, User } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import { InfoTabs } from "@/components/info-tabs";
import { RelationshipGraph } from "@/components/relationship-graph";
import { ReviewBoard } from "@/components/review-board";
import { AppShell, Badge, SecondaryButton } from "@/components/ui";
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
      <section className="surface-enter flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <Badge tone="signal">After {context.client.name}&apos;s meeting</Badge>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
              Nothing is saved or sent until you approve it. Review the suggested follow-ups below.
            </p>
          </div>
        </div>
        <SecondaryButton href={`/client/${context.client.id}`} icon={<Network className="h-4 w-4" />}>
          View client
        </SecondaryButton>
      </section>

      <ReviewBoard context={context} />

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
