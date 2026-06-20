import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { MeetingCompanion } from "@/components/meeting-companion";
import { AppShell, MetricCard, PrimaryButton, SectionHeader } from "@/components/ui";
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
      <SectionHeader
        eyebrow="Silent meeting companion"
        title="Keep the client conversation human while Sarah gets live prompts."
        description="This page proves live capture, advisor-only suggestions, and candidate memory extraction from the meeting stream."
        action={<PrimaryButton href={`/post-meeting/${meeting.id}`}>End and review</PrimaryButton>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Capture" value="Audio" detail="Browser microphone chunks post to transcription." tone="rose" />
        <MetricCard label="Advisor view" value="Silent" detail="Suggestions appear without client-facing interruption." tone="cobalt" />
        <MetricCard label="Memory" value="Pending" detail="New facts stay candidates until review." tone="amber" />
      </div>

      <MeetingCompanion context={context} />

      <SectionHeader
        eyebrow="Client context"
        title="The memory Sarah can reference mid-meeting."
        description="Open concerns, relationship cues, and graph-backed facts remain visible beside the live workflow."
      />
      <ClientContextPanel context={context} />
    </AppShell>
  );
}
