import { NextResponse } from "next/server";
import { searchClientMemory } from "@/lib/neo4j-memory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    clientId?: string;
    query?: string;
    reason?: string;
    limit?: number;
  };

  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const result = await searchClientMemory(body.clientId, query, body.reason ?? "", body.limit ?? 5);
  return NextResponse.json(result);
}
