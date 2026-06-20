import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, MetricCard, Panel, PrimaryButton, SectionHeader } from "@/components/ui";
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

  return (
    <AppShell>
      <SectionHeader
        eyebrow="Client memory"
        title={context.client.name}
        description="Structured memories, timeline evidence, open concerns, and relationship graph context for advisor recall."
        action={<PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>Brief this client</PrimaryButton>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Relationship" value={`Since ${context.client.relationshipSince}`} detail={context.client.riskProfile} tone="cobalt" />
        <MetricCard label="Graph" value={`${context.graph.nodes.length} nodes`} detail={`${context.graph.edges.length} known relationships`} tone="signal" />
        <MetricCard label="Open concerns" value={`${context.memories.filter((memory) => memory.status === "open").length}`} detail="Ready for the next briefing." tone="amber" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientContextPanel context={context} />
        <Timeline context={context} />
      </section>

      <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />

      <Panel title="Open Concerns And Promises" eyebrow="Review list">
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full min-w-[720px] border-collapse bg-panel text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="border-b border-line px-3 py-3">Category</th>
                <th className="border-b border-line px-3 py-3">Item</th>
                <th className="border-b border-line px-3 py-3">Evidence</th>
                <th className="border-b border-line px-3 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {context.memories
                .filter((memory) => memory.status === "open")
                .map((memory) => (
                  <tr key={memory.id}>
                    <td className="border-b border-line px-3 py-3">
                      <Badge tone="amber">{memory.category}</Badge>
                    </td>
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                      {memory.title}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-muted">
                      {memory.sourceSnippet}
                    </td>
                    <td className="border-b border-line px-3 py-3 text-muted">
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
