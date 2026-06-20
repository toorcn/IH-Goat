import { NextResponse } from "next/server";
import { buildMemoryQueryVisualResponse } from "@/lib/memory-query-response";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export async function POST(request: Request) {
  const body = (await request.json()) as { clientId?: string; query?: string };

  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const context = await getClientContextWithMemoryLayer(body.clientId);
  return NextResponse.json(buildMemoryQueryVisualResponse(context, body.query ?? ""));
}
