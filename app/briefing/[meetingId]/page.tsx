import { notFound } from "next/navigation";
import { CalendarClock, MessageSquareText, Network, Radio, ScrollText, Sparkles, User } from "lucide-react";
import { ClientContextPanel } from "@/components/context-panel";
import { InfoTabs } from "@/components/info-tabs";
import { RelationshipGraph } from "@/components/relationship-graph";
import { Timeline } from "@/components/timeline";
import { AppShell, Badge, SecondaryButton } from "@/components/ui";
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
  const meeting = context.upcomingMeeting.id === meetingId ? context.upcomingMeeting : context.lastMeeting;
  const meetingTime = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(context.upcomingMeeting.startsAt));

  return (
    <AppShell>
      {/* Slim, plain-language header: who, when, why. */}
      <section className="surface-enter flex flex-col gap-4 rounded-[1.6rem] border border-line/80 bg-panel/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-signal">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="signal">Before you meet {context.client.name}</Badge>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {meetingTime} · {context.upcomingMeeting.objective}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SecondaryButton href={`/qna/${meeting.id}`} icon={<MessageSquareText className="h-4 w-4" />}>
            Open Q&A-only view
          </SecondaryButton>
          <SecondaryButton href={`/meeting/${meeting.id}`} icon={<Radio className="h-4 w-4" />}>
            Open live companion
          </SecondaryButton>
        </div>
      </section>

      <VoiceBriefing context={context} />

      {/* Everything else is one tap away — the advisor pulls up only what they want. */}
      <InfoTabs
        tabs={[
          {
            id: "briefing",
            label: "Briefing",
            icon: <Sparkles className="h-4 w-4" />,
            content: (
              <div className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{context.briefing}</p>
                {context.suggestedQuestions.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Good things to ask
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {context.suggestedQuestions.map((question) => (
                        <li key={question} className="text-sm leading-6 text-muted">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          },
          {
            id: "context",
            label: "Client",
            icon: <User className="h-4 w-4" />,
            content: <ClientContextPanel context={context} />
          },
          {
            id: "timeline",
            label: "Timeline",
            icon: <ScrollText className="h-4 w-4" />,
            content: <Timeline context={context} />
          },
          {
            id: "network",
            label: "Network",
            icon: <Network className="h-4 w-4" />,
            content: <RelationshipGraph nodes={context.graph.nodes} edges={context.graph.edges} />
          }
        ]}
      />
    </AppShell>
  );
}
