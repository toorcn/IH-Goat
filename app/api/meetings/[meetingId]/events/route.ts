import { NextResponse } from "next/server";
import { getMeeting } from "@/lib/demo-data";
import type { TranscriptEvent } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;
  const meeting = getMeeting(meetingId);

  if (!meeting) {
    return NextResponse.json({ error: "Unknown meeting" }, { status: 404 });
  }

  const body = (await request.json()) as { events?: TranscriptEvent[] };

  return NextResponse.json({
    meetingId,
    accepted: body.events?.length ?? 0,
    mode: "demo-memory"
  });
}
