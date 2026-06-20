"use client";

import { useMemo, useState } from "react";
import { Mic, Plus, Square, WandSparkles } from "lucide-react";
import { extractMeetingSignals } from "@/lib/demo-data";
import type { ClientContext, ExtractedMemory, SilentSuggestion, TranscriptEvent } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";
import { SuggestionFeed } from "./suggestion-feed";

const demoStatements = [
  "Jia En is excited about NUS, but it made me think more seriously about family planning.",
  "I still have not updated my will. I know it matters, but I am not sure where to begin.",
  "If you know a good lawyer or estate planning person, I would appreciate an introduction.",
  "Please send me the estate planning guide after this meeting."
];

export function MeetingCompanion({ context }: { context: ClientContext }) {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [draft, setDraft] = useState("");
  const [isLive, setIsLive] = useState(false);

  const signals = useMemo(() => extractMeetingSignals(events), [events]);
  const suggestions: SilentSuggestion[] = signals.suggestions;
  const extracted: ExtractedMemory[] = signals.extracted;

  function addEvent(text: string, speaker: TranscriptEvent["speaker"] = "client") {
    const clean = text.trim();
    if (!clean) return;
    setEvents((current) => [
      ...current,
      {
        id: `event-${current.length + 1}`,
        speaker,
        text: clean,
        timestamp: new Date().toISOString()
      }
    ]);
    setDraft("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel
        title="Live Meeting Companion"
        eyebrow="Silent mode"
        action={<Badge tone={isLive ? "rose" : "neutral"}>{isLive ? "listening" : "paused"}</Badge>}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsLive(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-cobalt"
          >
            <Mic className="h-4 w-4" />
            Start capture
          </button>
          <button
            type="button"
            onClick={() => setIsLive(false)}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-rose/50"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
          <button
            type="button"
            onClick={() => demoStatements.forEach((statement, index) => setTimeout(() => addEvent(statement), index * 180))}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-signal/30 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/20"
          >
            <WandSparkles className="h-4 w-4" />
            Simulate meeting
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-paper p-3">
          <p className="text-sm font-semibold text-ink">
            Transcript stream for {context.client.name}
          </p>
          <div className="mt-3 max-h-[360px] space-y-2 overflow-auto">
            {events.length === 0 ? (
              <EmptyState>Use simulation or add a line manually to trigger suggestions.</EmptyState>
            ) : (
              events.map((event) => (
                <article key={event.id} className="rounded-md border border-line bg-panel p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={event.speaker === "client" ? "cobalt" : "neutral"}>{event.speaker}</Badge>
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
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addEvent(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a meeting statement for demo capture"
            className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/80"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </Panel>

      <div className="space-y-4">
        <SuggestionFeed suggestions={suggestions} />
        <Panel title="Captured Memory" eyebrow="Candidate updates">
          {extracted.length === 0 ? (
            <EmptyState>Candidate memories appear after relevant transcript events.</EmptyState>
          ) : (
            <div className="space-y-3">
              {extracted.map((item) => (
                <article key={item.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="signal">{item.category}</Badge>
                    <span className="text-xs font-medium text-muted">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{item.summary}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">&quot;{item.sourceSnippet}&quot;</p>
                  <p className="mt-2 rounded-md bg-panel p-2 font-mono text-xs leading-5 text-muted">
                    {item.proposedGraphMutation}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
