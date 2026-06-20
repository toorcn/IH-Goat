import { NextResponse } from "next/server";
import { saveApprovedAction } from "@/lib/neo4j-memory";
import type { ActionItem } from "@/lib/types";

type ActionRequest = {
  action?: Partial<ActionItem>;
  id?: string;
  clientId?: string;
  meetingId?: string;
  title?: string;
  actionType?: string;
  dueAt?: string;
  owner?: string;
  status?: ActionItem["status"];
  draftText?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ActionRequest;
  const candidate = body.action ?? body;
  const clientId = candidate.clientId ?? body.clientId;
  const title = candidate.title ?? body.title;

  if (!clientId || !title) {
    return NextResponse.json({ error: "Missing clientId or title" }, { status: 400 });
  }

  const action: ActionItem = {
    id: candidate.id ?? `action-${crypto.randomUUID()}`,
    clientId,
    meetingId: candidate.meetingId ?? body.meetingId ?? "meeting-2026-06-20-tan",
    title,
    actionType: candidate.actionType ?? body.actionType ?? "follow_up",
    dueAt: candidate.dueAt ?? body.dueAt ?? nextIsoDate(),
    owner: candidate.owner ?? body.owner ?? "Sarah Lim",
    status: candidate.status ?? "pending",
    draftText: candidate.draftText ?? body.draftText
  };

  const writeResult = await saveApprovedAction(action);

  return NextResponse.json({
    status: "created",
    action,
    sendMode: "advisor_approval_required",
    ...writeResult
  });
}

function nextIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
