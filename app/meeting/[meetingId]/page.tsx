import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { MeetingCompanion } from "@/components/meeting-companion";
import { AppShell, Badge, PrimaryButton } from "@/components/ui";
import { getMeeting } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function MeetingPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const meeting = getMeeting(meetingId);
  if (!meeting) notFound();

  const context = await getClientContextWithMemoryLayer(meeting.clientId);

  return (
    <AppShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="rose">silent meeting mode</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            Keep client conversation human while Sarah gets live prompts.
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            The companion treats audio as one conversation stream for MVP purposes, extracts
            candidate facts, and shows advisor-only suggestions.
          </p>
        </div>
        <PrimaryButton href={`/post-meeting/${meeting.id}`}>End and review</PrimaryButton>
      </div>

      <MeetingCompanion context={context} />
      <ClientContextPanel context={context} />
    </AppShell>
  );
}
