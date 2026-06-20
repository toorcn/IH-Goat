import type { ClientContext } from "@/lib/types";
import { Badge, Panel } from "./ui";

export function Timeline({ context }: { context: ClientContext }) {
  const rows = [
    {
      date: "2026-06-20",
      title: "Upcoming review meeting",
      body: context.upcomingMeeting.objective,
      tone: "signal" as const
    },
    {
      date: "2026-04-08",
      title: "Last meeting",
      body: "Estate planning discussed, will update unresolved, policy renewal hesitation captured.",
      tone: "amber" as const
    },
    {
      date: "2026-04-08",
      title: "Family milestone",
      body: "Jia En accepted into NUS. This is a strong human opener.",
      tone: "neutral" as const
    }
  ];

  return (
    <Panel title="Timeline" eyebrow="Recent context">
      <ol className="space-y-3">
        {rows.map((row) => (
          <li key={`${row.date}-${row.title}`} className="grid grid-cols-[6rem_1fr] gap-3">
            <Badge tone={row.tone}>{row.date}</Badge>
            <div className="border-b border-line pb-3 last:border-b-0">
              <p className="text-sm font-semibold text-ink">{row.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{row.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
