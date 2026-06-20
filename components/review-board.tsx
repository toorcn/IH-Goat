"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { actions, extractMeetingSignals } from "@/lib/demo-data";
import type { ActionItem, ClientContext, ExtractedMemory, TranscriptEvent } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

const reviewTranscript: TranscriptEvent[] = [
  {
    id: "review-1",
    speaker: "client",
    text: "Jia En is excited about NUS, but it made me think more seriously about family planning.",
    timestamp: new Date().toISOString()
  },
  {
    id: "review-2",
    speaker: "client",
    text: "I still have not updated my will and would appreciate an introduction to a lawyer or estate planning person.",
    timestamp: new Date().toISOString()
  },
  {
    id: "review-3",
    speaker: "advisor",
    text: "I will send the estate planning guide and draft an introduction to Evelyn Ng.",
    timestamp: new Date().toISOString()
  }
];

export function ReviewBoard({ context }: { context: ClientContext }) {
  const generated = useMemo(() => extractMeetingSignals(reviewTranscript).extracted, []);
  const [actionState, setActionState] = useState<ActionItem[]>(actions);
  const [memoryState, setMemoryState] = useState<ExtractedMemory[]>(generated);
  const approvedActions = actionState.filter((action) => action.status === "approved").length;
  const approvedMemories = memoryState.filter((memory) => memory.id.startsWith("approved-")).length;

  function markAction(id: string, status: ActionItem["status"]) {
    setActionState((current) =>
      current.map((action) => (action.id === id ? { ...action, status } : action))
    );
  }

  function approveMemory(id: string) {
    setMemoryState((current) =>
      current.map((memory) => (memory.id === id ? { ...memory, id: `approved-${memory.id}` } : memory))
    );
  }

  function ignoreMemory(id: string) {
    setMemoryState((current) => current.filter((memory) => memory.id !== id));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Meeting Summary" eyebrow={context.client.name}>
        <div className="space-y-3 text-sm leading-6 text-muted">
          <p>
            Mr. Tan connected Jia En&apos;s NUS milestone to a broader family planning
            concern. Will planning is still open, and he is receptive to specialist help.
          </p>
          <p>
            Sarah should send the estate planning guide, draft a warm introduction to Evelyn
            Ng, and create a reminder to revisit policy renewal once the estate plan has a
            clearer next step.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Actions approved
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{approvedActions}</p>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Memories approved
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{approvedMemories}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Follow-Up Actions" eyebrow="Advisor approval">
        <div className="space-y-3">
          {actionState.map((action) => (
            <article key={action.id} className="rounded-lg border border-line bg-paper p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={action.status === "approved" ? "signal" : "amber"}>{action.status}</Badge>
                    <span className="text-xs font-medium text-muted">Due {action.dueAt}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-ink">{action.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => markAction(action.id, "approved")}
                    className="focus-ring rounded-md border border-signal/40 bg-signal/10 p-2 text-ink transition hover:bg-signal/20"
                    aria-label={`Approve ${action.title}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => markAction(action.id, "pending")}
                    className="focus-ring rounded-md border border-line bg-panel p-2 text-ink transition hover:border-cobalt/40"
                    aria-label={`Edit ${action.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => markAction(action.id, "ignored")}
                    className="focus-ring rounded-md border border-rose/30 bg-rose/10 p-2 text-ink transition hover:bg-rose/20"
                    aria-label={`Ignore ${action.title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {action.draftText ? (
                <p className="mt-3 rounded-md bg-panel p-3 text-sm leading-6 text-muted">
                  {action.draftText}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Memory Updates" eyebrow="Neo4j mutations" className="xl:col-span-2">
        {memoryState.length === 0 ? (
          <EmptyState>All candidate memories have been ignored or cleared.</EmptyState>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {memoryState.map((memory) => {
              const approved = memory.id.startsWith("approved-");
              return (
                <article key={memory.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={approved ? "signal" : "neutral"}>{approved ? "approved" : memory.category}</Badge>
                    <span className="text-xs font-medium text-muted">
                      {Math.round(memory.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{memory.summary}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">&quot;{memory.sourceSnippet}&quot;</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => approveMemory(memory.id)}
                      className="focus-ring inline-flex items-center gap-2 rounded-md bg-signal px-3 py-2 text-sm font-semibold text-ink transition hover:bg-signal/80"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => ignoreMemory(memory.id)}
                      className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm font-semibold text-ink transition hover:border-rose/40"
                    >
                      <X className="h-4 w-4" />
                      Ignore
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
