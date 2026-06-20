import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { MeetingCompanion } from "@/components/meeting-companion";
import { AppShell, Badge, PageIntro, PrimaryButton } from "@/components/ui";
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
      <PageIntro
        eyebrow={<Badge tone="rose">silent meeting mode</Badge>}
        title="Keep client conversation human while Sarah gets live prompts."
        description="The companion treats audio as one conversation stream for MVP purposes, extracts candidate facts, and shows advisor-only suggestions."
        action={<PrimaryButton href={`/post-meeting/${meeting.id}`}>End and review</PrimaryButton>}
      />

      <MeetingCompanion context={context} />
      <ClientContextPanel context={context} />
    </AppShell>
  );
}
