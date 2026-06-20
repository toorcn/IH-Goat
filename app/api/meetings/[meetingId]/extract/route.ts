import { NextResponse } from "next/server";
import { extractMeetingSignals } from "@/lib/demo-data";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";
import type { TranscriptEvent, SilentSuggestion, ExtractedMemory } from "@/lib/types";

export const runtime = "nodejs";

const openAiChatUrl = "https://api.openai.com/v1/chat/completions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;
  let context;
  try {
    context = await getClientContextForMeeting(meetingId);
  } catch {
    return NextResponse.json({ error: "Unknown meeting" }, { status: 404 });
  }

  const body = (await request.json()) as { events?: TranscriptEvent[] };
  const events = body.events ?? [];

  if (events.length === 0) {
    return NextResponse.json({
      meetingId,
      suggestions: [],
      extracted: [],
      visualResponse: null
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Fallback to deterministic signals if no API key
    const signals = extractMeetingSignals(events);
    let query = "";
    const text = events.map(e => e.text).join(" ").toLowerCase();
    if (text.includes("will") || text.includes("estate")) {
      query = "will planning";
    } else if (text.includes("nus") || text.includes("jia")) {
      query = "Jia En";
    } else if (text.includes("lawyer") || text.includes("evelyn") || text.includes("marcus")) {
      query = "referral";
    } else if (text.includes("guide") || text.includes("send")) {
      query = "action";
    }

    let visualResponse = null;
    if (query) {
      const { buildMemoryQueryVisualResponse } = await import("@/lib/memory-query-response");
      visualResponse = buildMemoryQueryVisualResponse(context, query);
    }

    return NextResponse.json({
      meetingId,
      ...signals,
      visualResponse,
      warning: "OPENAI_API_KEY is not set, showing fallback mock memory updates."
    });
  }

  const clientName = context.client.name;
  const clientId = context.client.id;

  // Format existing memories as context for the LLM
  const existingMemoriesSummary = context.memories
    .map(
      (m) =>
        `- Category: ${m.category}, Title: ${m.title}, Summary: ${m.summary}, Status: ${m.status}`
    )
    .join("\n");

  const existingGraphNodes = context.graph.nodes
    .map((n) => `- Node ID: ${n.id}, Name/Label: ${n.label}, Type: ${n.type}, Note: ${n.note || "N/A"}`)
    .join("\n");

  const existingGraphEdges = context.graph.edges
    .map((e) => `- ${e.source} -[${e.label}]-> ${e.target}`)
    .join("\n");

  const systemInstructions = `You are a real-time meeting companion assistant for a financial advisor named ${context.advisor.name}.
Your job is to read a live transcript stream of a meeting with client ${clientName} (ID: ${clientId}) and:
1. Provide "Silent Suggestions" for the advisor on the fly. These suggestions must help the advisor navigate the meeting, follow up on unresolved concerns, address objectives, congratulate on life events, or identify referral opportunities.
2. Extract new "Candidate Memories" that should be captured from the discussion.
3. Identify if the current transcript matches or references any existing memory or relationship context in Neo4j. If so, return a search keyword/query to pull the relevant visual display.

Here is the current known memory context of client ${clientName}:
---
Existing Memories:
${existingMemoriesSummary}

Existing Relationship Graph Nodes:
${existingGraphNodes}

Existing Relationship Graph Edges:
${existingGraphEdges}
---

Your response MUST be a JSON object containing three fields:
- "suggestions": An array of silent suggestions. Each suggestion must have:
  - "id": A unique string ID starting with "suggest-live-" followed by a short unique hash/number
  - "title": A short, action-oriented title (e.g. "Ask about NUS transition")
  - "reason": Rationale for this suggestion
  - "source": The memory item, relationship, or context source this relates to (e.g., "Daughter Jia En NUS milestone")
  - "priority": "high", "medium", or "low"
- "extracted": An array of candidate memories. Each memory must have:
  - "id": A unique string ID starting with "extract-live-" followed by a short unique hash/number
  - "clientId": "${clientId}"
  - "category": Must be exactly one of: "Life Event", "Emotional Cue", "Unresolved Concern", "Goal/Objective", "Promise/Commitment", "Relationship Mention", "Referral Opportunity", "Follow-Up Action"
  - "summary": A brief, professional description of the fact/action/concern extracted
  - "sourceSnippet": The exact/matching transcript statement(s) from the meeting transcript
  - "confidence": A float between 0.0 and 1.0
  - "proposedGraphMutation": A Cypher statement to merge/link this information in the Neo4j graph. E.g.
    "MERGE (c:Client {id: '${clientId}'})-[:HAS_LIFE_EVENT]->(:LifeEvent {title: 'Jia En starting classes'})" or similar.
- "query": A string representing the search query for the client's memory graph if the transcript matches or references any existing memory or relationship. (e.g. "will planning", "Jia En", "policy renewal", "referral", "progress"). If no existing memory or relationship is referenced, return null.

Rules:
- Be highly selective. Only suggest/extract things that are highly relevant to the advisor's relationship with ${clientName}.
- Ground suggestions in existing unresolved concerns or new life events mentioned.
- Do not repeat suggestions or memories that are already known/resolved.
- Format all response fields exactly as requested in a valid JSON object.`;

  const userContent = `Here is the current meeting transcript events (chronological order):
${events.map((e) => `[${e.speaker}]: ${e.text}`).join("\n")}

Extract signals, provide suggestions, and output any matching memory query now.`;

  try {
    const response = await fetch(openAiChatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_COMPLETIONS_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstructions },
          { role: "user", content: userContent }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI completions API error: ${detail}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content) as {
      suggestions?: SilentSuggestion[];
      extracted?: ExtractedMemory[];
      query?: string | null;
    };

    let visualResponse = null;
    if (result.query) {
      const { buildMemoryQueryVisualResponse } = await import("@/lib/memory-query-response");
      visualResponse = buildMemoryQueryVisualResponse(context, result.query);
    }

    return NextResponse.json({
      meetingId,
      suggestions: result.suggestions ?? [],
      extracted: result.extracted ?? [],
      visualResponse
    });
  } catch (error) {
    console.error("Failed to extract signals from OpenAI, falling back to mock:", error);
    const signals = extractMeetingSignals(events);
    let query = "";
    const text = events.map(e => e.text).join(" ").toLowerCase();
    if (text.includes("will") || text.includes("estate")) {
      query = "will planning";
    } else if (text.includes("nus") || text.includes("jia")) {
      query = "Jia En";
    } else if (text.includes("lawyer") || text.includes("evelyn") || text.includes("marcus")) {
      query = "referral";
    } else if (text.includes("guide") || text.includes("send")) {
      query = "action";
    }

    let visualResponse = null;
    if (query) {
      const { buildMemoryQueryVisualResponse } = await import("@/lib/memory-query-response");
      visualResponse = buildMemoryQueryVisualResponse(context, query);
    }

    return NextResponse.json({
      meetingId,
      ...signals,
      visualResponse,
      warning: error instanceof Error ? error.message : "Error querying OpenAI"
    });
  }
}
