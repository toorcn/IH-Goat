"use client";

import { BarChart3, GitBranch, ListChecks, Table2 } from "lucide-react";
import type { ClientContext } from "@/lib/types";
import { Badge, EmptyState } from "./ui";

export function BriefingVisualOutput({
  context,
  query
}: {
  context: ClientContext;
  query: string;
}) {
  const mode = chooseMode(query);
  const openItems = context.memories.filter((memory) => memory.status === "open");
  const referralNodes = context.graph.nodes.filter((node) => node.type === "ReferralOpportunity" || node.type === "Specialist");
  const categoryCounts = context.memories.reduce<Record<string, number>>((counts, memory) => {
    counts[memory.category] = (counts[memory.category] ?? 0) + 1;
    return counts;
  }, {});
  const maxCount = Math.max(1, ...Object.values(categoryCounts));

  return (
    <section className="border-t border-line/80 pt-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Visual Output</p>
          <h3 className="text-base font-semibold text-ink">{mode.label}</h3>
        </div>
        {mode.icon}
      </div>
      {mode.kind === "referral" ? (
        <div className="space-y-3">
          {referralNodes.length === 0 ? (
            <EmptyState>No referral nodes in the current memory graph.</EmptyState>
          ) : (
            referralNodes.map((node) => (
              <article key={node.id} className="rounded-lg border border-line bg-paper p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={node.type === "ReferralOpportunity" ? "amber" : "signal"}>
                    {node.type === "ReferralOpportunity" ? "Opportunity" : "Specialist"}
                  </Badge>
                  <span className="text-xs font-medium text-muted">Graph recommendation</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{node.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{node.note}</p>
              </article>
            ))
          )}
        </div>
      ) : null}

      {mode.kind === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] border-collapse bg-panel text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="border-b border-line px-3 py-3">Category</th>
                <th className="border-b border-line px-3 py-3">Open Item</th>
                <th className="border-b border-line px-3 py-3">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {openItems.map((memory) => (
                <tr key={memory.id}>
                  <td className="border-b border-line px-3 py-3">
                    <Badge tone="amber">{memory.category}</Badge>
                  </td>
                  <td className="border-b border-line px-3 py-3 font-semibold text-ink">{memory.title}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{memory.sourceSnippet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {mode.kind === "chart" ? (
        <div className="space-y-3">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div key={category} className="rounded-lg border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{category}</span>
                <Badge tone="cobalt">{count}</Badge>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-cobalt transition-[width]"
                  style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {mode.kind === "bullets" ? (
        <ul className="space-y-2 text-sm leading-6 text-muted">
          <li>
            <span className="font-semibold text-ink">Opening:</span> Congratulate Mr. Tan on Jia En&apos;s NUS milestone.
          </li>
          <li>
            <span className="font-semibold text-ink">Open loop:</span> Will planning remains unresolved.
          </li>
          <li>
            <span className="font-semibold text-ink">Referral path:</span> Evelyn Ng for estate planning, Marcus Lee for legal support.
          </li>
          <li>
            <span className="font-semibold text-ink">Follow-through:</span> Send the estate planning guide and schedule a will-planning check-in.
          </li>
        </ul>
      ) : null}
    </section>
  );
}

function chooseMode(query: string) {
  const normalized = query.toLowerCase();
  if (
    normalized.includes("introduce") ||
    normalized.includes("intro") ||
    normalized.includes("referral") ||
    normalized.includes("specialist") ||
    normalized.includes("evelyn") ||
    normalized.includes("marcus") ||
    normalized.includes("who")
  ) {
    return {
      kind: "referral" as const,
      label: "Referral Graph",
      icon: <GitBranch className="h-4 w-4 text-cobalt" />
    };
  }
  if (
    normalized.includes("concern") ||
    normalized.includes("promise") ||
    normalized.includes("open") ||
    normalized.includes("will") ||
    normalized.includes("estate") ||
    normalized.includes("renewal")
  ) {
    return {
      kind: "table" as const,
      label: "Open Loop Table",
      icon: <Table2 className="h-4 w-4 text-amber" />
    };
  }
  if (normalized.includes("trend") || normalized.includes("chart") || normalized.includes("memory")) {
    return {
      kind: "chart" as const,
      label: "Memory Category Chart",
      icon: <BarChart3 className="h-4 w-4 text-cobalt" />
    };
  }
  return {
    kind: "bullets" as const,
    label: "Briefing Bullets",
    icon: <ListChecks className="h-4 w-4 text-signal" />
  };
}
