"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, PlugZap, Send, Square } from "lucide-react";
import type { ClientContext } from "@/lib/types";
import { Badge, EmptyState, Panel } from "./ui";

type Message = {
  id: string;
  role: "assistant" | "advisor" | "system";
  text: string;
};

type RealtimeStatus = "idle" | "connecting" | "connected" | "speaking" | "demo" | "error";

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
  const [statusText, setStatusText] = useState("Ready to start Realtime briefing.");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const transcript = useMemo(() => messages.map((message) => message.text).join(" "), [messages]);
  const connected = status === "connected" || status === "speaking";
  const demoMode = status === "demo";
  const canAsk = connected || demoMode;

  useEffect(() => {
    return () => {
      channelRef.current?.close();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        audioRef.current.remove();
      }
    };
  }, []);

  async function startRealtimeBriefing() {
    if (status === "connecting" || connected) return;
    setStatus("connecting");
    setStatusText("Minting ephemeral token and opening WebRTC session...");

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
      if (token.mode === "demo" && !ephemeralKey) {
        setStatus("demo");
        setStatusText("Demo Q&A is active because OPENAI_API_KEY is not configured.");
        appendMessage({
          id: `system-demo-${Date.now()}`,
          role: "system",
          text: "Realtime voice is unavailable in this environment, but typed Q&A remains grounded in the same client memory graph."
        });
        return;
      }
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
        setStatusText("Realtime connected. Sarah can ask follow-up questions by voice.");
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
    setStatusText("Realtime session stopped.");
  }

  function submitTypedQuestion(question: string) {
    const clean = question.trim();
    if (!clean || !canAsk) return;

    appendMessage({ id: `advisor-${Date.now()}`, role: "advisor", text: clean });
    if (demoMode) {
      appendMessage({
        id: `assistant-demo-${Date.now()}`,
        role: "assistant",
        text: answerDemoQuestion(clean, context)
      });
      setDraft("");
      return;
    }

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
      setStatusText("Realtime connected. Sarah can ask follow-up questions by voice.");
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
    <Panel
      title="Pre-Meeting Voice Briefing"
      eyebrow="OpenAI Realtime"
      action={<Badge tone={status === "error" ? "rose" : connected || demoMode ? "signal" : "neutral"}>{status}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startRealtimeBriefing()}
              disabled={status === "connecting" || connected}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlugZap className="h-4 w-4" />
              {status === "connecting" ? "Connecting" : "Start Realtime"}
            </button>
            <button
              type="button"
              onClick={stopRealtimeBriefing}
              disabled={!connected && status !== "connecting"}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-rose/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
            <div className="inline-flex items-center gap-2 rounded-md border border-signal/30 bg-signal/10 px-3 py-2 text-sm font-semibold text-ink">
              <Mic className="h-4 w-4" />
              Mic routed to Realtime
            </div>
          </div>

          <div className="rounded-lg border border-line bg-paper p-3 text-sm leading-6 text-muted">
            {statusText}
          </div>

          <div className="max-h-[420px] space-y-3 overflow-auto rounded-lg border border-line bg-paper p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-3 ${
                  message.role === "assistant"
                    ? "bg-panel text-ink"
                    : message.role === "advisor"
                      ? "bg-cobalt/10 text-ink"
                      : "bg-amber/10 text-ink"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {message.role === "assistant" ? "Assistant" : message.role === "advisor" ? "Sarah" : "System"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text || "..."}</p>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitTypedQuestion(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!canAsk}
              placeholder={canAsk ? "Optional typed test: Who should I introduce Mr. Tan to?" : "Start Realtime to ask"}
              className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!canAsk || !draft.trim()}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-signal/80 disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={() => submitTypedQuestion(question)}
                disabled={!canAsk}
                className="focus-ring w-full rounded-md border border-line bg-panel px-3 py-2 text-left text-sm leading-5 text-ink transition hover:border-signal/50 disabled:cursor-not-allowed disabled:opacity-60"
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

function buildRealtimeInstructions(context: ClientContext) {
  return [
    "You are Advisors' Advisor, an advisor-only pre-meeting voice assistant.",
    "You are briefing Sarah Lim before a client meeting.",
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

function answerDemoQuestion(question: string, context: ClientContext) {
  const normalized = question.toLowerCase();
  const openItems = context.memories.filter((memory) => memory.status === "open");

  if (normalized.includes("introduce") || normalized.includes("who") || normalized.includes("referral")) {
    return [
      "Best grounded options:",
      "Evelyn Ng for estate planning because Mr. Tan's will update is unresolved.",
      "Marcus Lee if he specifically wants a lawyer.",
      "Mr. Ong is only a watchlist lead; ask Mr. Tan for permission before any outreach."
    ].join("\n");
  }

  if (normalized.includes("last") || normalized.includes("discuss")) {
    return [
      `Last meeting was ${context.lastMeeting.startsAt.slice(0, 10)}.`,
      "They discussed estate planning, an unresolved will update, policy renewal hesitation, and Sarah promised to send an estate planning guide."
    ].join(" ");
  }

  if (normalized.includes("open") || normalized.includes("concern") || normalized.includes("remember")) {
    return openItems
      .map((memory) => `${memory.category}: ${memory.summary}`)
      .join("\n");
  }

  if (normalized.includes("start") || normalized.includes("open with") || normalized.includes("opener")) {
    return "Open by congratulating Mr. Tan on Jia En getting into NUS, then bridge into whether that milestone changes his family transition timeline.";
  }

  if (normalized.includes("follow") || normalized.includes("action")) {
    return context.actions
      .map((action) => `${action.title} - due ${action.dueAt}`)
      .join("\n");
  }

  return "The memory graph does not contain a specific answer to that. Known context covers Jia En's NUS milestone, will planning, policy renewal hesitation, estate planning follow-ups, Evelyn Ng, Marcus Lee, and Mr. Ong.";
}
