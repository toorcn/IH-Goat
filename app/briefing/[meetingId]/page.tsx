import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { AppShell, Badge } from "@/components/ui";
import { VoiceBriefing } from "@/components/voice-briefing";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export default async function BriefingPage({
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
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell fitViewport>
      {/* Slim, plain-language header: who, when, why. */}
      <section className="surface-enter shrink-0 rounded-[1.6rem] border border-line/80 bg-panel/70 p-3 backdrop-blur-xl sm:p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="signal">Before you meet {context.client.name}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">
              {meetingTime} · {context.upcomingMeeting.objective}
            </p>
          </div>
        </div>
      </section>

      <VoiceBriefing context={context} fillViewport />
    </AppShell>
  );
}
