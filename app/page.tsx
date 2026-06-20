import { CalendarDays, CheckCircle2, MessageSquareText, Mic, Network, Radio } from "lucide-react";
import type { CSSProperties } from "react";
import {
  AppShell,
  Badge,
  FeatureCard,
  IconPill,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatusIcon
} from "@/components/ui";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { getCalendar, getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const calendar = await getCalendar();
  const nextMeeting = calendar.meetings[0];
  if (!nextMeeting) {
    throw new Error("No upcoming meetings found.");
  }
  const context = await getClientContextWithMemoryLayer(nextMeeting.clientId);
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.22fr)_minmax(21rem,0.78fr)]">
        <Panel
          title="Today"
          eyebrow="Advisor workflow"
          action={
            <div className="flex flex-wrap gap-2">
              <Badge tone="signal">demo ready</Badge>
              <Badge tone={context.memorySource === "neo4j" ? "signal" : "amber"}>
                {context.memorySource === "neo4j" ? "Neo4j memory" : "Demo memory"}
              </Badge>
            </div>
          }
          className="min-h-[420px] overflow-hidden"
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem] md:items-stretch">
            <div className="flex flex-col justify-between">
              <p className="max-w-2xl text-4xl font-semibold leading-[0.98] tracking-tight text-ink md:text-6xl">
                Sarah&apos;s next meeting is ready.
              </p>
              <p className="mt-5 max-w-[62ch] text-base leading-7 text-muted">
                One seeded journey proves the full loop: recall client context, support the
                live meeting silently, capture memory, and prepare follow-through for approval.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>
                  Start briefing
                </PrimaryButton>
                <SecondaryButton
                  href={`/qna/${context.upcomingMeeting.id}`}
                  icon={<MessageSquareText className="h-4 w-4" />}
                >
                  Open L1.5 Q&A
                </SecondaryButton>
                <SecondaryButton
                  href={`/meeting/${context.upcomingMeeting.id}`}
                  icon={<Radio className="h-4 w-4" />}
                >
                  Open companion
                </SecondaryButton>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[1.35rem] border border-line bg-paper p-4 shadow-soft">
              <div className="shimmer pointer-events-none absolute inset-x-0 top-0 h-20 opacity-70" />
              <div className="flex items-center justify-between gap-3">
                <Badge tone="amber">10:30 AM</Badge>
                <StatusIcon status="ready" />
              </div>
              <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink">
                {context.client.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{context.upcomingMeeting.objective}</p>
              <dl className="mt-6 space-y-3 text-sm">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: <CalendarDays className="h-4 w-4" />, label: "Step 1", value: "Dashboard" },
              {
                icon: <Mic className="h-4 w-4" />,
                label: "Step 2",
                value: "Voice briefing",
                tone: "signal" as const
              },
              {
                icon: <Radio className="h-4 w-4" />,
                label: "Step 3",
                value: "Live companion",
                tone: "amber" as const
              },
              { icon: <CheckCircle2 className="h-4 w-4" />, label: "Step 4", value: "Approve follow-ups" }
            ].map((item, index) => (
              <div
                key={item.label}
                className="stagger-item"
                style={{ "--index": index } as CSSProperties & Record<"--index", number>}
              >
                <IconPill icon={item.icon} label={item.label} value={item.value} tone={item.tone} />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[1.15rem] border border-line bg-paper p-3">
            <p className="text-sm font-semibold text-ink">Grounding rule</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Assistant responses use the Neo4j-backed client memory context. Unsupported
              questions return an explicit missing-memory response.
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <SectionHeader
          eyebrow="Feature lanes"
          title="Run the advisory loop from one place."
          description="Each capability has a dedicated surface, so judges can jump directly to the part of the workflow they want to inspect."
          className="mb-4"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            eyebrow="Before the call"
            title="Voice Briefing"
            description="Hear the meeting prep and ask grounded follow-up questions before joining the client."
            href={`/briefing/${context.upcomingMeeting.id}`}
            cta="Brief Sarah"
            icon={<Mic className="h-5 w-5" />}
            tone="signal"
          >
            <Badge tone="signal">OpenAI Realtime</Badge>
          </FeatureCard>
          <FeatureCard
            eyebrow="During the call"
            title="Live Companion"
            description="Capture transcript signals and show silent prompts without interrupting the conversation."
            href={`/meeting/${context.upcomingMeeting.id}`}
            cta="Start companion"
            icon={<Radio className="h-5 w-5" />}
            tone="rose"
          >
            <Badge tone="rose">Advisor-only prompts</Badge>
          </FeatureCard>
          <FeatureCard
            eyebrow="Client memory"
            title="Relationship Graph"
            description="Inspect structured facts, timeline evidence, open concerns, and known relationships."
            href={`/client/${context.client.id}`}
            cta="View memory"
            icon={<Network className="h-5 w-5" />}
            tone="cobalt"
          >
            <Badge tone="cobalt">{context.graph.nodes.length} graph nodes</Badge>
          </FeatureCard>
          <FeatureCard
            eyebrow="After the call"
            title="Review Board"
            description="Approve suggested follow-ups and memory mutations before they become advisor records."
            href={`/post-meeting/${context.upcomingMeeting.id}`}
            cta="Review outputs"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="amber"
          >
            <Badge tone="amber">Human approval</Badge>
          </FeatureCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
