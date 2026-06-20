import { NextResponse } from "next/server";
import { extractMeetingSignals } from "@/lib/demo-data";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";
import type {
  ClientContext,
  ExtractedMemory,
  LiveAnalysisResponse,
  MemoryCategory,
  SilentSuggestion,
  TranscriptTurn
} from "@/lib/types";

export const runtime = "nodejs";

const openAiChatUrl = "https://api.openai.com/v1/chat/completions";

const MEMORY_CATEGORIES: MemoryCategory[] = [
  "Life Event",
  "Emotional Cue",
  "Unresolved Concern",
  "Goal/Objective",
  "Promise/Commitment",
  "Relationship Mention",
  "Referral Opportunity",
  "Follow-Up Action"
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  let context: ClientContext;
  try {
    context = await getClientContextForMeeting(meetingId);
  } catch {
    return NextResponse.json({ error: "Unknown meeting" }, { status: 404 });
  }

  const body = (await request.json()) as { turns?: TranscriptTurn[] };
  const turns = (body.turns ?? []).filter((turn) => turn.text?.trim());

  if (turns.length === 0) {
    return NextResponse.json(emptyAnalysis("openai"));
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackAnalysis(context, turns, "OPENAI_API_KEY is not set — using keyword extraction."));
  }

  try {
    const analysis = await analyzeWithLlm(context, turns);
    return NextResponse.json(analysis);
  } catch (caught) {
    return NextResponse.json(
      fallbackAnalysis(
        context,
        turns,
        `Live analysis fell back to keywords: ${caught instanceof Error ? caught.message : "LLM error"}.`
      )
    );
  }
}

async function analyzeWithLlm(context: ClientContext, turns: TranscriptTurn[]): Promise<LiveAnalysisResponse> {
  const model = process.env.OPENAI_ANALYZE_MODEL ?? "gpt-4o-mini";

  const memorySummary = context.memories.map((memory) => ({
    id: memory.id,
    category: memory.category,
    title: memory.title,
    summary: memory.summary,
    status: memory.status
  }));
  const people = context.graph.nodes
    .filter((node) => node.type !== "Advisor" && node.type !== "Client")
    .map((node) => ({ id: node.id, label: node.label, type: node.type, note: node.note }));

  const system = [
    "You are a silent, advisor-only live-meeting companion for a financial advisor.",
    "You never speak to the client. You analyse a rolling transcript and help the advisor.",
    `The advisor is ${context.advisor.name}. The client is ${context.client.name}.`,
    "Do exactly four things and return STRICT JSON only:",
    "1. attributions: label each transcript turn id as 'advisor' or 'client'. The advisor asks questions and gives guidance; the client shares personal facts, concerns and family details. Use conversational cues.",
    "2. suggestions: 1-3 high-value follow-up QUESTIONS the advisor could ask right now, grounded in what was just said and the client's known memory. Each: {id, title (the question), reason, source, priority: 'high'|'medium'|'low'}.",
    "3. extracted: durable memories worth saving for future reference. Capture life events, emotional cues, unresolved concerns, goals, promises/commitments, OTHER PEOPLE mentioned (family, business, friends) as relationship mentions, and referral opportunities. Each: {category (one of the allowed list), summary, sourceSnippet (verbatim quote from transcript), confidence (0-1), proposedGraphMutation (a Cypher MERGE describing the node/edge to create, e.g. people for the network graph)}.",
    "4. relevant: existing memory ids (from knownMemory) that are relevant to what is being discussed now, each with a short reason.",
    `Allowed categories: ${MEMORY_CATEGORIES.join(", ")}.`,
    "Only extract things actually present in the transcript. Do not invent facts. Return {} fields as empty arrays if nothing applies.",
    'Return JSON shaped: {"attributions":[{"id","speaker"}],"suggestions":[...],"extracted":[...],"relevant":[{"memoryId","reason"}]}.'
  ].join("\n");

  const user = JSON.stringify({
    client: { id: context.client.id, name: context.client.name, riskProfile: context.client.riskProfile },
    knownMemory: memorySummary,
    knownPeople: people,
    transcript: turns.map((turn) => ({ id: turn.id, text: turn.text }))
  });

  const response = await fetch(openAiChatUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Chat completion failed (${response.status})`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    attributions?: Array<{ id?: string; speaker?: string }>;
    suggestions?: Array<Partial<SilentSuggestion>>;
    extracted?: Array<Partial<ExtractedMemory> & { category?: string }>;
    relevant?: Array<{ memoryId?: string; reason?: string }>;
  };

  const turnIds = new Set(turns.map((turn) => turn.id));
  const knownMemoryIds = new Set(context.memories.map((memory) => memory.id));

  return {
    source: "openai",
    attributions: (parsed.attributions ?? [])
      .filter((item) => item.id && turnIds.has(item.id))
      .map((item) => ({
        id: item.id as string,
        speaker: item.speaker === "advisor" ? "advisor" : "client"
      })),
    suggestions: (parsed.suggestions ?? []).slice(0, 3).map((item, index) => ({
      id: `live-suggest-${index}`,
      title: item.title ?? "Ask a follow-up",
      reason: item.reason ?? "Grounded in the live conversation.",
      source: item.source ?? "Live transcript",
      priority: item.priority === "high" || item.priority === "low" ? item.priority : "medium"
    })),
    extracted: (parsed.extracted ?? []).slice(0, 8).map((item, index) => ({
      id: `live-extract-${index}-${turns.length}`,
      clientId: context.client.id,
      category: MEMORY_CATEGORIES.includes(item.category as MemoryCategory)
        ? (item.category as MemoryCategory)
        : "Life Event",
      summary: item.summary ?? "",
      sourceSnippet: item.sourceSnippet ?? "",
      timestamp: new Date().toISOString(),
      confidence: typeof item.confidence === "number" ? clampConfidence(item.confidence) : 0.75,
      proposedGraphMutation: item.proposedGraphMutation ?? ""
    })).filter((item) => item.summary.trim()),
    relevant: (parsed.relevant ?? [])
      .filter((item) => item.memoryId && knownMemoryIds.has(item.memoryId))
      .map((item) => ({ memoryId: item.memoryId as string, reason: item.reason ?? "Relevant to the conversation." }))
  };
}

function fallbackAnalysis(context: ClientContext, turns: TranscriptTurn[], warning: string): LiveAnalysisResponse {
  const signals = extractMeetingSignals(turns.map((turn) => ({
    id: turn.id,
    speaker: turn.speaker,
    text: turn.text,
    timestamp: turn.at
  })));

  // Naive attribution: turns that look like questions are the advisor, the rest the client.
  const attributions = turns.map((turn) => ({
    id: turn.id,
    speaker: turn.text.trim().endsWith("?") ? ("advisor" as const) : ("client" as const)
  }));

  // Surface the highest-salience known memories as "relevant" so the advisor still sees context.
  const relevant = context.memories
    .slice()
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 3)
    .map((memory) => ({ memoryId: memory.id, reason: "High-salience memory for this client." }));

  return {
    source: "demo",
    attributions,
    suggestions: signals.suggestions,
    extracted: signals.extracted,
    relevant,
    warning
  };
}

function emptyAnalysis(source: LiveAnalysisResponse["source"]): LiveAnalysisResponse {
  return { source, attributions: [], suggestions: [], extracted: [], relevant: [] };
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}
