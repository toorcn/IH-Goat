import { notFound } from "next/navigation";
import { BrainCircuit, CheckCircle2, DatabaseZap, ShieldCheck } from "lucide-react";
import { L2MemoryWriter } from "@/components/l2-memory-writer";
import { AppShell, Badge, Panel, SecondaryButton } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function L2MemoryWriterPage({
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
      <section className="surface-enter grid gap-5 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 shadow-diffusion backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-5">
        <div className="flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="signal">L2 standalone</Badge>
              <Badge tone={context.memorySource === "neo4j" ? "signal" : "amber"}>
                {context.memorySource === "neo4j" ? "Neo4j write-ready" : "Demo fallback"}
              </Badge>
              <Badge tone="cobalt">Human approval gate</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-tight text-ink md:text-6xl">
              Turn this meeting into structured relationship memory.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
              L1 reads memory before the meeting. L2 is the separate writer surface: capture the
              conversation, extract candidate updates, approve what is true, then write the approved
              memory back into Neo4j for every future briefing.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <SecondaryButton
              href={`/briefing/${meetingId}`}
              icon={<BrainCircuit className="h-4 w-4" />}
            >
              Back to L1 briefing
            </SecondaryButton>
            <SecondaryButton
              href={`/post-meeting/${meetingId}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Open review board
            </SecondaryButton>
          </div>
        </div>

        <Panel title="Write contract" eyebrow="Safety model" className="bg-paper/80">
          <div className="space-y-3 text-sm leading-6 text-muted">
            <div className="flex gap-3 rounded-[1rem] border border-line bg-panel p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <p>
                No auto-write from transcript or voice. The advisor approves or rejects every
                candidate card first.
              </p>
            </div>
            <div className="flex gap-3 rounded-[1rem] border border-line bg-panel p-3">
              <DatabaseZap className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <p>
                Approved memories call the existing `/api/memory/approve` route and materialize as
                Neo4j memory nodes when credentials are configured.
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <L2MemoryWriter context={context} meetingId={meetingId} />
    </AppShell>
  );
}
