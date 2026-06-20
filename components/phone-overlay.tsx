"use client";

import { useMemo, useState } from "react";
import { Mic, Plus, Square, WandSparkles } from "lucide-react";
import { useLiveMeetingRecorder } from "@/hooks/use-live-meeting-recorder";
import { extractMeetingSignals } from "@/lib/demo-data";
import { inferSpeaker, normalizeSpeakerLabel } from "@/lib/speaker-inference";
import type { ClientContext, TranscriptEvent } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

const overlayStatements = [
  "Mr. Tan says Jia En starting NUS made the family planning timeline feel more real.",
  "Mr. Tan mentions Mr. Ong, a friend with a family business succession question.",
  "Mr. Tan asks whether Sarah can introduce Evelyn Ng after the meeting."
];

export function PhoneOverlay({ context }: { context: ClientContext }) {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [draft, setDraft] = useState("");
  const signals = useMemo(
    () =>
      extractMeetingSignals(events, {
        clientId: context.client.id,
        meetingId: context.upcomingMeeting.id
      }),
    [context.client.id, context.upcomingMeeting.id, events]
  );
  const topSuggestion = signals.suggestions[0];
  const openMemories = context.memories.filter((memory) => memory.status === "open").slice(0, 3);
  const recorder = useLiveMeetingRecorder({
    meetingId: context.upcomingMeeting.id,
    clientId: context.client.id,
    chunkIntervalMs: 5000,
    onTranscript: (payload) => {
      if (payload.text) addEvent(payload.text, inferSpeaker(payload.text));
    }
  });

  function addEvent(text: string, speaker: TranscriptEvent["speaker"] = "client") {
    const clean = normalizeSpeakerLabel(text);
    if (!clean) return;
    const resolvedSpeaker = speaker === "unknown" ? inferSpeaker(text) : speaker;
    const nextEvent = {
      id: `overlay-${Date.now()}-${events.length + 1}`,
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
    <div className="mx-auto w-full max-w-sm">
      <Panel
        title="In-Person Overlay"
        eyebrow={context.client.name}
        action={<Badge tone={recorder.isRecording ? "rose" : "neutral"}>{recorder.isRecording ? "live" : "ready"}</Badge>}
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-paper p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Silent Mode</p>
                <p className="mt-1 text-sm font-semibold text-ink">{context.upcomingMeeting.objective}</p>
              </div>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-signal transition-[width]"
                  style={{ width: `${Math.round(recorder.audioLevel * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => void recorder.startRecording()}
              disabled={recorder.isStarting || recorder.isRecording}
              className="focus-ring inline-flex items-center justify-center rounded-md bg-ink p-3 text-paper transition hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Start overlay capture"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void recorder.stopRecording()}
              disabled={!recorder.isRecording}
              className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-panel p-3 text-ink transition hover:border-rose/50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Stop overlay capture"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                overlayStatements.forEach((statement, index) => {
                  window.setTimeout(() => addEvent(statement), index * 180);
                })
              }
              className="focus-ring inline-flex items-center justify-center rounded-md border border-signal/30 bg-signal/10 p-3 text-ink transition hover:bg-signal/20"
              aria-label="Simulate overlay meeting"
            >
              <WandSparkles className="h-4 w-4" />
            </button>
          </div>

          {recorder.error ? (
            <div className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-sm leading-6 text-ink">
              {recorder.error}
            </div>
          ) : null}

          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Now</p>
            {topSuggestion ? (
              <>
                <h3 className="mt-2 text-base font-semibold text-ink">{topSuggestion.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{topSuggestion.reason}</p>
                <Badge tone={topSuggestion.priority === "high" ? "rose" : "amber"}>{topSuggestion.source}</Badge>
              </>
            ) : (
              <EmptyState>No live suggestion yet.</EmptyState>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-paper p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Captured</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{signals.extracted.length}</p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Open Loops</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{openMemories.length}</p>
            </div>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addEvent(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Quick note"
              className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              className="focus-ring inline-flex items-center justify-center rounded-md bg-signal p-3 text-ink transition hover:bg-signal/80"
              aria-label="Add quick note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>

          <div className="space-y-2">
            {events.slice(-3).map((event) => (
              <div key={event.id} className="rounded-lg border border-line bg-paper p-3">
                <Badge tone="cobalt">{event.speaker}</Badge>
                <p className="mt-2 text-sm leading-6 text-muted">{event.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
