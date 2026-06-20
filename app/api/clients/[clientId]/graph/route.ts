import { NextResponse } from "next/server";
import { getClientContext } from "@/lib/demo-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  try {
    return NextResponse.json(getClientContext(clientId).graph);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown client" },
      { status: 404 }
    );
  }
}
