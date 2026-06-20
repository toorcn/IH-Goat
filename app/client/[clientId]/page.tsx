import { notFound } from "next/navigation";
import { CircleAlert, Mic, Network, ScrollText, Sparkles } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import { InfoTabs } from "@/components/info-tabs";
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

  const approvedOrRecentMemories = context.memories
    .filter((memory) => memory.status === "approved" || memory.source === "live meeting companion")
    .sort((a, b) => memoryTimestamp(b) - memoryTimestamp(a));
  const openMemories = context.memories.filter((memory) => memory.status === "open");

  return (
    <AppShell>
      <section className="surface-enter flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <Badge tone="cobalt">Client</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {context.client.name}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            What you know, the people around them, and what&apos;s still open.
          </p>
        </div>
        <PrimaryButton href={`/briefing/${context.upcomingMeeting.id}`} icon={<Mic className="h-4 w-4" />}>
          Brief me on this client
        </PrimaryButton>
      </section>

      <ClientContextPanel context={context} />

      <InfoTabs
        tabs={[
          {
            id: "timeline",
            label: "Timeline",
            icon: <ScrollText className="h-4 w-4" />,
            content: <Timeline context={context} />
          },
          {
            id: "network",
            label: "Network",
            icon: <Network className="h-4 w-4" />,
            content: <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
          },
          {
            id: "memory",
            label: "Memory",
            icon: <Sparkles className="h-4 w-4" />,
            content: (
              <Panel title="Approved and recent memory" eyebrow="What I've saved">
                {approvedOrRecentMemories.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-line bg-paper p-5 text-sm leading-6 text-muted">
                    Memories you approve after a meeting show up here.
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
            )
          },
          {
            id: "concerns",
            label: "Open items",
            icon: <CircleAlert className="h-4 w-4" />,
            content: (
              <Panel title="Open concerns and promises" eyebrow="Still to resolve">
                {openMemories.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-line bg-paper p-5 text-sm leading-6 text-muted">
                    Nothing is open for {context.client.name} right now.
                  </div>
                ) : (
                  <div className="divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line bg-paper">
                    {openMemories.map((memory) => (
                      <article key={memory.id} className="p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="amber">{memory.category}</Badge>
                          <span className="text-xs font-medium text-muted">
                            {Math.round(memory.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-ink">{memory.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{memory.sourceSnippet}</p>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            )
          }
        ]}
      />
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
