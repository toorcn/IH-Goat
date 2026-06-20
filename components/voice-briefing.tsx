"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  GitFork,
  ListChecks,
  Mic,
  Quote,
  Send,
  Sparkles,
  Square
} from "lucide-react";
import type { ClientContext, MemoryQueryVisualResponse } from "@/lib/types";
import { Badge, EmptyState } from "./ui";

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
  const [visualResponse, setVisualResponse] = useState<MemoryQueryVisualResponse | null>(null);
  const [queryingMemory, setQueryingMemory] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageCounterRef = useRef(0);

  const connected = status === "connected" || status === "speaking";
  const speaking = status === "speaking";

  const transcript = useMemo(() => messages.map((message) => message.text).join(" "), [messages]);
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
          instructions: buildRealtimeInstructions(context),
          tools: [queryClientMemoryTool],
          tool_choice: "auto"
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
      channel.onmessage = (event) => void handleRealtimeEvent(event.data);
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

  async function submitTypedQuestion(question: string) {
    const clean = question.trim();
    if (!clean || queryingMemory) return;

    appendMessage({ id: nextMessageId("advisor"), role: "advisor", text: clean });
    setDraft("");

    try {
      const response = await queryMemory(clean);
      appendMessage({ id: nextMessageId("assistant-memory"), role: "assistant", text: response.answer });
    } catch (caught) {
      appendMessage({
        id: nextMessageId("system-memory"),
        role: "system",
        text: caught instanceof Error ? caught.message : "Memory query failed."
      });
    }

    if (connected) {
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
      requestAssistantResponse("Answer Sarah's question using query_client_memory when current client memory is needed.");
    }
  }

  async function queryMemory(question: string) {
    setQueryingMemory(true);
    try {
      const response = await fetch("/api/memory/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: context.client.id,
          query: question
        })
      });

      const payload = (await response.json()) as MemoryQueryVisualResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Unable to query client memory.");
      }
      setVisualResponse(payload as MemoryQueryVisualResponse);
      return payload as MemoryQueryVisualResponse;
    } finally {
      setQueryingMemory(false);
    }
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

  async function handleRealtimeEvent(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = typeof event.type === "string" ? event.type : "";
    const functionCall = extractFunctionCall(event);
    if (functionCall?.name === "query_client_memory") {
      await answerFunctionCall(functionCall);
      return;
    }

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

  async function answerFunctionCall(functionCall: { callId: string; name: string; argumentsJson: string }) {
    let parsed: { query?: string };
    try {
      parsed = JSON.parse(functionCall.argumentsJson) as { query?: string };
    } catch {
      parsed = {};
    }

    const query = parsed.query?.trim();
    if (!query) {
      sendFunctionOutput(functionCall.callId, {
        error: "Missing query argument.",
        displayMode: "missing_info"
      });
      requestAssistantResponse("Tell Sarah the memory query tool was called without a query.");
      return;
    }

    try {
      const response = await queryMemory(query);
      sendFunctionOutput(functionCall.callId, response);
      requestAssistantResponse(
        "Answer Sarah from the query_client_memory tool output. If displayMode is missing_info, mention the suggested next step."
      );
    } catch (caught) {
      sendFunctionOutput(functionCall.callId, {
        error: caught instanceof Error ? caught.message : "Memory query failed."
      });
      requestAssistantResponse("Briefly tell Sarah the memory query failed and suggest using typed fallback.");
    }
  }

  function sendFunctionOutput(callId: string, output: unknown) {
    sendRealtimeEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(output)
      }
    });
  }

  function appendMessage(message: Message) {
    setMessages((current) => [...current, message]);
  }

  function nextMessageId(prefix: string) {
    messageCounterRef.current += 1;
    return `${prefix}-${messageCounterRef.current}`;
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
          id: nextMessageId("assistant-live"),
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
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
                    onClick={() => void submitTypedQuestion(question)}
                    disabled={queryingMemory}
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
                void submitTypedQuestion(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={queryingMemory}
                placeholder={`Ask about ${context.client.name}`}
                className="focus-ring min-h-11 min-w-0 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={queryingMemory || !draft.trim()}
                className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-signal/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {queryingMemory ? "Asking" : "Ask"}
              </button>
            </form>
          </div>
        </div>

        <aside className="mt-6 space-y-4 rounded-[1.2rem] border border-line bg-paper p-3 sm:p-4 xl:mt-6">
          <AdaptiveMemoryDisplay response={visualResponse} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Transcript size</p>
            {transcript ? (
              <p className="mt-1 text-sm text-ink">{transcript.length} characters</p>
            ) : (
              <EmptyState>No transcript yet.</EmptyState>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdaptiveMemoryDisplay({ response }: { response: MemoryQueryVisualResponse | null }) {
  if (!response) {
    return (
      <div className="rounded-lg border border-line bg-panel p-3">
        <p className="text-sm font-semibold text-ink">Adaptive memory panel</p>
        <EmptyState>Ask a typed or voice question to render client memory here.</EmptyState>
      </div>
    );
  }

  const icon = displayModeIcon(response.displayMode);

  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Adaptive view</p>
          <h3 className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
            {icon}
            {displayModeLabel(response.displayMode)}
          </h3>
        </div>
        <Badge tone={response.source === "neo4j" ? "signal" : "neutral"}>{response.source}</Badge>
      </div>

      <p className="text-sm leading-6 text-ink">{response.answer}</p>

      {response.missingInfo ? (
        <div className="rounded-lg border border-amber/40 bg-amber/15 p-3">
          <p className="text-sm font-semibold text-ink">{response.missingInfo.title}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{response.missingInfo.reason}</p>
          <p className="mt-2 text-sm leading-5 text-ink">{response.missingInfo.suggestedNextStep}</p>
        </div>
      ) : null}

      {response.cards?.length ? (
        <div className="space-y-2">
          {response.cards.slice(0, 4).map((card) => (
            <div key={card.id} className="rounded-lg border border-line bg-paper p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{card.eyebrow}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{card.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{card.body}</p>
              {card.meta ? <p className="mt-2 text-xs text-muted">{card.meta}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.rows?.length ? (
        <div className="overflow-hidden rounded-lg border border-line">
          {response.rows.slice(0, 5).map((row) => (
            <div key={`${row.label}-${row.value}`} className="border-b border-line bg-paper p-3 last:border-b-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className="text-xs font-semibold text-muted">{row.value}</p>
              </div>
              {row.detail ? <p className="mt-1 text-sm leading-5 text-muted">{row.detail}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.graph ? (
        <div className="rounded-lg border border-line bg-paper p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Relationship graph</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {response.graph.nodes.map((node) => (
              <span key={node.id} className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-ink">
                {node.label}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {response.graph.edges.slice(0, 5).map((edge) => (
              <p key={edge.id} className="text-xs leading-5 text-muted">
                {edge.source} &gt; {edge.label} &gt; {edge.target}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {response.actions?.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Next steps</p>
          {response.actions.slice(0, 3).map((action) => (
            <div key={action.id} className="rounded-lg border border-line bg-paper p-3">
              <p className="text-sm font-semibold text-ink">{action.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted">{action.reason}</p>
              {action.dueAt || action.status ? (
                <p className="mt-2 text-xs font-semibold text-muted">
                  {[action.status, action.dueAt].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {response.citations.length ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <Quote className="h-3.5 w-3.5" />
            Evidence
          </p>
          {response.citations.slice(0, 3).map((citation) => (
            <blockquote key={citation.id} className="rounded-lg border border-line bg-paper p-3 text-sm leading-5 text-muted">
              <span className="font-semibold text-ink">{citation.label}: </span>
              {citation.snippet}
            </blockquote>
          ))}
        </div>
      ) : null}

      {response.warning ? <p className="text-xs leading-5 text-amber">{response.warning}</p> : null}
    </div>
  );
}

function displayModeLabel(mode: MemoryQueryVisualResponse["displayMode"]) {
  const labels: Record<MemoryQueryVisualResponse["displayMode"], string> = {
    brief: "Brief answer",
    cards: "Memory cards",
    table: "Action table",
    graph: "Relationship graph",
    timeline: "Timeline",
    recommendation: "Recommendation",
    missing_info: "Missing info"
  };
  return labels[mode];
}

function displayModeIcon(mode: MemoryQueryVisualResponse["displayMode"]) {
  if (mode === "recommendation") return <Sparkles className="h-4 w-4 text-signal" />;
  if (mode === "graph") return <GitFork className="h-4 w-4 text-cobalt" />;
  if (mode === "table") return <ListChecks className="h-4 w-4 text-signal" />;
  if (mode === "timeline") return <CalendarClock className="h-4 w-4 text-amber" />;
  if (mode === "missing_info") return <AlertCircle className="h-4 w-4 text-amber" />;
  return <Quote className="h-4 w-4 text-muted" />;
}

function extractFunctionCall(event: Record<string, unknown>) {
  const type = typeof event.type === "string" ? event.type : "";
  if (type === "response.function_call_arguments.done") {
    return {
      callId: stringField(event.call_id),
      name: stringField(event.name),
      argumentsJson: stringField(event.arguments)
    };
  }

  const item = event.item && typeof event.item === "object" ? (event.item as Record<string, unknown>) : null;
  if (type === "response.output_item.done" && item?.type === "function_call") {
    return {
      callId: stringField(item.call_id),
      name: stringField(item.name),
      argumentsJson: stringField(item.arguments)
    };
  }

  return null;
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

const queryClientMemoryTool = {
  type: "function",
  name: "query_client_memory",
  description:
    "Query the advisor's client memory graph for client-specific facts, follow-ups, relationships, referral recommendations, or missing information.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The advisor's client-specific memory question."
      }
    },
    required: ["query"],
    additionalProperties: false
  }
};

function buildRealtimeInstructions(context: ClientContext) {
  return [
    "You are Advisors' Advisor, an advisor-only pre-meeting voice assistant.",
    `You are briefing ${context.advisor.name} before a client meeting.`,
    "Use only the client memory context below. Do not invent facts.",
    "Call query_client_memory for client-specific follow-up questions, referrals, relationships, actions, timelines, or missing information.",
    "If the tool returns missing_info, say what is missing and suggest the next step from the tool output.",
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
