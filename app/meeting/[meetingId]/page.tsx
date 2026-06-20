import { notFound } from "next/navigation";
import { ClientContextPanel } from "@/components/context-panel";
import { MeetingCompanion } from "@/components/meeting-companion";
import { AppShell, Badge, PageIntro, PrimaryButton, SectionHeader } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function MeetingPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  let context;
  try {
    context = await getClientContextForMeeting(meetingId);
  } catch {
    notFound();
  }
  const meeting = context.upcomingMeeting.id === meetingId ? context.upcomingMeeting : context.lastMeeting;

  return (
    <AppShell>
      <PageIntro
        eyebrow={<Badge tone="rose">silent meeting mode</Badge>}
        title="Keep client conversation human while Sarah gets live prompts."
        description="The companion treats audio as one conversation stream for MVP purposes, extracts candidate facts, and shows advisor-only suggestions."
        action={<PrimaryButton href={`/post-meeting/${meeting.id}`}>End and review</PrimaryButton>}
      />

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
