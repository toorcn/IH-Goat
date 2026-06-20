import { NextResponse } from "next/server";

const realtimeClientSecretUrl = "https://api.openai.com/v1/realtime/client_secrets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2";
  const body = await readOptionalJson(request);

  if (!apiKey) {
    return NextResponse.json({
      mode: "demo",
      model,
      client_secret: null,
      message:
        "OPENAI_API_KEY is not set. Configure it to start an OpenAI Realtime WebRTC briefing."
    });
  }

  const response = await fetch(realtimeClientSecretUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      expires_after: {
        anchor: "created_at",
        seconds: 600
      },
      session: {
        type: "realtime",
        model,
        instructions: body.instructions ?? buildDefaultInstructions(),
        reasoning: {
          effort: "low"
        },
        audio: {
          output: {
            voice: body.voice ?? "alloy"
          }
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      {
        error: "Failed to create realtime session",
        detail
      },
      { status: response.status }
    );
  }

  const clientSecret = await response.json();
  const value = extractClientSecretValue(clientSecret);
  const expiresAt = extractClientSecretExpiry(clientSecret);

  return NextResponse.json({
    ...clientSecret,
    value,
    expires_at: expiresAt,
    client_secret: {
      value,
      expires_at: expiresAt
    }
  });
}

async function readOptionalJson(request: Request) {
  try {
    return (await request.json()) as { voice?: string; instructions?: string };
  } catch {
    return {};
  }
}

function extractClientSecretValue(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.value === "string") return record.value;
  const nested = record.client_secret;
  if (nested && typeof nested === "object" && typeof (nested as Record<string, unknown>).value === "string") {
    return (nested as Record<string, string>).value;
  }
  return null;
}

function extractClientSecretExpiry(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.expires_at === "number") return record.expires_at;
  const nested = record.client_secret;
  if (nested && typeof nested === "object" && typeof (nested as Record<string, unknown>).expires_at === "number") {
    return (nested as Record<string, number>).expires_at;
  }
  return null;
}

function buildDefaultInstructions() {
  return [
    "You are an advisor-only pre-meeting assistant for Advisors' Advisor.",
    "Answer only from the provided client memory context.",
    "If the context does not contain the answer, say that the memory graph does not contain it.",
    "Keep responses brief, concrete, and useful for the advisor.",
    "Do not address, message, or advise the client directly."
  ].join(" ");
}
