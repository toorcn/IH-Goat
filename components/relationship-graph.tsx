"use client";

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent
} from "react";
import { Maximize2, Minus, Move, Plus } from "lucide-react";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { Badge, Panel } from "./ui";

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; scale: number };
type PanState = { pointerId: number; clientX: number; clientY: number; view: Viewport };

const world = { width: 1480, height: 920 };
const nodeSize = { width: 178, height: 112 };
const minZoom = 0.48;
const maxZoom = 2.6;

const anchors: Record<string, Point> = {
  "adv-sarah": { x: 140, y: 160 },
  "client-tan": { x: 620, y: 390 },
  "person-mdm-lim": { x: 170, y: 640 },
  "person-jia-en": { x: 420, y: 730 },
  "person-ong": { x: 760, y: 800 },
  "meeting-2026-04-08-tan": { x: 520, y: 110 },
  "life-jia-nus": { x: 330, y: 380 },
  "objective-family-transition": { x: 635, y: 670 },
  "concern-policy-renewal": { x: 820, y: 610 },
  "concern-will-planning": { x: 870, y: 420 },
  "promise-guide": { x: 1100, y: 350 },
  "action-guide": { x: 1220, y: 570 },
  "referral-estate": { x: 1050, y: 165 },
  "specialist-marcus": { x: 1300, y: 90 },
  "specialist-evelyn": { x: 1300, y: 290 },
  "referral-business-succession": { x: 1120, y: 790 }
};

