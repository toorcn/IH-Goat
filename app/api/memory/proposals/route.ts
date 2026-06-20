import { NextResponse } from "next/server";
import { extractMeetingSignals, getMeeting } from "@/lib/demo-data";
import type { TranscriptEvent } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    meetingId?: string;
    clientId?: string;
    events?: TranscriptEvent[];
  };

  if (!body.clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const meeting = body.meetingId ? getMeeting(body.meetingId) : undefined;
  const signals = extractMeetingSignals(body.events ?? [], {
    clientId: body.clientId,
    meetingId: meeting?.id ?? body.meetingId
  });

  return NextResponse.json({
    meetingId: meeting?.id ?? body.meetingId,
    clientId: body.clientId,
    proposals: signals.extracted,
    suggestions: signals.suggestions
  });
}
