import { GitBranch, Network, Search, ShieldCheck } from "lucide-react";
import type { ClientContext, GraphNode } from "@/lib/types";
import { Badge, MetricCard, Panel } from "./ui";

export function KnowledgeGraphWorkbench({ context }: { context: ClientContext }) {
  const nodeCounts = context.graph.nodes.reduce<Record<GraphNode["type"], number>>(
    (counts, node) => ({
      ...counts,
      [node.type]: counts[node.type] + 1
    }),
    {
      Advisor: 0,
      Client: 0,
      Person: 0,
      Specialist: 0,
      ReferralOpportunity: 0
    }
  );
  const sourcedMemories = context.memories.filter((memory) => memory.sourceSnippet.trim().length > 0);
  const evidenceCoverage = Math.round((sourcedMemories.length / Math.max(1, context.memories.length)) * 100);
  const openLoops = context.memories.filter((memory) => memory.status === "open");
  const referralNodes = context.graph.nodes.filter((node) => node.type === "ReferralOpportunity");
  const traversals = buildTraversalRows(context);

  return (
    <Panel title="Knowledge Graph Workbench" eyebrow="Memory quality">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Evidence coverage" value={`${evidenceCoverage}%`} detail="Memories with source snippets." tone="signal" />
        <MetricCard label="Graph nodes" value={`${context.graph.nodes.length}`} detail={`${context.graph.edges.length} typed edges`} tone="cobalt" />
        <MetricCard label="Open loops" value={`${openLoops.length}`} detail="Concerns, promises, referrals." tone="amber" />
        <MetricCard label="Referral paths" value={`${referralNodes.length}`} detail="Warm introductions and leads." tone="rose" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cobalt" />
            <p className="text-sm font-semibold text-ink">Node Mix</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(nodeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-3 py-2">
                <span className="text-sm text-muted">{formatNodeType(type as GraphNode["type"])}</span>
                <Badge tone={count > 0 ? "signal" : "neutral"}>{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-signal" />
            <p className="text-sm font-semibold text-ink">High-Value Traversals</p>
          </div>
          <div className="mt-3 space-y-2">
            {traversals.map((row) => (
              <div key={row.id} className="rounded-md border border-line bg-panel p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={row.tone}>{row.label}</Badge>
                  <span className="text-xs font-medium text-muted">{row.path}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink">{row.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        <table className="w-full min-w-[760px] border-collapse bg-panel text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="border-b border-line px-3 py-3">Memory</th>
              <th className="border-b border-line px-3 py-3">Category</th>
              <th className="border-b border-line px-3 py-3">Source</th>
              <th className="border-b border-line px-3 py-3">Status</th>
              <th className="border-b border-line px-3 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {context.memories
              .slice()
              .sort((a, b) => b.salience - a.salience)
              .map((memory) => (
                <tr key={memory.id}>
                  <td className="border-b border-line px-3 py-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                      <div>
                        <p className="font-semibold text-ink">{memory.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{memory.sourceSnippet}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-line px-3 py-3">
                    <Badge tone={memory.category === "Referral Opportunity" ? "amber" : "neutral"}>
                      {memory.category}
                    </Badge>
                  </td>
                  <td className="border-b border-line px-3 py-3 text-muted">{memory.source}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{memory.status}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">
                    {Math.round(memory.confidence * 100)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-signal/25 bg-signal/10 p-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-signal" />
          <p className="text-sm font-semibold text-ink">
            Current decision: use direct Neo4j graph memory now; layer GraphRAG or mem0 later only if it improves extraction or retrieval speed.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function buildTraversalRows(context: ClientContext) {
  const client = context.client.name;

  return [
    {
      id: "estate-specialist",
      label: "Referral",
      tone: "amber" as const,
      path: `${client} -> estate planning intro -> Evelyn Ng / Marcus Lee`,
      reason: "The graph connects an unresolved will concern to two approved specialist paths."
    },
    {
      id: "family-opener",
      label: "Relationship",
      tone: "signal" as const,
      path: `${client} -> Jia En -> NUS milestone`,
      reason: "A personal family event becomes a warm opener before the advisor discusses sensitive planning."
    },
    {
      id: "network-health",
      label: "Network",
      tone: "cobalt" as const,
      path: `${client} -> Mr. Ong -> business succession lead`,
      reason: "Second-degree relationship tracking turns meeting notes into a future referral pipeline."
    }
  ];
}

function formatNodeType(type: GraphNode["type"]) {
  return type === "ReferralOpportunity" ? "Referral Opportunity" : type;
}
