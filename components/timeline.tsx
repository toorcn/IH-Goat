import type { ClientContext } from "@/lib/types";
import type { CSSProperties } from "react";
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
      <ol className="divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line bg-paper/80">
        {rows.map((row, index) => (
          <li
            key={`${row.date}-${row.title}`}
            className="stagger-item grid gap-3 p-3 sm:grid-cols-[7.5rem_1fr] sm:p-4"
            style={{ "--index": index } as CSSProperties & Record<"--index", number>}
          >
            <Badge tone={row.tone}>{row.date}</Badge>
            <div>
              <p className="text-sm font-semibold text-ink">{row.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{row.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
