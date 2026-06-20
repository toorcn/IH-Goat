import type { TranscriptEvent } from "./types";

const advisorCues = [
  "i will",
  "i'll",
  "let me",
  "i can",
  "i can introduce",
  "i will send",
  "i'll send",
  "i can draft",
  "sarah:"
];

const clientCues = [
  "my daughter",
  "my wife",
  "my friend",
  "my family",
  "i still have not",
  "i am still",
  "i'm still",
  "i would appreciate",
  "that question helps",
  "i think i need",
  "mr. tan:",
  "client:"
];

export function inferSpeaker(text: string): TranscriptEvent["speaker"] {
  const normalized = text.trim().toLowerCase();

  if (advisorCues.some((cue) => normalized.includes(cue))) return "advisor";
  if (clientCues.some((cue) => normalized.includes(cue))) return "client";
  if (normalized.includes("?") && (normalized.startsWith("would") || normalized.startsWith("what"))) {
    return "advisor";
  }

  return "unknown";
}

export function normalizeSpeakerLabel(text: string) {
  return text.replace(/^(sarah|advisor|mr\.?\s*tan|client)\s*:\s*/i, "").trim();
}
