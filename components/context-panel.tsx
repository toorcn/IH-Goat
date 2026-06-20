import { CalendarDays, MessageSquareText, Network, ShieldCheck } from "lucide-react";
import type { ClientContext } from "@/lib/types";
import { Badge, IconPill, Panel } from "./ui";

export function ClientContextPanel({ context }: { context: ClientContext }) {
  const openItems = context.memories.filter((memory) => memory.status === "open");

  return (
    <Panel title="Client Context" eyebrow={context.client.name}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={context.memorySource === "neo4j" ? "signal" : "amber"}>
          {context.memorySource === "neo4j" ? "Neo4j memory" : "Demo memory"}
        </Badge>
        {context.memoryWarning ? (
          <span className="text-xs font-medium text-muted">{context.memoryWarning}</span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <IconPill
          icon={<CalendarDays className="h-4 w-4" />}
          label="Relationship"
          value={`Since ${context.client.relationshipSince}`}
        />
        <IconPill
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Risk Profile"
          value={context.client.riskProfile}
          tone="signal"
        />
        <IconPill
          icon={<MessageSquareText className="h-4 w-4" />}
          label="Open Items"
          value={`${openItems.length} active`}
          tone="amber"
        />
        <IconPill
          icon={<Network className="h-4 w-4" />}
          label="Known Network"
          value={`${context.graph.nodes.length - 2} people and opportunities`}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ink">High-salience memory</h3>
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line bg-paper/80">
          {context.memories
            .slice()
            .sort((a, b) => b.salience - a.salience)
            .slice(0, 4)
            .map((memory) => (
              <div key={memory.id} className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={memory.status === "open" ? "amber" : "neutral"}>{memory.category}</Badge>
                  <span className="text-xs font-medium text-muted">{memory.source}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{memory.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{memory.summary}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-signal/25 bg-signal/10 p-4">
        <p className="text-sm font-semibold text-ink">Opening cue</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Congratulate Mr. Tan on Jia En&apos;s NUS acceptance before moving into estate
          planning.
        </p>
      </div>
    </Panel>
  );
}
