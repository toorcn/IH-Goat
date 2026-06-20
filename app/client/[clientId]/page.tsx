import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, PageIntro, Panel, PrimaryButton } from "@/components/ui";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export default async function ClientPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  let context;

  try {
    context = await getClientContextWithMemoryLayer(clientId);
  } catch {
    notFound();
  }

  const approvedOrRecentMemories = context.memories
    .filter((memory) => memory.status === "approved" || memory.source === "live meeting companion")
    .sort((a, b) => memoryTimestamp(b) - memoryTimestamp(a));

  return (
    <AppShell>
      <PageIntro
        eyebrow={<Badge tone="cobalt">client profile</Badge>}
        title={context.client.name}
        description="Structured memory, timeline, actions, and relationship graph for advisor recall."
        action={<PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>Brief this client</PrimaryButton>}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />

      <Panel title="Approved And Recent Memory" eyebrow="Neo4j writeback proof">
        {approvedOrRecentMemories.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-line bg-paper p-5 text-sm leading-6 text-muted">
            Approved live-meeting memories appear here after Sarah approves them and Neo4j is configured.
            The relationship graph stays focused on relationships and referrals for the MVP.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {approvedOrRecentMemories.map((memory) => (
              <article key={memory.id} className="rounded-[1.15rem] border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="signal">{memory.status}</Badge>
                  <Badge tone="neutral">{memory.category}</Badge>
                  <span className="text-xs font-medium text-muted">
                    {Math.round(memory.confidence * 100)}% confidence
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{memory.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{memory.summary}</p>
                <p className="mt-3 rounded-[1rem] bg-panel p-3 text-sm leading-6 text-muted">
                  &quot;{memory.sourceSnippet}&quot;
                </p>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Open Concerns And Promises" eyebrow="Review list">
        <div className="overflow-x-auto rounded-[1.2rem] border border-line">
          <table className="w-full min-w-[720px] border-collapse bg-panel text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="border-b border-line px-4 py-3">Category</th>
                <th className="border-b border-line px-4 py-3">Item</th>
                <th className="border-b border-line px-4 py-3">Evidence</th>
                <th className="border-b border-line px-4 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {context.memories
                .filter((memory) => memory.status === "open")
                .map((memory) => (
                  <tr key={memory.id}>
                    <td className="border-b border-line px-4 py-4">
                      <Badge tone="amber">{memory.category}</Badge>
                    </td>
                    <td className="border-b border-line px-4 py-4 font-semibold text-ink">
                      {memory.title}
                    </td>
                    <td className="border-b border-line px-4 py-4 text-muted">
                      {memory.sourceSnippet}
                    </td>
                    <td className="border-b border-line px-4 py-4 font-mono text-muted">
                      {Math.round(memory.confidence * 100)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}

function memoryTimestamp(memory: {
  updatedAt?: string;
  createdAt?: string;
  lastConfirmedAt?: string;
  validFrom?: string;
}) {
  const timestamp = Date.parse(memory.updatedAt ?? memory.createdAt ?? memory.lastConfirmedAt ?? memory.validFrom ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
