import { redirect } from "next/navigation";
import { getCalendar } from "@/lib/neo4j-memory";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const calendar = await getCalendar();
  const nextMeeting = calendar.meetings[0];
  if (!nextMeeting) {
    throw new Error("No upcoming meetings found.");
  }

  redirect(`/briefing/${nextMeeting.id}`);
}