export function RelationshipGraph({
  nodes,
  edges
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const layout = useMemo(() => buildNodePositions(nodes), [nodes]);
  const [selectedId, setSelectedId] = useState(nodes.find((node) => node.type === "Client")?.id ?? nodes[0]?.id);
  const [view, setView] = useState<Viewport>(() => fitViewport(nodes, layout));
  const [pan, setPan] = useState<PanState | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const selectedEdges = selectedNode
    ? edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];
  const selectedEdgeIds = new Set(selectedEdges.map((edge) => edge.id));
  const connectedNodeIds = new Set(
    selectedEdges.flatMap((edge) => [edge.source, edge.target]).filter((id) => id !== selectedNode?.id)
  );
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const focusTargets = [
    { label: "Client", id: nodes.find((node) => node.type === "Client")?.id },
    { label: "Concerns", id: nodes.find((node) => node.type === "Concern")?.id },
    { label: "Referrals", id: nodes.find((node) => node.type === "ReferralOpportunity")?.id },
    { label: "Actions", id: nodes.find((node) => node.type === "Action")?.id }
  ].filter((target): target is { label: string; id: string } => Boolean(target.id));

  function zoomAt(multiplier: number, anchor = { x: world.width / 2, y: world.height / 2 }) {
    setView((current) => {
      const nextScale = clamp(current.scale * multiplier, minZoom, maxZoom);
      const graphX = (anchor.x - current.x) / current.scale;
      const graphY = (anchor.y - current.y) / current.scale;
      return {
        x: anchor.x - graphX * nextScale,
        y: anchor.y - graphY * nextScale,
        scale: nextScale
      };
    });
  }

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const cursor = svgPoint(event);
    zoomAt(event.deltaY > 0 ? 0.88 : 1.14, cursor);
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPan({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      view
    });
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pan || pan.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - pan.clientX) / rect.width) * world.width;
    const dy = ((event.clientY - pan.clientY) / rect.height) * world.height;
    setView({
      ...pan.view,
      x: pan.view.x + dx,
      y: pan.view.y + dy
    });
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (pan?.pointerId === event.pointerId) setPan(null);
  }

  function selectNode(node: GraphNode) {
    setSelectedId(node.id);
    const point = layout[node.id];
    if (!point) return;
    setView((current) => ({
      scale: Math.max(current.scale, 0.82),
      x: world.width / 2 - point.x * Math.max(current.scale, 0.82),
      y: world.height / 2 - point.y * Math.max(current.scale, 0.82)
    }));
  }

  function svgPoint(event: ReactWheelEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * world.width,
      y: ((event.clientY - rect.top) / rect.height) * world.height
    };
  }

  return (
    <Panel title="Relationship Knowledge Graph" eyebrow="Client memory canvas">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {focusTargets.map((target) => (
            <button
              key={target.label}
              type="button"
              onClick={() => selectNode(nodeById.get(target.id) ?? nodes[0])}
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-muted">
            <Move className="h-4 w-4" />
            Drag canvas
          </span>
          <IconButton label="Zoom out" onClick={() => zoomAt(0.84)}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <span className="min-w-16 rounded-md border border-line bg-paper px-3 py-2 text-center text-sm font-semibold text-ink">
            {Math.round(view.scale * 100)}%
          </span>
          <IconButton label="Zoom in" onClick={() => zoomAt(1.18)}>
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton label="Fit graph" onClick={() => setView(fitViewport(nodes, layout))}>
            <Maximize2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-paper">
        <svg
          ref={svgRef}
          className="h-[580px] w-full cursor-grab select-none active:cursor-grabbing"
          viewBox={`0 0 ${world.width} ${world.height}`}
          role="img"
          aria-label="Interactive relationship knowledge graph"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
        >
          <defs>
            <pattern id="kg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(86% 0.012 230)" strokeWidth="1" />
            </pattern>
            <marker id="kg-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="oklch(54% 0.04 235)" />
            </marker>
            <filter id="kg-node-shadow" x="-25%" y="-35%" width="150%" height="170%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="rgb(22 31 44)" floodOpacity="0.12" />
            </filter>
          </defs>

          <rect width={world.width} height={world.height} fill="url(#kg-grid)" opacity="0.55" />
          <rect width={world.width} height={world.height} fill="oklch(99% 0.004 230 / 0.72)" />

          <g transform={`matrix(${view.scale} 0 0 ${view.scale} ${view.x} ${view.y})`}>
            {edges.map((edge) => {
              const source = layout[edge.source];
              const target = layout[edge.target];
              if (!source || !target) return null;
              const focused = selectedEdgeIds.has(edge.id);
              const path = edgePath(source, target);
              const label = edgeLabelPoint(source, target);
              return (
                <g key={edge.id} opacity={focused || selectedEdges.length === 0 ? 1 : 0.32}>
                  <path
                    d={path}
                    fill="none"
                    stroke={focused ? "oklch(57% 0.14 176)" : "oklch(64% 0.035 235)"}
                    strokeWidth={focused ? 4 : 2}
                    strokeLinecap="round"
                    markerEnd="url(#kg-arrow)"
                    className={focused ? "graph-focus-edge" : undefined}
                  />
                  <rect
                    x={label.x - Math.max(34, edge.label.length * 4)}
                    y={label.y - 13}
                    width={Math.max(68, edge.label.length * 8)}
                    height="24"
                    rx="8"
                    fill="oklch(99% 0.004 230 / 0.92)"
                    stroke="oklch(88% 0.012 230)"
                  />
                  <text
                    x={label.x}
                    y={label.y + 4}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill={focused ? "oklch(37% 0.11 176)" : "oklch(42% 0.028 235)"}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {nodes.map((node) => {
              const point = layout[node.id] ?? { x: world.width / 2, y: world.height / 2 };
              const selected = selectedId === node.id;
              const connected = connectedNodeIds.has(node.id);
              const theme = nodeTheme(node.type);
              const titleLines = wrapText(node.label, 18, 2);
              const noteLines = wrapText(node.note, 23, 2);
              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${formatNodeType(node.type)} ${node.label}`}
                  transform={`translate(${point.x - nodeSize.width / 2} ${point.y - nodeSize.height / 2})`}
                  className={selected ? "graph-selected-node" : undefined}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => selectNode(node)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectNode(node);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={nodeSize.width}
                    height={nodeSize.height}
                    rx="12"
                    fill={theme.fill}
                    stroke={selected ? "oklch(57% 0.14 176)" : connected ? theme.stroke : "oklch(84% 0.018 230)"}
                    strokeWidth={selected ? 4 : connected ? 3 : 1.5}
                    filter="url(#kg-node-shadow)"
                  />
                  <rect x="14" y="12" width={badgeWidth(node.type)} height="24" rx="7" fill={theme.badge} stroke={theme.stroke} />
                  <text x="26" y="29" fontSize="13" fontWeight="800" fill={theme.text}>
                    {formatNodeType(node.type)}
                  </text>
                  {titleLines.map((line, index) => (
                    <text key={line} x="14" y={52 + index * 17} fontSize="16" fontWeight="800" fill="oklch(20% 0.018 235)">
                      {line}
                    </text>
                  ))}
                  {noteLines.map((line, index) => (
                    <text key={line} x="14" y={91 + index * 15} fontSize="13" fontWeight="600" fill="oklch(48% 0.026 235)">
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedNode ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-lg border border-line bg-paper p-3">
            <Badge tone={nodeTone(selectedNode.type)}>{formatNodeType(selectedNode.type)}</Badge>
            <h3 className="mt-2 text-sm font-semibold text-ink">{selectedNode.label}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{selectedNode.note}</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Connected Evidence</p>
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

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-paper text-ink transition hover:border-signal/45 hover:text-signal"
    >
      {children}
    </button>
  );
}

function buildNodePositions(nodes: GraphNode[]) {
  const layout: Record<string, Point> = {};
  const unknownNodes = nodes.filter((node) => !anchors[node.id]);

  for (const node of nodes) {
    if (anchors[node.id]) layout[node.id] = anchors[node.id];
  }

  if (unknownNodes.length === 0) return layout;

  const radiusX = 450;
  const radiusY = 300;
  unknownNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / unknownNodes.length - Math.PI / 2;
    layout[node.id] = {
      x: world.width / 2 + Math.cos(angle) * radiusX,
      y: world.height / 2 + Math.sin(angle) * radiusY
    };
  });

  return layout;
}

function fitViewport(nodes: GraphNode[], layout: Record<string, Point>): Viewport {
  const points = nodes.map((node) => layout[node.id]).filter(Boolean);
  if (points.length === 0) return { x: 0, y: 0, scale: 1 };

  const padding = 110;
  const minX = Math.min(...points.map((point) => point.x)) - nodeSize.width / 2 - padding;
  const maxX = Math.max(...points.map((point) => point.x)) + nodeSize.width / 2 + padding;
  const minY = Math.min(...points.map((point) => point.y)) - nodeSize.height / 2 - padding;
  const maxY = Math.max(...points.map((point) => point.y)) + nodeSize.height / 2 + padding;
  const scale = clamp(Math.min(world.width / (maxX - minX), world.height / (maxY - minY)), minZoom, 1.15);

  return {
    scale,
    x: (world.width - (minX + maxX) * scale) / 2,
    y: (world.height - (minY + maxY) * scale) / 2
  };
}

function edgePath(source: Point, target: Point) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const curve = Math.min(120, Math.hypot(dx, dy) * 0.16);
  const normalX = dy === 0 ? 0 : (-dy / Math.hypot(dx, dy)) * curve;
  const normalY = dx === 0 ? 0 : (dx / Math.hypot(dx, dy)) * curve;
  const c1 = { x: source.x + dx * 0.42 + normalX, y: source.y + dy * 0.42 + normalY };
  const c2 = { x: source.x + dx * 0.58 + normalX, y: source.y + dy * 0.58 + normalY };

  return `M ${source.x} ${source.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${target.x} ${target.y}`;
}

function edgeLabelPoint(source: Point, target: Point) {
  return {
    x: source.x + (target.x - source.x) * 0.5,
    y: source.y + (target.y - source.y) * 0.5 - 12
  };
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  return lines.map((line, index) =>
    index === maxLines - 1 && words.join(" ").length > lines.join(" ").length ? `${line.replace(/\.+$/, "")}...` : line
  );
}

function badgeWidth(type: GraphNode["type"]) {
  if (type === "ReferralOpportunity") return 132;
  return Math.max(72, formatNodeType(type).length * 8 + 24);
}

function formatNodeType(type: GraphNode["type"]) {
  return type === "ReferralOpportunity" ? "Referral" : type;
}

function nodeTheme(type: GraphNode["type"]) {
  if (type === "Client") {
    return {
      fill: "oklch(98% 0.018 176)",
      badge: "oklch(89% 0.055 176)",
      stroke: "oklch(57% 0.14 176)",
      text: "oklch(31% 0.095 176)"
    };
  }
  if (type === "ReferralOpportunity" || type === "Promise") {
    return {
      fill: "oklch(99% 0.018 78)",
      badge: "oklch(91% 0.08 78)",
      stroke: "oklch(74% 0.15 78)",
      text: "oklch(38% 0.09 78)"
    };
  }
  if (type === "Concern") {
    return {
      fill: "oklch(98% 0.014 18)",
      badge: "oklch(92% 0.052 18)",
      stroke: "oklch(59% 0.16 18)",
      text: "oklch(38% 0.11 18)"
    };
  }
  if (type === "Meeting" || type === "Memory") {
    return {
      fill: "oklch(98% 0.016 250)",
      badge: "oklch(91% 0.055 250)",
      stroke: "oklch(48% 0.13 250)",
      text: "oklch(32% 0.1 250)"
    };
  }
  return {
    fill: "oklch(99% 0.004 230)",
    badge: "oklch(94% 0.012 230)",
    stroke: "oklch(76% 0.028 230)",
    text: "oklch(34% 0.026 235)"
  };
}

function nodeTone(type: GraphNode["type"]): "neutral" | "signal" | "amber" | "rose" | "cobalt" {
  if (type === "Client" || type === "LifeEvent" || type === "Action") return "signal";
  if (type === "ReferralOpportunity" || type === "Promise") return "amber";
  if (type === "Concern") return "rose";
  if (type === "Meeting" || type === "Memory") return "cobalt";
  return "neutral";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
