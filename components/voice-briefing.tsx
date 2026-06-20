"use client";

import { useMemo, useRef, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import type { ClientContext } from "@/lib/types";
import { Badge } from "./ui";

type Message = {
  id: string;
  role: "assistant" | "advisor" | "system";
  text: string;
};

type RealtimeStatus = "idle" | "connecting" | "connected" | "speaking" | "error";

type TokenResponse = {
  mode?: string;
  model?: string;
  value?: string | null;
  client_secret?: {
    value?: string | null;
    expires_at?: number | null;
  } | null;
  error?: string;
  detail?: string;
  message?: string;
};

const realtimeCallsUrl = "https://api.openai.com/v1/realtime/calls";

export function VoiceBriefing({ context }: { context: ClientContext }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "briefing-seed", role: "assistant", text: context.briefing }
  ]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [statusText, setStatusText] = useState("Tap to start. I'll talk you through it — just ask follow-ups out loud.");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const connected = status === "connected" || status === "speaking";
  const speaking = status === "speaking";

  const lastMessage = messages.at(-1);
  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages]
  );
  const advisorQuestion = lastMessage?.role === "advisor" ? lastMessage.text : null;
  const phaseLabel =
    status === "error"
      ? "Something went wrong"
      : status === "connecting"
        ? "Connecting"
        : speaking
          ? "Speaking"
          : connected
            ? "Listening"
            : "Ready";

  async function startRealtimeBriefing() {
    if (status === "connecting" || connected) return;
    setStatus("connecting");
    setStatusText("Connecting…");

    try {
      const tokenResponse = await fetch("/api/realtime/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          voice: "alloy",
          instructions: buildRealtimeInstructions(context)
        })
      });

      const token = (await tokenResponse.json()) as TokenResponse;
      const ephemeralKey = token.value ?? token.client_secret?.value;
      if (!tokenResponse.ok || !ephemeralKey) {
        throw new Error(token.detail ?? token.error ?? token.message ?? "Unable to create Realtime token.");
      }

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      audioRef.current = document.createElement("audio");
      audioRef.current.autoplay = true;
      peer.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      for (const track of stream.getAudioTracks()) {
        peer.addTrack(track, stream);
      }

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = (event) => handleRealtimeEvent(event.data);
      channel.onerror = () => {
        setStatus("error");
        setStatusText("Realtime data channel failed.");
      };
      channel.onclose = () => {
        setStatus((current) => (current === "error" ? current : "idle"));
        setStatusText("Realtime session closed.");
      };
      channel.onopen = () => {
        setStatus("connected");
        setStatusText("I'm listening — ask me anything about this client.");
        requestAssistantResponse(
          "Speak the prepared pre-meeting briefing now. Then pause and wait for Sarah's voice follow-up questions."
        );
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const sdpResponse = await fetch(realtimeCallsUrl, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        }
      });

      if (!sdpResponse.ok) {
        throw new Error(await sdpResponse.text());
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text()
      });
    } catch (caught) {
      stopRealtimeBriefing();
      setStatus("error");
      setStatusText(caught instanceof Error ? caught.message : "Realtime briefing failed.");
    }
  }

  function stopRealtimeBriefing() {
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    setStatus((current) => (current === "error" ? current : "idle"));
    setStatusText("Briefing ended. Tap to start again whenever you're ready.");
  }

  function submitTypedQuestion(question: string) {
    const clean = question.trim();
    if (!clean || !connected) return;

    appendMessage({ id: `advisor-${Date.now()}`, role: "advisor", text: clean });
    sendRealtimeEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: clean
          }
        ]
      }
    });
    requestAssistantResponse("Answer Sarah's question using only the provided Neo4j client context.");
    setDraft("");
  }

  function requestAssistantResponse(instructions: string) {
    sendRealtimeEvent({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions
      }
    });
  }

  function sendRealtimeEvent(payload: unknown) {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") {
      setStatusText("Realtime data channel is not open yet.");
      return;
    }
    channel.send(JSON.stringify(payload));
  }

  function handleRealtimeEvent(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = typeof event.type === "string" ? event.type : "";
    if (type === "error") {
      const error = event.error as { message?: string } | undefined;
      setStatus("error");
      setStatusText(error?.message ?? "Realtime returned an error.");
      return;
    }

    if (type === "response.created") {
      setStatus("speaking");
      appendAssistantDelta("");
      return;
    }

    if (type === "response.output_text.delta" || type === "response.audio_transcript.delta") {
      const delta = typeof event.delta === "string" ? event.delta : "";
      appendAssistantDelta(delta);
      return;
    }

    if (type === "response.audio_transcript.done") {
      const transcriptText = typeof event.transcript === "string" ? event.transcript : "";
      if (transcriptText) replaceLastEmptyAssistant(transcriptText);
      return;
    }

    if (type === "response.done") {
      setStatus("connected");
      setStatusText("I'm listening — ask me anything about this client.");
    }
  }

  function appendMessage(message: Message) {
    setMessages((current) => [...current, message]);
  }

  function appendAssistantDelta(delta: string) {
    setMessages((current) => {
      const last = current.at(-1);
      if (last?.role === "assistant" && last.id.startsWith("assistant-live-")) {
        return current.map((message, index) =>
          index === current.length - 1 ? { ...message, text: `${message.text}${delta}` } : message
        );
      }
      return [
        ...current,
        {
          id: `assistant-live-${Date.now()}`,
          role: "assistant",
          text: delta
        }
      ];
    });
  }

  function replaceLastEmptyAssistant(text: string) {
    setMessages((current) => {
      const last = current.at(-1);
      if (last?.role === "assistant" && last.id.startsWith("assistant-live-") && !last.text.trim()) {
        return current.map((message, index) => (index === current.length - 1 ? { ...message, text } : message));
      }
      return current;
    });
  }

  return (
    <section className="surface-enter overflow-hidden rounded-[1.9rem] border border-line/80 bg-panel p-5 shadow-diffusion sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Voice briefing
        </p>
        <Badge tone={status === "error" ? "rose" : connected ? "signal" : "neutral"}>{phaseLabel}</Badge>
      </div>

      {/* Voice stage — the orb visibly reacts so the advisor can see it listening and responding. */}
      <div className="mt-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => (connected ? stopRealtimeBriefing() : void startRealtimeBriefing())}
          aria-label={connected ? "Stop briefing" : "Start briefing"}
          className="focus-ring pressable relative flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48"
        >
          {connected ? (
            <>
              <span className="voice-ring absolute inset-0 rounded-full bg-signal/25" />
              <span className="voice-ring voice-ring--delay absolute inset-0 rounded-full bg-signal/20" />
            </>
          ) : null}
          <span
            className={`relative flex h-32 w-32 items-center justify-center rounded-full border text-paper transition-colors sm:h-36 sm:w-36 ${
              status === "error"
                ? "border-rose/40 bg-rose"
                : connected
                  ? "border-signal/40 bg-ink voice-breathe"
                  : status === "connecting"
                    ? "border-line bg-ink/80 voice-breathe"
                    : "border-line bg-ink"
            }`}
          >
            {speaking ? (
              <span className="flex items-end gap-1.5" aria-hidden>
                {[0, 1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className="voice-bar h-8 w-1.5 rounded-full bg-paper"
                    style={{ animationDelay: `${bar * 120}ms` }}
                  />
                ))}
              </span>
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </span>
        </button>

        <p className="mt-6 text-lg font-semibold tracking-tight text-ink">{phaseLabel}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">{statusText}</p>
      </div>

      {/* Live captions — proof that it heard you and is answering. */}
      <div className="mx-auto mt-7 max-w-2xl space-y-3">
        {advisorQuestion ? (
          <div className="caption-enter ml-auto w-fit max-w-[85%] rounded-[1.1rem] rounded-br-md bg-cobalt/10 px-4 py-2.5 text-right text-sm leading-6 text-ink">
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {context.advisor.name}
            </span>
            {advisorQuestion}
          </div>
        ) : null}

        <div
          key={latestAssistant?.id}
          className="caption-enter rounded-[1.4rem] border border-line bg-paper p-4 sm:p-5"
        >
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {speaking ? "Speaking now" : "Briefing"}
          </span>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-ink">
            {latestAssistant?.text || (connected ? "…" : context.briefing)}
            {speaking ? <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink align-middle" /> : null}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3">
        {connected ? (
          <button
            type="button"
            onClick={stopRealtimeBriefing}
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-full border border-line bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-rose/50"
          >
            <Square className="h-4 w-4" />
            End briefing
          </button>
        ) : null}

        {context.suggestedQuestions.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {context.suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => submitTypedQuestion(question)}
                disabled={!connected}
                className="focus-ring pressable rounded-full border border-line bg-paper px-3.5 py-2 text-left text-xs leading-5 text-ink transition-colors hover:border-signal/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            submitTypedQuestion(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!connected}
            placeholder={connected ? "Prefer to type? Ask here" : "Start the briefing to ask by voice or text"}
            className="focus-ring min-h-11 min-w-0 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!connected || !draft.trim()}
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-signal/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Ask
          </button>
        </form>
      </div>
    </section>
  );
}

function buildRealtimeInstructions(context: ClientContext) {
  return [
    "You are Advisors' Advisor, an advisor-only pre-meeting voice assistant.",
    `You are briefing ${context.advisor.name} before a client meeting.`,
    "Use only the client memory context below. Do not invent facts.",
    "If Sarah asks about something not present in context, say the memory graph does not contain that information.",
    "Keep answers concise, specific, and action-oriented.",
    "Never speak to or message the client directly.",
    "",
    "Prepared opening briefing:",
    context.briefing,
    "",
    "Client memory context JSON:",
    JSON.stringify(
      {
        advisor: context.advisor,
        client: context.client,
        upcomingMeeting: context.upcomingMeeting,
        lastMeeting: context.lastMeeting,
        memories: context.memories,
        actions: context.actions,
        graph: context.graph,
        suggestedQuestions: context.suggestedQuestions
      },
      null,
      2
    )
  ].join("\n");
}
