import { CalendarDays, CheckCircle2, Mic, Radio } from "lucide-react";
import { AppShell, Badge, IconPill, Panel, PrimaryButton, StatusIcon } from "@/components/ui";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { client } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getClientContextWithMemoryLayer(client.id);
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Today"
          eyebrow="Advisor workflow"
          action={<Badge tone="signal">demo ready</Badge>}
          className="min-h-[380px]"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
            <div>
              <p className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-ink md:text-5xl">
                Sarah&apos;s next meeting is ready for briefing.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                One seeded journey proves the full loop: recall client context, support the
                live meeting silently, capture memory, and prepare follow-through for approval.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>
                  Start briefing
                </PrimaryButton>
                <PrimaryButton
                  href={`/meeting/${context.upcomingMeeting.id}`}
                  icon={<Radio className="h-4 w-4" />}
                >
                  Open companion
                </PrimaryButton>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="amber">10:30 AM</Badge>
                <StatusIcon status="ready" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-ink">{context.client.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{context.upcomingMeeting.objective}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">Advisor</dt>
                  <dd className="font-semibold text-ink">{context.advisor.name}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">When</dt>
                  <dd className="text-right font-semibold text-ink">{meetingTime}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-muted">Mode</dt>
                  <dd className="font-semibold text-ink">{context.upcomingMeeting.location}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Panel>

        <Panel title="Demo Completion Map" eyebrow="5-minute pitch path">
          <div className="grid gap-3 sm:grid-cols-2">
            <IconPill icon={<CalendarDays className="h-4 w-4" />} label="Step 1" value="Dashboard" />
            <IconPill icon={<Mic className="h-4 w-4" />} label="Step 2" value="Voice briefing" tone="signal" />
            <IconPill icon={<Radio className="h-4 w-4" />} label="Step 3" value="Live companion" tone="amber" />
            <IconPill icon={<CheckCircle2 className="h-4 w-4" />} label="Step 4" value="Approve follow-ups" />
          </div>
          <div className="mt-4 rounded-lg border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Grounding rule</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Assistant responses use the Neo4j-backed client memory context. Unsupported
              questions return an explicit missing-memory response.
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
