import { NextResponse } from "next/server";
import { client } from "@/lib/demo-data";
import { getMemoryLayerDiagnostics } from "@/lib/neo4j-memory";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") ?? client.id;

  return NextResponse.json(await getMemoryLayerDiagnostics(clientId));
}
