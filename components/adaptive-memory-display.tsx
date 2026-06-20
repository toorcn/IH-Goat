import type { ReactNode } from "react";
import { AlertCircle, CalendarClock, GitFork, ListChecks, Quote, Sparkles } from "lucide-react";
import type { GraphEdge, GraphNode, MemoryQueryVisualResponse } from "@/lib/types";
import { Badge, EmptyState } from "./ui";

type AdaptiveMemoryDisplayProps = {
  response: MemoryQueryVisualResponse | null;
  variant?: "compact" | "hero";
  emptyText?: string;
  title?: string;
};

const knownPositions: Record<string, { x: number; y: number }> = {
  "adv-sarah": { x: 16, y: 20 },
  "client-tan": { x: 48, y: 42 },
  "person-mdm-lim": { x: 18, y: 72 },
  "person-jia-en": { x: 44, y: 78 },
  "referral-estate": { x: 76, y: 32 },
  "specialist-evelyn": { x: 82, y: 68 },
  "specialist-marcus": { x: 62, y: 14 }
};

export function AdaptiveMemoryDisplay({
  response,
  variant = "compact",
  emptyText = "Ask a typed or voice question to render client memory here.",
  title
}: AdaptiveMemoryDisplayProps) {
  const hero = variant === "hero";

  if (!response) {
    return (
      <div className={containerClass(hero)}>
        <p className={eyebrowClass}>L1.5 adaptive answer</p>
        <h3 className={hero ? "mt-1 text-xl font-semibold text-ink" : "mt-1 text-sm font-semibold text-ink"}>
          {title ?? "Ask to show graph, table, cards, or next step"}
        </h3>
        <EmptyState>{emptyText}</EmptyState>
      </div>
    );
  }

  const icon = displayModeIcon(response.displayMode);

  return (
    <div className={containerClass(hero)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={eyebrowClass}>{title ?? (hero ? "Latest answer" : "Adaptive view")}</p>
          <h3 className={`${hero ? "text-2xl" : "text-sm"} mt-1 flex items-center gap-2 font-semibold text-ink`}>
            {icon}
            {displayModeLabel(response.displayMode)}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={response.source === "neo4j" ? "signal" : "neutral"}>{response.source}</Badge>
          <Badge tone="cobalt">{response.displayMode}</Badge>
        </div>
      </div>

      <div className={`${hero ? "mt-4 rounded-[1.15rem] bg-paper p-4 text-base" : "mt-3 text-sm"} leading-6 text-ink`}>
        {response.answer}
      </div>

      {response.missingInfo ? (
        <div className="mt-3 rounded-lg border border-amber/40 bg-amber/15 p-3">
          <p className="text-sm font-semibold text-ink">{response.missingInfo.title}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{response.missingInfo.reason}</p>
          <p className="mt-2 text-sm leading-5 text-ink">{response.missingInfo.suggestedNextStep}</p>
        </div>
      ) : null}

      {response.graph ? <CompactRelationshipGraph graph={response.graph} hero={hero} /> : null}

      {response.cards?.length ? (
        <div className={`mt-3 grid gap-2 ${hero ? "lg:grid-cols-2" : ""}`}>
          {response.cards.slice(0, hero ? 6 : 4).map((card) => (
            <div key={card.id} className="rounded-lg border border-line bg-paper p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{card.eyebrow}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{card.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{card.body}</p>
              {card.meta ? <p className="mt-2 text-xs text-muted">{card.meta}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.rows?.length ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          {response.rows.slice(0, hero ? 8 : 5).map((row) => (
            <div key={`${row.label}-${row.value}`} className="border-b border-line bg-paper p-3 last:border-b-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className="text-xs font-semibold text-muted">{row.value}</p>
              </div>
              {row.detail ? <p className="mt-1 text-sm leading-5 text-muted">{row.detail}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.actions?.length ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Next steps</p>
          {response.actions.slice(0, hero ? 4 : 3).map((action) => (
            <div key={action.id} className="rounded-lg border border-line bg-paper p-3">
              <p className="text-sm font-semibold text-ink">{action.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{action.reason}</p>
              {action.dueAt || action.status ? (
                <p className="mt-2 text-xs font-semibold text-muted">
                  {[action.status, action.dueAt].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.citations.length ? (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <Quote className="h-3.5 w-3.5" />
            Evidence
          </p>
          {response.citations.slice(0, hero ? 4 : 3).map((citation) => (
            <blockquote key={citation.id} className="rounded-lg border border-line bg-paper p-3 text-sm leading-5 text-muted">
              <span className="font-semibold text-ink">{citation.label}: </span>
              {citation.snippet}
            </blockquote>
          ))}
        </div>
      ) : null}

      {response.warning ? <p className="mt-3 text-xs leading-5 text-amber">{response.warning}</p> : null}
    </div>
  );
}

export function CompactRelationshipGraph({
  graph,
  hero
}: {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  hero: boolean;
}) {
  const positions = buildPositions(graph.nodes);

  return (
    <div className="mt-3 rounded-lg border border-line bg-paper p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Relationship map</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            {graph.nodes.length} nodes · {graph.edges.length} relationships
          </p>
        </div>
        <Badge tone="cobalt">graph</Badge>
      </div>

      <div className={`${hero ? "min-h-[420px]" : "min-h-[320px]"} relative mt-3 overflow-hidden rounded-[1rem] border border-line bg-panel`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {graph.edges.map((edge) => {
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
                  stroke="oklch(64% 0.045 230)"
                  strokeWidth="0.45"
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 1.2}
                  fill="oklch(42% 0.035 235)"
                  fontSize="2.4"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        {graph.nodes.map((node) => {
          const position = positions[node.id] ?? { x: 50, y: 50 };
          return (
            <div
              key={node.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[1rem] border bg-paper/95 p-2 shadow-soft backdrop-blur ${
                hero ? "w-40" : "w-32"
              } ${nodeTone(node.type)}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {formatNodeType(node.type)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-ink">{node.label}</p>
              {hero ? <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted">{node.note}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {graph.edges.slice(0, 8).map((edge) => (
          <p key={edge.id} className="rounded-lg border border-line bg-panel px-3 py-2 text-xs leading-5 text-muted">
            <span className="font-semibold text-ink">{nodeLabel(graph.nodes, edge.source)}</span>
            <span> → {edge.label} → </span>
            <span className="font-semibold text-ink">{nodeLabel(graph.nodes, edge.target)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function buildPositions(nodes: GraphNode[]) {
  const positions: Record<string, { x: number; y: number }> = {};
  const unknown = nodes.filter((node) => !knownPositions[node.id]);

  for (const node of nodes) {
    if (knownPositions[node.id]) positions[node.id] = knownPositions[node.id];
  }

  unknown.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(unknown.length, 1) - Math.PI / 2;
    positions[node.id] = {
      x: 50 + Math.cos(angle) * 32,
      y: 50 + Math.sin(angle) * 32
    };
  });

  return positions;
}

function containerClass(hero: boolean) {
  return hero
    ? "space-y-3 rounded-[1.35rem] border border-signal/30 bg-signal/10 p-4 shadow-soft sm:p-5"
    : "space-y-3 rounded-lg border border-line bg-panel p-3";
}

const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";

function displayModeLabel(mode: MemoryQueryVisualResponse["displayMode"]) {
  const labels: Record<MemoryQueryVisualResponse["displayMode"], string> = {
    brief: "Brief answer",
    cards: "Memory cards",
    table: "Action table",
    graph: "Relationship graph",
    timeline: "Timeline",
    recommendation: "Recommendation",
    missing_info: "Missing info"
  };
  return labels[mode];
}

function displayModeIcon(mode: MemoryQueryVisualResponse["displayMode"]): ReactNode {
  if (mode === "recommendation") return <Sparkles className="h-4 w-4 text-signal" />;
  if (mode === "graph") return <GitFork className="h-4 w-4 text-cobalt" />;
  if (mode === "table") return <ListChecks className="h-4 w-4 text-signal" />;
  if (mode === "timeline") return <CalendarClock className="h-4 w-4 text-amber" />;
  if (mode === "missing_info") return <AlertCircle className="h-4 w-4 text-amber" />;
  return <Quote className="h-4 w-4 text-muted" />;
}

function nodeTone(type: GraphNode["type"]) {
  if (type === "Client") return "border-signal/40";
  if (type === "ReferralOpportunity") return "border-amber/50";
  if (type === "Specialist") return "border-cobalt/40";
  return "border-line";
}

function formatNodeType(type: GraphNode["type"]) {
  return type === "ReferralOpportunity" ? "Referral Opportunity" : type;
}

function nodeLabel(nodes: GraphNode[], id: string) {
  return nodes.find((node) => node.id === id)?.label ?? id;
}
