"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { AdaptiveMemoryDisplay, CompactRelationshipGraph } from "@/components/adaptive-memory-display";
import type { ClientContext, MemoryQueryVisualResponse } from "@/lib/types";
import { Badge } from "./ui";

type Turn = {
  id: string;
  role: "assistant" | "advisor" | "system";
  text: string;
  visual?: MemoryQueryVisualResponse | null;
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

const LIVE_PREFIX = "live-";
const realtimeCallsUrl = "https://api.openai.com/v1/realtime/calls";

function tryParseJSON(str: string) {
  const cleaned = str.trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt simple repair for trailing commas or unclosed arrays/objects
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;

    let repaired = cleaned;
    if (repaired.endsWith(",")) {
      repaired = repaired.slice(0, -1);
    }

    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += "}";
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += "]";
    }

    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

function VisualChart({ data }: { data: { type?: string; title?: string; labels?: string[]; values?: number[] } }) {
  const type = data.type || "bar";
  const title = data.title || "Chart";
  const labels = data.labels || [];
  const values = data.values || [];
  const max = Math.max(...values, 1);

  if (type === "pie") {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const slices = values.map((val, idx) => {
      const percent = (val / total) * 100;
      const start = values.slice(0, idx).reduce((sum, v) => sum + (v / total) * 100, 0);
      return { label: labels[idx] || "", value: val, start, percent };
    });

    const colors = [
      "oklch(62% 0.16 250)", // cobalt/blue
      "oklch(62% 0.16 140)", // signal/green
      "oklch(67% 0.15 70)",  // amber/yellow
      "oklch(60% 0.15 20)",  // rose/red
      "oklch(50% 0.05 240)"  // neutral/gray
    ];

    return (
      <div className="mt-3 rounded-[1.1rem] border border-line bg-paper p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
          <div className="relative h-32 w-32 shrink-0 rounded-full" style={{
            background: `conic-gradient(${slices.map((slice, idx) => `${colors[idx % colors.length]} ${slice.start}% ${slice.start + slice.percent}%`).join(", ")})`
          }} />
          <div className="space-y-1.5">
            {slices.map((slice, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="font-semibold text-ink">{slice.label}:</span>
                <span className="text-muted">{slice.value} ({slice.percent.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const barColors = [
    "bg-cobalt",
    "bg-signal",
    "bg-amber",
    "bg-rose",
    "bg-muted"
  ];

  return (
    <div className="mt-3 rounded-[1.1rem] border border-line bg-paper p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
      <div className="mt-4 space-y-3">
        {labels.map((label, idx) => {
          const val = values[idx] || 0;
          const pct = Math.min((val / max) * 100, 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-ink">{label}</span>
                <span className="text-muted">{val}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-panel overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColors[idx % barColors.length]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VisualCards({ cards }: { cards: Array<{ title?: string; body?: string; eyebrow?: string; meta?: string }> }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {cards.map((card, idx) => (
        <div key={idx} className="rounded-[1.1rem] border border-line bg-paper p-3.5 shadow-soft transition hover:border-signal/30">
          {card.eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{card.eyebrow}</p>
          ) : null}
          {card.title ? (
            <p className="mt-1 text-sm font-semibold text-ink">{card.title}</p>
          ) : null}
          {card.body ? (
            <p className="mt-1 text-sm leading-5 text-muted">{card.body}</p>
          ) : null}
          {card.meta ? (
            <p className="mt-2 text-[0.68rem] text-muted">{card.meta}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function parseMarkdownTable(block: string) {
  const lines = block.trim().split("\n");
  if (lines.length < 2) return null;

  const parseRow = (line: string) => {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  };

  const headers = parseRow(lines[0]);
  if (!headers.length) return null;

  const secondRow = parseRow(lines[1]);
  const isSeparator = secondRow.length > 0 && secondRow.every((cell) => /^[:-]+$/.test(cell));
  if (!isSeparator) return null;

  const dataRows = lines.slice(2).map(parseRow).filter((row) => row.length > 0);

  return { headers, rows: dataRows };
}

function RenderedTable({ table }: { table: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-[1.1rem] border border-line bg-paper">
      <table className="w-full text-left text-sm text-ink">
        <thead className="bg-panel border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {table.rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-panel/50">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisualGraph({ graph }: { graph: { nodes?: Array<{ id: string; label: string; type?: string; note?: string }>; edges?: Array<{ id: string; source: string; target: string; label?: string }> } }) {
  const formattedGraph = {
    nodes: (graph.nodes || []).map(n => ({
      id: n.id,
      label: n.label,
      type: (n.type || "Person") as "Client" | "Advisor" | "Person" | "Specialist" | "ReferralOpportunity",
      note: n.note || ""
    })),
    edges: (graph.edges || []).map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || ""
    }))
  };

  return <CompactRelationshipGraph graph={formattedGraph} hero={false} />;
}

export function DynamicResponseContent({ text, isLiveTurn, speaking }: { text: string; isLiveTurn: boolean; speaking: boolean }) {
  if (!text) {
    return <p className="mt-2 text-base leading-7 text-ink">…</p>;
  }

  // Split text by markdown code blocks: ```[lang]\n[content]\n```
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g);

  return (
    <div className="mt-2 space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/^```(\w*)\n([\s\S]*?)(?:```|$)/);
          const lang = match ? match[1].toLowerCase() : "";
          const content = match ? match[2] : part.replace(/^```\w*\n?/, "").replace(/```$/, "");

          if (lang === "chart") {
            const parsed = tryParseJSON(content);
            if (parsed) return <VisualChart key={index} data={parsed} />;
          }

          if (lang === "graph") {
            const parsed = tryParseJSON(content);
            if (parsed) return <VisualGraph key={index} graph={parsed} />;
          }

          if (lang === "cards" || lang === "card") {
            const parsed = tryParseJSON(content);
            if (parsed && Array.isArray(parsed)) return <VisualCards key={index} cards={parsed} />;
          }

          return (
            <pre key={index} className="overflow-x-auto rounded-lg bg-panel p-3 text-xs text-muted border border-line">
              <code>{content}</code>
            </pre>
          );
        }

        if (part.includes("|") && part.includes("-")) {
          const table = parseMarkdownTable(part);
          if (table) {
            return <RenderedTable key={index} table={table} />;
          }
        }

        const lines = part.split("\n");
        const listItems: string[] = [];
        const contentElements: React.ReactNode[] = [];

        const flushList = (key: string) => {
          if (listItems.length > 0) {
            contentElements.push(
              <ul key={key} className="my-2 ml-5 list-disc space-y-1.5 text-base leading-7 text-ink">
                {listItems.map((item, idx) => (
                  <li key={idx} className="marker:text-signal">{item}</li>
                ))}
              </ul>
            );
            listItems.length = 0;
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();
          const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
          if (listMatch) {
            listItems.push(listMatch[1]);
          } else {
            flushList(`list-${index}-${lIdx}`);
            if (trimmed) {
              contentElements.push(
                <p key={`p-${index}-${lIdx}`} className="whitespace-pre-wrap text-base leading-7 text-ink">
                  {trimmed}
                </p>
              );
            }
          }
        });
        flushList(`list-final-${index}`);

        return <div key={index} className="space-y-1">{contentElements}</div>;
      })}
      {isLiveTurn && speaking ? (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink align-middle" />
      ) : null}
    </div>
  );
}

export function VoiceBriefing({ context }: { context: ClientContext }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [statusText, setStatusText] = useState(
    "Tap to start. I'll talk you through it — just ask follow-ups out loud."
  );
  const [queryingMemory, setQueryingMemory] = useState(false);
  // Orb minimises once the agent has started responding at least once
  const [orbMinimised, setOrbMinimised] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const counterRef = useRef(0);
  const feedRef = useRef<HTMLDivElement | null>(null);
  // Track the ID of the current live turn so stale closures can target it
  const liveTurnIdRef = useRef<string | null>(null);

  const connected = status === "connected" || status === "speaking";
  const speaking = status === "speaking";

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

  // Auto-scroll feed to bottom whenever turns update
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // Generate a unique ID outside of any setState callback to avoid double-invoke issues
  function nextId(prefix: string) {
    counterRef.current += 1;
    return `${prefix}${counterRef.current}`;
  }

  // Append delta text to the current live turn (identified by liveTurnIdRef)
  const appendLiveDelta = useCallback((id: string, delta: string) => {
    setTurns((current) => {
      return current.map((turn) =>
        turn.id === id ? { ...turn, text: `${turn.text}${delta}` } : turn
      );
    });
  }, []);

  // Replace the live turn's text with the final full transcript
  const finaliseLiveTurn = useCallback((id: string, finalText: string) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.id === id && finalText ? { ...turn, text: finalText } : turn
      )
    );
  }, []);

  // Attach a visual response to the most recent assistant turn
  const attachVisualToLastAssistant = useCallback((visual: MemoryQueryVisualResponse) => {
    setTurns((current) => {
      const lastAssistantIndex = current.reduce<number>(
        (acc, turn, index) => (turn.role === "assistant" ? index : acc),
        -1
      );
      if (lastAssistantIndex === -1) return current;
      return current.map((turn, index) =>
        index === lastAssistantIndex ? { ...turn, visual } : turn
      );
    });
  }, []);

  async function startRealtimeBriefing() {
    if (status === "connecting" || connected) return;
    setStatus("connecting");
    setStatusText("Connecting…");

    try {
      const tokenResponse = await fetch("/api/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        if (audioRef.current) audioRef.current.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      for (const track of stream.getAudioTracks()) peer.addTrack(track, stream);

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;

      // Bind handler fresh at connection time; it uses only refs and stable setters/callbacks
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

      if (!sdpResponse.ok) throw new Error(await sdpResponse.text());
      await peer.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });
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
    liveTurnIdRef.current = null;
    setStatus((current) => (current === "error" ? current : "idle"));
    setStatusText("Briefing ended. Tap to start again whenever you're ready.");
  }

  async function queryMemory(question: string) {
    setQueryingMemory(true);
    try {
      const response = await fetch("/api/memory/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: context.client.id, query: question })
      });
      const payload = (await response.json()) as MemoryQueryVisualResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Unable to query client memory.");
      }
      return payload as MemoryQueryVisualResponse;
    } finally {
      setQueryingMemory(false);
    }
  }

  function requestAssistantResponse(instructions: string) {
    sendRealtimeEvent({
      type: "response.create",
      response: { modalities: ["audio", "text"], instructions }
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
      setOrbMinimised(true);
      // Generate the new turn ID *outside* setTurns to avoid double-invoke issues
      const newId = nextId(LIVE_PREFIX);
      liveTurnIdRef.current = newId;
      setTurns((current) => [
        ...current,
        { id: newId, role: "assistant", text: "" }
      ]);
      return;
    }

    if (
      type === "response.output_text.delta" ||
      type === "response.audio_transcript.delta" ||
      type === "response.output_audio_transcript.delta" ||
      type === "response.text.delta"
    ) {
      const delta = typeof event.delta === "string" ? event.delta : "";
      const id = liveTurnIdRef.current;
      if (id && delta) appendLiveDelta(id, delta);
      return;
    }

    if (
      type === "response.audio_transcript.done" ||
      type === "response.output_audio_transcript.done" ||
      type === "response.text.done" ||
      type === "response.output_text.done"
    ) {
      const finalText = typeof event.transcript === "string" ? event.transcript : "";
      const id = liveTurnIdRef.current;
      if (id && finalText) finaliseLiveTurn(id, finalText);
      liveTurnIdRef.current = null;
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
      sendFunctionOutput(functionCall.callId, { error: "Missing query argument.", displayMode: "missing_info" });
      requestAssistantResponse("Tell Sarah the memory query tool was called without a query.");
      return;
    }

    try {
      const response = await queryMemory(query);
      attachVisualToLastAssistant(response);
      sendFunctionOutput(functionCall.callId, response);
      requestAssistantResponse(
        "Answer Sarah from the query_client_memory tool output. If displayMode is missing_info, mention the suggested next step."
      );
    } catch (caught) {
      sendFunctionOutput(functionCall.callId, {
        error: caught instanceof Error ? caught.message : "Memory query failed."
      });
      requestAssistantResponse("Briefly tell Sarah the memory query failed.");
    }
  }

  function sendFunctionOutput(callId: string, output: unknown) {
    sendRealtimeEvent({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output: JSON.stringify(output) }
    });
  }

  return (
    <section className="surface-enter relative rounded-[1.9rem] border border-line/80 bg-panel shadow-diffusion">
      {/* Floating minimised orb — fixed to top-right of the section */}
      {orbMinimised && (
        <div className="absolute right-4 top-4 z-20 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => (connected ? stopRealtimeBriefing() : void startRealtimeBriefing())}
            aria-label={connected ? "Stop briefing" : "Start briefing"}
            className="focus-ring pressable relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
          >
            {connected && (
              <>
                <span className="voice-ring absolute inset-0 rounded-full bg-signal/25" />
                <span className="voice-ring voice-ring--delay absolute inset-0 rounded-full bg-signal/20" />
              </>
            )}
            <span
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-paper transition-colors ${
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
                <span className="flex items-end gap-0.5" aria-hidden>
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className="voice-bar w-1 rounded-full bg-paper"
                      style={{ height: "14px", animationDelay: `${bar * 120}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </span>
          </button>
          <Badge tone={status === "error" ? "rose" : connected ? "signal" : "neutral"}>
            {phaseLabel}
          </Badge>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 p-5 sm:p-8">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Voice briefing
        </p>
        {!orbMinimised && (
          <Badge tone={status === "error" ? "rose" : connected ? "signal" : "neutral"}>
            {phaseLabel}
          </Badge>
        )}
      </div>

      {/* Large orb — shown until the agent first responds */}
      {!orbMinimised && (
        <div className="flex flex-col items-center px-5 pb-6 text-center sm:px-8">
          <button
            type="button"
            onClick={() => (connected ? stopRealtimeBriefing() : void startRealtimeBriefing())}
            aria-label={connected ? "Stop briefing" : "Start briefing"}
            className="focus-ring pressable relative flex h-40 w-40 items-center justify-center rounded-full sm:h-48 sm:w-48"
          >
            {connected && (
              <>
                <span className="voice-ring absolute inset-0 rounded-full bg-signal/25" />
                <span className="voice-ring voice-ring--delay absolute inset-0 rounded-full bg-signal/20" />
              </>
            )}
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

          {connected && (
            <button
              type="button"
              onClick={stopRealtimeBriefing}
              className="focus-ring pressable mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-rose/50"
            >
              <Square className="h-4 w-4" />
              End briefing
            </button>
          )}
        </div>
      )}

      {/* Streaming output area — shows agent responses with text + rich visual inline */}
      <div
        ref={feedRef}
        className="max-h-[65vh] min-h-[12rem] overflow-y-auto px-5 pb-8 sm:px-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {turns.length === 0 && !queryingMemory ? (
          /* Empty state — shown before agent speaks */
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted">
              {status === "connecting"
                ? "Connecting to your briefing assistant…"
                : status === "error"
                  ? "Something went wrong. Try tapping the mic again."
                  : "Tap the microphone to start. Agent responses will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {turns.map((turn, index) => {
              const isLast = index === turns.length - 1;
              const isLiveTurn = turn.id === liveTurnIdRef.current;

              if (turn.role === "advisor") {
                return (
                  <div
                    key={turn.id}
                    className="caption-enter ml-auto w-fit max-w-[85%] rounded-[1.1rem] rounded-br-md bg-cobalt/10 px-4 py-2.5 text-right text-sm leading-6 text-ink"
                  >
                    <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      {context.advisor.name}
                    </span>
                    {turn.text}
                  </div>
                );
              }

              if (turn.role === "system") {
                return (
                  <div
                    key={turn.id}
                    className="caption-enter rounded-[1rem] border border-amber/30 bg-amber/10 px-4 py-2.5 text-sm leading-6 text-ink"
                  >
                    {turn.text}
                  </div>
                );
              }

              /* Agent turn — streams transcript text; visual content (table, graph, cards) renders inline below */
              return (
                <div key={turn.id} className="caption-enter space-y-3">
                  {/* Text stream */}
                  {(turn.text || (isLast && connected)) ? (
                    <div className="rounded-[1.4rem] border border-line bg-paper p-4 sm:p-5">
                      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        {isLiveTurn && speaking ? "Speaking now" : "Agent"}
                      </span>
                      <DynamicResponseContent
                        text={turn.text}
                        isLiveTurn={isLiveTurn}
                        speaking={speaking}
                      />
                    </div>
                  ) : null}

                  {/* Rich visual output — table, graph, cards, timeline rendered inline */}
                  {turn.visual ? (
                    <div className="caption-enter">
                      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                        Latest answer
                      </p>
                      <AdaptiveMemoryDisplay response={turn.visual} variant="hero" />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {queryingMemory && (
              <div className="caption-enter flex items-center gap-2 rounded-[1rem] border border-line bg-paper px-4 py-3 text-sm text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
                Querying client memory…
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
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

  const item =
    event.item && typeof event.item === "object" ? (event.item as Record<string, unknown>) : null;
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
    "CRITICAL VISUAL DIRECTIVE FOR TEXT OUTPUT:",
    "Your audio output must remain conversational, professional, and descriptive.",
    "However, your text output must NEVER contain conversational greetings, introductory filler, or spoken dialogue (e.g. do NOT output 'Sure, I can help with that' or 'Here is the allocation').",
    "Instead, your text response must consist ONLY of the corresponding structured visual representation of what is being spoken, using the most suitable format below:",
    "",
    "1. Bulleted Summary: If you are explaining a concept or speaking conversationally (such as the opening greeting/briefing), your text output must consist ONLY of a simple bulleted summary of the key points of what you are saying (e.g., lines starting with '- ').",
    "2. Tables: If you are presenting structured status, dates, or comparisons, output ONLY a standard markdown table. E.g.",
    "| Task | Due | Status |",
    "|---|---|---|",
    "| Will Update | 2026-06-30 | Pending |",
    "3. Cards: If you are presenting distinct memories, topics, or notes, output ONLY a code block with language 'cards' containing a JSON array. E.g.",
    "```cards",
    "[",
    "  {\"title\": \"Will Update\", \"eyebrow\": \"Concern\", \"body\": \"Needs to update will soon.\", \"meta\": \"Source: meeting\"}",
    "]",
    "```",
    "4. Charts: If you are presenting allocations, metrics, or financial breakdowns, output ONLY a code block with language 'chart' containing a JSON object. E.g.",
    "```chart",
    "{",
    "  \"type\": \"bar\" | \"pie\",",
    "  \"title\": \"Asset Allocation\",",
    "  \"labels\": [\"Equities\", \"Bonds\", \"Cash\"],",
    "  \"values\": [60, 30, 10]",
    "}",
    "```",
    "5. Graphs: If you are presenting family connections, relationships, or specialist networks, output ONLY a code block with language 'graph' containing a JSON object. E.g.",
    "```graph",
    "{",
    "  \"nodes\": [",
    "    {\"id\": \"node1\", \"label\": \"Sarah\", \"type\": \"Advisor\", \"note\": \"Firm advisor\"},",
    "    {\"id\": \"node2\", \"label\": \"Tan\", \"type\": \"Client\", \"note\": \"Wealth client\"}",
    "  ],",
    "  \"edges\": [",
    "    {\"id\": \"edge1\", \"source\": \"node1\", \"target\": \"node2\", \"label\": \"manages\"}",
    "  ]",
    "}",
    "```",
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
