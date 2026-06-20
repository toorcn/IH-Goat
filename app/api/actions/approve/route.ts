import { NextResponse } from "next/server";
import type { ActionItem } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: ActionItem };

  if (!body.action) {
    return NextResponse.json({ error: "Missing action payload" }, { status: 400 });
  }

  return NextResponse.json({
    status: "approved",
    action: body.action,
    sendMode: "advisor_approval_required"
  });
}
