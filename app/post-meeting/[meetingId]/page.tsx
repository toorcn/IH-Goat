import { notFound } from "next/navigation";
import { PostMeetingWrapUp } from "@/components/post-meeting-wrap-up";
import { AppShell } from "@/components/ui";
import { getClientContextForMeeting } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function PostMeetingPage({
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
      <PostMeetingWrapUp context={context} meeting={meeting} />
    </AppShell>
  );
}
