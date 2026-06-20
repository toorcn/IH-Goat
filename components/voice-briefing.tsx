"use client";

import { useMemo, useState } from "react";
import { Mic, MicOff, Pause, Play, Send } from "lucide-react";
import type { ClientContext } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

type Message = {
  role: "assistant" | "advisor";
  text: string;
};

const cannedAnswers = [
  {
    terms: ["last", "discuss"],
    answer:
      "Last time, Sarah and Mr. Tan discussed estate planning. The will update remained unresolved, he was hesitant about policy renewal, and Sarah promised to send an estate planning guide."
  },
  {
    terms: ["open", "start"],
    answer:
      "Open with Jia En's NUS news, then bridge gently: since the family is entering a new season, it may be a good time to finish the will update."
  },
  {
    terms: ["introduce", "who", "lawyer", "estate"],
    answer:
      "Evelyn Ng is the strongest estate planning introduction. Marcus Lee is useful if Mr. Tan specifically asks for legal execution."
  },
  {
    terms: ["renewal", "policy"],
    answer:
      "The memory says he was unsure whether renewing now was the right move. Ask what would make the renewal feel clearly worth it."
  }
];

export function VoiceBriefing({ context }: { context: ClientContext }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: context.briefing }
  ]);
  const [draft, setDraft] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const transcript = useMemo(() => messages.map((message) => message.text).join(" "), [messages]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 0.96;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function askQuestion(question: string) {
    const clean = question.trim();
    if (!clean) return;

    const lower = clean.toLowerCase();
    const match = cannedAnswers.find((item) => item.terms.some((term) => lower.includes(term)));
    const answer =
      match?.answer ??
      "I only have grounded memory for Jia En's NUS milestone, will planning, policy renewal hesitation, the promised guide, and the Evelyn or Marcus introduction path.";

    setMessages((current) => [
      ...current,
      { role: "advisor", text: clean },
      { role: "assistant", text: answer }
    ]);
    setDraft("");
    speak(answer);
  }

  function startBrowserDictation() {
    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Browser speech recognition is not available here. Use the typed question box for the demo fallback."
        }
      ]);
      return;
    }

    const recognition = new (SpeechRecognition as new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      onend: (() => void) | null;
    })();
    recognition.lang = "en-SG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript ?? "";
      askQuestion(spoken);
    };
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  }

  return (
    <Panel
      title="Pre-Meeting Voice Briefing"
      eyebrow="Advisor call"
      action={<Badge tone={isSpeaking ? "signal" : "neutral"}>{isSpeaking ? "speaking" : "ready"}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => speak(context.briefing)}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-cobalt"
            >
              <Play className="h-4 w-4" />
              Play briefing
            </button>
            <button
              type="button"
              onClick={stopSpeaking}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-rose/50"
            >
              <Pause className="h-4 w-4" />
              Stop
            </button>
            <button
              type="button"
              onClick={startBrowserDictation}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-signal/50"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? "Listening" : "Ask by voice"}
            </button>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-auto rounded-lg border border-line bg-paper p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg p-3 ${
                  message.role === "assistant" ? "bg-panel text-ink" : "bg-cobalt/10 text-ink"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {message.role === "assistant" ? "Assistant" : "Sarah"}
                </p>
                <p className="mt-1 text-sm leading-6">{message.text}</p>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              askQuestion(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask: Who should I introduce Mr. Tan to?"
              className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/80"
            >
              <Send className="h-4 w-4" />
              Ask
            </button>
          </form>
        </div>

        <aside className="rounded-lg border border-line bg-paper p-3">
          <p className="text-sm font-semibold text-ink">Suggested follow-ups</p>
          <div className="mt-3 space-y-2">
            {context.suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => askQuestion(question)}
                className="focus-ring w-full rounded-md border border-line bg-panel px-3 py-2 text-left text-sm leading-5 text-ink transition hover:border-signal/50"
              >
                {question}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Transcript size</p>
            {transcript ? (
              <p className="mt-1 text-sm text-ink">{transcript.length} characters</p>
            ) : (
              <EmptyState>No transcript yet.</EmptyState>
            )}
          </div>
        </aside>
      </div>
    </Panel>
  );
}
