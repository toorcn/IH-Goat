import { NextResponse } from "next/server";
import { queryClientMemory } from "@/lib/neo4j-memory";

export async function POST(request: Request) {
  const body = (await request.json()) as { clientId?: string; query?: string };

  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  return NextResponse.json(await queryClientMemory(body.clientId, body.query ?? ""));
}
