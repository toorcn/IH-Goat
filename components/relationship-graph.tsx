"use client";

import { useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { Badge, Panel } from "./ui";

const positions: Record<string, { x: number; y: number }> = {
  "adv-sarah": { x: 18, y: 18 },
  "client-tan": { x: 48, y: 38 },
  "person-mdm-lim": { x: 18, y: 68 },
  "person-jia-en": { x: 44, y: 78 },
  "referral-estate": { x: 74, y: 34 },
  "specialist-evelyn": { x: 82, y: 64 },
  "specialist-marcus": { x: 62, y: 14 },
  "person-ong": { x: 28, y: 88 },
  "referral-business-succession": { x: 74, y: 88 },
  "meeting-2026-04-08-tan": { x: 42, y: 12 },
  "life-jia-nus": { x: 28, y: 36 },
  "concern-will-planning": { x: 54, y: 62 },
  "concern-policy-renewal": { x: 44, y: 56 },
  "objective-family-transition": { x: 34, y: 50 },
  "promise-guide": { x: 64, y: 48 },
  "action-guide": { x: 70, y: 74 }
};

export function RelationshipGraph({
  nodes,
  edges
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const layout = useMemo(() => buildNodePositions(nodes), [nodes]);
  const [selectedId, setSelectedId] = useState(nodes.find((node) => node.type === "Client")?.id ?? nodes[0]?.id);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const selectedEdges = selectedNode
    ? edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];
  const selectedEdgeIds = new Set(selectedEdges.map((edge) => edge.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const focusTargets = [
    { label: "Client", id: nodes.find((node) => node.type === "Client")?.id },
    { label: "Concerns", id: nodes.find((node) => node.type === "Concern")?.id },
    { label: "Referrals", id: nodes.find((node) => node.type === "ReferralOpportunity")?.id },
    { label: "Actions", id: nodes.find((node) => node.type === "Action")?.id }
  ].filter((target): target is { label: string; id: string } => Boolean(target.id));

  return (
    <Panel title="Relationship Graph" eyebrow="Neo4j-shaped memory">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {focusTargets.map((target) => (
          <button
            key={target.label}
            type="button"
            onClick={() => setSelectedId(target.id)}
            className={`focus-ring rounded-md border px-3 py-2 text-sm font-semibold transition ${
              selectedId === target.id
                ? "border-signal/50 bg-signal/15 text-ink"
                : "border-line bg-paper text-muted hover:border-signal/40 hover:text-ink"
            }`}
            aria-pressed={selectedId === target.id}
          >
            {target.label}
          </button>
        ))}
      </div>
      <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-line bg-paper">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {edges.map((edge) => {
            const source = layout[edge.source];
            const target = layout[edge.target];
            if (!source || !target) return null;
            const focused = selectedEdgeIds.has(edge.id);
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={focused ? "oklch(62% 0.15 176)" : "oklch(72% 0.035 230)"}
                  strokeWidth={focused ? "0.8" : "0.35"}
                  strokeDasharray={focused ? "1.2 1.1" : undefined}
                  className={focused ? "graph-focus-edge" : undefined}
                  opacity={focused ? "1" : "0.58"}
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2}
                  fill={focused ? "oklch(40% 0.11 176)" : "oklch(47% 0.03 235)"}
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
          const position = layout[node.id] ?? { x: 50, y: 50 };
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(node.id)}
              className={`focus-ring absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-panel p-3 text-left shadow-soft transition hover:-translate-y-[52%] hover:border-signal/50 ${
                selectedId === node.id
                  ? "graph-selected-node border-signal/60 ring-2 ring-signal/20"
                  : selectedEdges.some((edge) => edge.source === node.id || edge.target === node.id)
                    ? "border-cobalt/40"
                    : "border-line"
              }`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <Badge tone={nodeTone(node.type)}>
                {formatNodeType(node.type)}
              </Badge>
              <p className="mt-2 text-sm font-semibold text-ink">{node.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{node.note}</p>
            </button>
          );
        })}
      </div>
      {selectedNode ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-line bg-paper p-3">
            <Badge tone={nodeTone(selectedNode.type)}>
              {formatNodeType(selectedNode.type)}
            </Badge>
            <h3 className="mt-2 text-sm font-semibold text-ink">{selectedNode.label}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{selectedNode.note}</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Connected Evidence
            </p>
            {selectedEdges.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted">No direct edge selected.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedEdges.map((edge) => (
                  <Badge key={edge.id} tone="neutral">
                    {edge.label}: {nodeById.get(edge.source === selectedNode.id ? edge.target : edge.source)?.label ?? "Unknown"}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function buildNodePositions(nodes: GraphNode[]) {
  const layout: Record<string, { x: number; y: number }> = {};
  const unknownNodes = nodes.filter((node) => !positions[node.id]);

  for (const node of nodes) {
    if (positions[node.id]) {
      layout[node.id] = positions[node.id];
    }
  }

  if (unknownNodes.length === 0) return layout;

  const radiusX = 34;
  const radiusY = 34;
  unknownNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / unknownNodes.length - Math.PI / 2;
    layout[node.id] = {
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY
    };
  });

  return layout;
}

function formatNodeType(type: GraphNode["type"]) {
  return type === "ReferralOpportunity" ? "Referral Opportunity" : type;
}

function nodeTone(type: GraphNode["type"]): "neutral" | "signal" | "amber" | "rose" | "cobalt" {
  if (type === "Client" || type === "LifeEvent" || type === "Action") return "signal";
  if (type === "ReferralOpportunity" || type === "Promise") return "amber";
  if (type === "Concern") return "rose";
  if (type === "Meeting" || type === "Memory") return "cobalt";
  return "neutral";
}
