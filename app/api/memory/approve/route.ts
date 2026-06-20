import { NextResponse } from "next/server";
import type { ExtractedMemory } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { memory?: ExtractedMemory };

  if (!body.memory) {
    return NextResponse.json({ error: "Missing memory payload" }, { status: 400 });
  }

  return NextResponse.json({
    status: "approved",
    memory: body.memory,
    writeMode: "demo",
    message: "In production this approval writes a graph mutation to Neo4j."
  });
}
