import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, Panel, PrimaryButton } from "@/components/ui";
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="cobalt">client profile</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            {context.client.name}
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Structured memory, timeline, actions, and relationship graph for advisor recall.
          </p>
        </div>
        <PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`}>Brief this client</PrimaryButton>
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
