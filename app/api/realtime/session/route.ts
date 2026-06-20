import { NextResponse } from "next/server";

const realtimeClientSecretUrl = "https://api.openai.com/v1/realtime/client_secrets";

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
        "OPENAI_API_KEY is not set. The app will use browser speech synthesis and typed Q&A fallback."
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
        instructions:
          body.instructions ??
          "You are an advisor-only meeting assistant. Answer only from provided client memory. If memory is missing, say so clearly.",
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

  return NextResponse.json({
    ...clientSecret,
    client_secret: {
      value: clientSecret.value,
      expires_at: clientSecret.expires_at
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
