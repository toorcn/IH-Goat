import {
  CheckCircle2,
  GitBranch,
  Mic,
  Network,
  Radio,
} from "lucide-react";
import {
  AppShell,
  Badge,
  FeatureCard,
  MetricCard,
  Panel,
  PrimaryButton,
  SectionHeader,
  StatusIcon
} from "@/components/ui";
import { ClientContextPanel } from "@/components/context-panel";
import { DailyBriefPanel } from "@/components/daily-brief";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { client, getDailyBrief } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getClientContextWithMemoryLayer(client.id);
  const dailyBrief = getDailyBrief();
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-lg border border-line bg-panel p-5 shadow-soft md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="signal">demo ready</Badge>
            <Badge tone={context.memorySource === "neo4j" ? "signal" : "amber"}>
              {context.memorySource === "neo4j" ? "Neo4j memory" : "Demo memory"}
            </Badge>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink md:text-5xl">
            Sarah&apos;s next client meeting is ready to run.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            A single control center for the advisor workflow: brief from trusted memory,
            guide the live conversation, capture new facts, and approve follow-through.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>
              Start voice briefing
            </PrimaryButton>
            <PrimaryButton
              href={`/meeting/${context.upcomingMeeting.id}`}
              icon={<Radio className="h-4 w-4" />}
            >
              Open live companion
            </PrimaryButton>
          </div>
        </div>

        <Panel title="Next Meeting" eyebrow="Today" action={<StatusIcon status="ready" />}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">10:30 AM</Badge>
            <span className="text-sm font-medium text-muted">{context.upcomingMeeting.location}</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink">{context.client.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{context.upcomingMeeting.objective}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="text-muted">Advisor</dt>
              <dd className="font-semibold text-ink">{context.advisor.name}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="text-muted">When</dt>
              <dd className="text-right font-semibold text-ink">{meetingTime}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="text-muted">Open memories</dt>
              <dd className="font-semibold text-ink">
                {context.memories.filter((memory) => memory.status === "open").length}
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      <DailyBriefPanel brief={dailyBrief} />

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

      <Panel title="Workflow Status" eyebrow="5-minute pitch path">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Step 1" value="Dashboard" detail="Orient to the client and meeting." tone="cobalt" />
          <MetricCard label="Step 2" value="Briefing" detail="Voice prep from memory." tone="signal" />
          <MetricCard label="Step 3" value="Companion" detail="Live capture and suggestions." tone="rose" />
          <MetricCard label="Step 4" value="Review" detail="Approve actions and graph updates." tone="amber" />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-paper p-3">
          <GitBranch className="mt-0.5 h-4 w-4 text-cobalt" />
          <p className="text-sm leading-6 text-muted">
            Grounding rule: assistant responses use the client memory context. Unsupported
            questions return an explicit missing-memory response instead of inventing facts.
          </p>
        </div>
      </Panel>

      <SectionHeader
        eyebrow="Memory evidence"
        title="The context powering every feature."
        description="The same seeded client state supports briefing, live guidance, review, and the graph view."
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
    </AppShell>
  );
}
