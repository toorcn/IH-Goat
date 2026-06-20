import { notFound } from "next/navigation";
import { BrainCircuit, Radio } from "lucide-react";
import { MemoryQnaWorkspace } from "@/components/memory-qna-workspace";
import { AppShell, Badge, SecondaryButton } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function QnaPage({
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
      <section className="surface-enter rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 shadow-diffusion backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="signal">L1.5 Q&A</Badge>
              <Badge tone={context.memorySource === "neo4j" ? "signal" : "amber"}>
                {context.memorySource === "neo4j" ? "Neo4j memory" : "Demo memory"}
              </Badge>
              <Badge tone="cobalt">answer-first</Badge>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-tight text-ink md:text-6xl">
              Ask memory. Show the visual immediately.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              A briefing-free L1.5 surface for judges: ask about {context.client.name}, then show
              the best digestible view at the top — graph, table, recommendation, timeline, cards,
              or missing-info next step.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <SecondaryButton
              href={`/briefing/${meetingId}`}
              icon={<BrainCircuit className="h-4 w-4" />}
            >
              Open full briefing
            </SecondaryButton>
            <SecondaryButton href={`/meeting/${meetingId}`} icon={<Radio className="h-4 w-4" />}>
              Open companion
            </SecondaryButton>
          </div>
        </div>
      </section>

      <MemoryQnaWorkspace context={context} />
    </AppShell>
  );
}
