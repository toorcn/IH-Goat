import { notFound } from "next/navigation";
import { PhoneOverlay } from "@/components/phone-overlay";
import { AppShell, MetricCard, PrimaryButton, SectionHeader } from "@/components/ui";
import { getMeeting } from "@/lib/demo-data";
import { getClientContextWithMemoryLayer } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function OverlayPage({
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
        eyebrow="Phone overlay"
        title="Run the in-person capture view from a small screen."
        description="A compact advisor-only surface for listening, quick notes, live suggestions, and captured memory counts during an in-person client meeting."
        action={<PrimaryButton href={`/post-meeting/${meeting.id}`}>Review follow-ups</PrimaryButton>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Mode" value="Silent" detail="No client-facing speech or outbound messages." tone="cobalt" />
        <MetricCard label="Capture" value="Mic" detail="Uses the same live recorder hook as the companion." tone="rose" />
        <MetricCard label="Fallback" value="Simulate" detail="One tap creates a complete demo stream." tone="signal" />
      </div>

      <PhoneOverlay context={context} />
    </AppShell>
  );
}
