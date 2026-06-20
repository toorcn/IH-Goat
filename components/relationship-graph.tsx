import type { GraphEdge, GraphNode } from "@/lib/types";
import { Badge, Panel } from "./ui";

const positions: Record<string, { x: number; y: number }> = {
  "adv-sarah": { x: 18, y: 18 },
  "client-tan": { x: 48, y: 38 },
  "person-mdm-lim": { x: 18, y: 68 },
  "person-jia-en": { x: 44, y: 78 },
  "referral-estate": { x: 74, y: 34 },
  "specialist-evelyn": { x: 82, y: 64 },
  "specialist-marcus": { x: 62, y: 14 }
};

export function RelationshipGraph({
  nodes,
  edges
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  return (
    <Panel title="Relationship Graph" eyebrow="Neo4j-shaped memory">
      <div className="md:hidden">
        <div className="divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line bg-paper">
          {nodes.map((node) => (
            <article key={node.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={node.type === "Client" ? "signal" : node.type === "ReferralOpportunity" ? "amber" : "neutral"}>
                  {node.type}
                </Badge>
                <p className="text-sm font-semibold text-ink">{node.label}</p>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{node.note}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="relative hidden min-h-[430px] overflow-hidden rounded-[1.35rem] border border-line bg-paper md:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {edges.map((edge) => {
            const source = positions[edge.source];
            const target = positions[edge.target];
            if (!source || !target) return null;
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="oklch(72% 0.035 230)"
                  strokeWidth="0.35"
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2}
                  fill="oklch(47% 0.03 235)"
                  fontSize="2.5"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>
        {nodes.map((node) => {
          const position = positions[node.id] ?? { x: 50, y: 50 };
          return (
            <div
              key={node.id}
              className="absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-[1.1rem] border border-line bg-panel/95 p-3 shadow-soft backdrop-blur"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <Badge tone={node.type === "Client" ? "signal" : node.type === "ReferralOpportunity" ? "amber" : "neutral"}>
                {formatNodeType(node.type)}
              </Badge>
              <p className="mt-2 text-sm font-semibold text-ink">{node.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{node.note}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function formatNodeType(type: GraphNode["type"]) {
  return type === "ReferralOpportunity" ? "Referral Opportunity" : type;
}
