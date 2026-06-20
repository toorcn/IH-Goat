"use client";

import { useMemo, useState } from "react";
import { Mic, Plus, Square, WandSparkles } from "lucide-react";
import { useLiveMeetingRecorder } from "@/hooks/use-live-meeting-recorder";
import { extractMeetingSignals } from "@/lib/demo-data";
import { inferSpeaker, normalizeSpeakerLabel } from "@/lib/speaker-inference";
import type { ClientContext, ExtractedMemory, SilentSuggestion, TranscriptEvent } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";
import { SuggestionFeed } from "./suggestion-feed";

const demoStatements = [
  "Jia En is excited about NUS, but it made me think more seriously about family planning.",
  "I still have not updated my will. I know it matters, but I am not sure where to begin.",
  "Sarah: What would make the will update feel less overwhelming to start?",
  "That question helps. I think I need one simple checklist and someone trusted to explain the legal parts.",
  "My friend Mr. Ong runs a family business and might need succession planning advice later.",
  "I am still unsure whether renewing the policy now is the right move.",
  "If you know a good lawyer or estate planning person, I would appreciate an introduction.",
  "Please send me the estate planning guide after this meeting."
];

export function MeetingCompanion({ context }: { context: ClientContext }) {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [draft, setDraft] = useState("");
  const [speaker, setSpeaker] = useState<TranscriptEvent["speaker"]>("client");

  const signals = useMemo(
    () =>
      extractMeetingSignals(events, {
        clientId: context.client.id,
        meetingId: context.upcomingMeeting.id
      }),
    [context.client.id, context.upcomingMeeting.id, events]
  );
  const suggestions: SilentSuggestion[] = signals.suggestions;
  const extracted: ExtractedMemory[] = signals.extracted;
  const triggeredMemories = useMemo(() => {
    const text = events.map((event) => event.text).join(" ").toLowerCase();
    if (!text) return [];
    return context.memories
      .filter((memory) =>
        `${memory.title} ${memory.summary} ${memory.sourceSnippet}`
          .toLowerCase()
          .split(/\W+/)
          .some((word) => word.length > 4 && text.includes(word))
      )
      .slice(0, 4);
  }, [context.memories, events]);
  const recorder = useLiveMeetingRecorder({
    meetingId: context.upcomingMeeting.id,
    clientId: context.client.id,
    onTranscript: (payload) => {
      if (payload.text) {
        addEvent(payload.text, inferSpeaker(payload.text));
      }
    }
  });

  function addEvent(text: string, speaker: TranscriptEvent["speaker"] = "client") {
    const clean = normalizeSpeakerLabel(text);
    if (!clean) return;
    const resolvedSpeaker = speaker === "unknown" ? inferSpeaker(text) : speaker;
    const nextEvent = {
      id: `event-${Date.now()}-${events.length + 1}`,
      speaker: resolvedSpeaker,
      text: clean,
      timestamp: new Date().toISOString()
    };
    setEvents((current) => [
      ...current,
      nextEvent
    ]);
    void fetch(`/api/meetings/${context.upcomingMeeting.id}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ events: [nextEvent] })
    });
    setDraft("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel
        title="Live Meeting Companion"
        eyebrow="Silent mode"
        action={
          <Badge tone={recorder.isRecording ? "rose" : "neutral"}>
            {recorder.isRecording ? "listening" : "paused"}
          </Badge>
        }
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void recorder.startRecording()}
            disabled={recorder.isStarting || recorder.isRecording}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-cobalt"
          >
            <Mic className="h-4 w-4" />
            {recorder.isStarting ? "Starting" : "Start capture"}
          </button>
          <button
            type="button"
            onClick={() => void recorder.stopRecording()}
            disabled={!recorder.isRecording}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-rose/50"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
          <button
            type="button"
            onClick={() =>
              demoStatements.forEach((statement, index) => setTimeout(() => addEvent(statement, "unknown"), index * 180))
            }
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-signal/30 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/20"
          >
            <WandSparkles className="h-4 w-4" />
            Simulate meeting
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Mic level
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-signal transition-[width]"
                style={{ width: `${Math.round(recorder.audioLevel * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Browser capture
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Microphone audio is buffered into WAV chunks, silence is skipped, and each chunk
              is posted to the meeting transcription endpoint before memory extraction.
            </p>
          </div>
        </div>

        {recorder.error ? (
          <div className="mt-3 rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm leading-6 text-ink">
            {recorder.error}
          </div>
        ) : null}

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
            addEvent(draft, speaker);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a meeting statement for demo capture"
            className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted"
          />
          <select
            value={speaker}
            onChange={(event) => setSpeaker(event.target.value as TranscriptEvent["speaker"])}
            className="focus-ring rounded-md border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-ink"
            aria-label="Speaker label"
          >
            <option value="client">Client</option>
            <option value="advisor">Advisor</option>
            <option value="unknown">Infer</option>
          </select>
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
        <Panel title="Triggered Memory" eyebrow="Fetched context">
          {triggeredMemories.length === 0 ? (
            <EmptyState>Relevant Neo4j-backed memories appear when the transcript touches known topics.</EmptyState>
          ) : (
            <div className="space-y-3">
              {triggeredMemories.map((memory) => (
                <article key={memory.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={memory.status === "open" ? "amber" : "neutral"}>{memory.category}</Badge>
                    <span className="text-xs font-medium text-muted">{memory.source}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{memory.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{memory.summary}</p>
                </article>
              ))}
            </div>
          )}
        </Panel>
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
                  {item.recommendedAction ? (
                    <p className="mt-2 rounded-md border border-signal/25 bg-signal/10 p-2 text-sm leading-5 text-ink">
                      {item.recommendedAction}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="cobalt">{item.proposedNodes?.length ?? 0} nodes</Badge>
                    <Badge tone="cobalt">{item.proposedEdges?.length ?? 0} edges</Badge>
                    {item.relatedPersonName ? <Badge tone="amber">{item.relatedPersonName}</Badge> : null}
                  </div>
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
