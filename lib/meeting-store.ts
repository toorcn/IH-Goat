import { extractMeetingSignals } from "./demo-data";
import type { ExtractedMemory, SilentSuggestion, TranscriptEvent } from "./types";

const meetingEvents = new Map<string, TranscriptEvent[]>();

export function appendMeetingEvents(meetingId: string, events: TranscriptEvent[]) {
  const current = meetingEvents.get(meetingId) ?? [];
  const byId = new Map(current.map((event) => [event.id, event]));

  for (const event of events) {
    byId.set(event.id, event);
  }

  const next = Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  meetingEvents.set(meetingId, next);
  return next;
}

export function getMeetingEvents(meetingId: string) {
  return meetingEvents.get(meetingId) ?? [];
}

export function getStoredMeetingSignals(
  meetingId: string,
  options: { clientId: string }
): { events: TranscriptEvent[]; suggestions: SilentSuggestion[]; extracted: ExtractedMemory[] } {
  const events = getMeetingEvents(meetingId);
  const signals = extractMeetingSignals(events, {
    clientId: options.clientId,
    meetingId
  });

  return {
    events,
    ...signals
  };
}
