"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle
} from "lucide-react";
import type { ClientContext, ExtractedMemory, TranscriptEvent } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

const l2DemoStatements = [
  "Jia En is excited about NUS, and my wife is expecting in September, so the family plan feels more urgent now.",
  "I want estate planning advice before the baby arrives, especially around guardianship and simple wills.",
  "Please introduce me to Evelyn Ng if she is the right estate planning specialist for young families.",
  "Sarah, can you send me the estate planning guide and checklist after this meeting?"
];

type WriteLogItem = {
  id: string;
  summary: string;
  saved: boolean;
  writeMode?: string;
  reason?: string;
};

export function L2MemoryWriter({ context, meetingId }: { context: ClientContext; meetingId: string }) {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [draft, setDraft] = useState("");
  const [extracted, setExtracted] = useState<ExtractedMemory[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [writeLog, setWriteLog] = useState<WriteLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const visibleCandidates = useMemo(
    () => extracted.filter((memory) => !rejectedIds.includes(memory.id)),
    [extracted, rejectedIds]
  );
  const pendingCandidates = visibleCandidates.filter((memory) => !approvedIds.includes(memory.id));

  function addEvent(text: string, speaker: TranscriptEvent["speaker"] = "client") {
    const clean = text.trim();
    if (!clean) return;
    setEvents((current) => [
      ...current,
      {
        id: `l2-event-${current.length + 1}`,
        speaker,
        text: clean,
        timestamp: new Date().toISOString()
      }
    ]);
    setDraft("");
  }

  function simulateMeeting() {
    l2DemoStatements.forEach((statement, index) => {
      window.setTimeout(() => addEvent(statement), index * 120);
    });
  }

  async function extractCandidateMemory() {
    if (events.length === 0) {
      setError("Add or simulate transcript lines before extracting memory.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        throw new Error(`Extraction failed with ${response.status}`);
      }

      const data = (await response.json()) as { extracted?: ExtractedMemory[] };
      setExtracted(data.extracted ?? []);
      setRejectedIds([]);
      setApprovedIds([]);
      setWriteLog([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function approveMemory(memory: ExtractedMemory) {
    if (approvedIds.includes(memory.id) || savingIds.includes(memory.id)) return;

    setSavingIds((current) => [...current, memory.id]);
    setError(null);
    try {
      const response = await fetch("/api/memory/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory })
      });

      if (!response.ok) {
        throw new Error(`Approval failed with ${response.status}`);
      }

      const data = (await response.json()) as {
        saved?: boolean;
        writeMode?: string;
        reason?: string;
      };
      setApprovedIds((current) => [...new Set([...current, memory.id])]);
      setWriteLog((current) => [
        {
          id: memory.id,
          summary: memory.summary,
          saved: Boolean(data.saved),
          writeMode: data.writeMode,
          reason: data.reason
        },
        ...current.filter((item) => item.id !== memory.id)
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed.");
    } finally {
      setSavingIds((current) => current.filter((id) => id !== memory.id));
    }
  }

  async function approveAll() {
    for (const memory of pendingCandidates) {
      await approveMemory(memory);
    }
  }

  function rejectMemory(id: string) {
    setRejectedIds((current) => [...new Set([...current, id])]);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(22rem,0.8fr)]">
      <Panel
        title="1. Capture transcript"
        eyebrow="Meeting input"
        action={<Badge tone="cobalt">{events.length} lines</Badge>}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={simulateMeeting}
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-cobalt"
          >
            <Sparkles className="h-4 w-4" />
            Simulate L2 meeting
          </button>
          <button
            type="button"
            onClick={() => {
              setEvents([]);
              setExtracted([]);
              setRejectedIds([]);
              setApprovedIds([]);
              setWriteLog([]);
            }}
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
          >
            <Trash2 className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-line bg-paper p-3 sm:p-4">
          <p className="text-sm font-semibold text-ink">Transcript for {context.client.name}</p>
          <div className="mt-3 max-h-[460px] space-y-2 overflow-auto">
            {events.length === 0 ? (
              <EmptyState>Simulate the L2 meeting or type a real note to start.</EmptyState>
            ) : (
              events.map((event) => (
                <article key={event.id} className="rounded-[1rem] border border-line bg-panel p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{event.speaker}</Badge>
                    <span className="text-xs font-medium text-muted">
                      {new Date(event.timestamp).toLocaleTimeString("en-SG", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink">{event.text}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <form
          className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addEvent(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a meeting note, promise, concern, or referral request"
            className="focus-ring min-h-11 min-w-0 rounded-full border border-line bg-panel px-4 py-2.5 text-sm text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-signal/80"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </Panel>

      <Panel
        title="2. Review candidates"
        eyebrow="Extracted memory"
        action={
          <button
            type="button"
            onClick={() => void extractCandidateMemory()}
            disabled={isExtracting || events.length === 0}
            className="focus-ring pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isExtracting ? "animate-spin" : ""}`} />
            {isExtracting ? "Extracting" : "Extract memory"}
          </button>
        }
      >
        {error ? (
          <div className="mb-3 rounded-[1rem] border border-rose/30 bg-rose/10 p-3 text-sm leading-6 text-ink">
            {error}
          </div>
        ) : null}

        <div className="mb-4 rounded-[1rem] border border-cobalt/25 bg-cobalt/10 p-3 text-sm leading-6 text-muted">
          <span className="font-semibold text-ink">No auto-write:</span> extraction only proposes
          memory cards. Approve cards before they touch Neo4j.
        </div>

        {visibleCandidates.length === 0 ? (
          <EmptyState>Candidate memories appear here after extraction.</EmptyState>
        ) : (
          <div className="space-y-3">
            {visibleCandidates.map((memory) => {
              const approved = approvedIds.includes(memory.id);
              const saving = savingIds.includes(memory.id);
              return (
                <article key={memory.id} className="rounded-[1.15rem] border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={approved ? "signal" : "amber"}>{memory.category}</Badge>
                    <span className="text-xs font-medium text-muted">
                      {Math.round(memory.confidence * 100)}% confidence
                    </span>
                    {approved ? <Badge tone="signal">approved</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{memory.summary}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">&quot;{memory.sourceSnippet}&quot;</p>
                  <p className="mt-2 overflow-x-auto rounded-[0.85rem] bg-panel p-2 font-mono text-xs leading-5 text-muted">
                    {memory.proposedGraphMutation}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void approveMemory(memory)}
                      disabled={approved || saving}
                      className="focus-ring pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? "Writing" : approved ? "Written" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMemory(memory.id)}
                      disabled={approved || saving}
                      className="focus-ring pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-rose/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title="3. Write to memory"
        eyebrow="Neo4j impact"
        action={<Badge tone={pendingCandidates.length === 0 ? "signal" : "amber"}>{pendingCandidates.length} pending</Badge>}
      >
        <button
          type="button"
          onClick={() => void approveAll()}
          disabled={pendingCandidates.length === 0 || savingIds.length > 0}
          className="focus-ring pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Database className="h-4 w-4" />
          Approve all
        </button>

        <div className="mt-4 rounded-[1.15rem] border border-line bg-paper p-3">
          <p className="text-sm font-semibold text-ink">Write target</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <dt className="text-muted">Client</dt>
              <dd className="text-right font-semibold text-ink">{context.client.name}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <dt className="text-muted">Meeting</dt>
              <dd className="text-right font-semibold text-ink">{meetingId}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2">
              <dt className="text-muted">Mode</dt>
              <dd className="text-right font-semibold text-ink">{context.dataMode ?? context.memorySource}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FileText className="h-4 w-4 text-cobalt" />
            Write log
          </p>
          {writeLog.length === 0 ? (
            <EmptyState>Approvals and Neo4j write results appear here.</EmptyState>
          ) : (
            writeLog.map((item) => (
              <article key={item.id} className="rounded-[1rem] border border-line bg-paper p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.saved ? "signal" : "amber"}>
                    {item.saved ? "saved" : "demo fallback"}
                  </Badge>
                  {item.writeMode ? <Badge tone="neutral">{item.writeMode}</Badge> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{item.summary}</p>
                {item.reason ? <p className="mt-1 text-sm leading-6 text-muted">{item.reason}</p> : null}
              </article>
            ))
          )}
        </div>
      </Panel>
    </section>
  );
}
