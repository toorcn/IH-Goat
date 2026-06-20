import { BarChart3, CalendarPlus, CheckSquare, GitBranch, Network, SunMedium } from "lucide-react";
import type { DailyBrief } from "@/lib/types";
import { Badge, MetricCard, Panel, PrimaryButton } from "./ui";

export function DailyBriefPanel({ brief }: { brief: DailyBrief }) {
  const health = brief.networkHealth;
  const networkLift = health.newContactsThisWeek - health.threeMonthWeeklyAverage;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel
        title="Morning Brief"
        eyebrow={`${brief.advisorName} - ${brief.date}`}
        action={<SunMedium className="h-5 w-5 text-amber" />}
      >
        <div className="space-y-3">
          {brief.morning.map((meeting) => (
            <article key={meeting.id} className="rounded-lg border border-line bg-paper p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="signal">{meeting.time}</Badge>
                  <span className="text-sm font-semibold text-ink">{meeting.clientName}</span>
                </div>
                <PrimaryButton href={meeting.href}>Brief</PrimaryButton>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{meeting.objective}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-line bg-panel p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Last Discussed
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink">{meeting.lastDiscussed}</p>
                </div>
                <div className="rounded-lg border border-line bg-panel p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Opening Cue
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink">{meeting.opener}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Networking Health" eyebrow="This week" action={<Network className="h-5 w-5 text-cobalt" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard label="New contacts" value={`${health.newContactsThisWeek}`} detail={`${networkLift >= 0 ? "+" : ""}${networkLift} vs 3-month avg`} tone="signal" />
          <MetricCard label="Health score" value={`${health.healthScore}`} detail="Referral rhythm is healthy." tone="cobalt" />
          <MetricCard label="Reactivated" value={`${health.reactivatedContacts}`} detail="Dormant relationships touched." tone="amber" />
          <MetricCard label="Open referrals" value={`${health.referralOpportunities}`} detail="Needs advisor approval." tone="rose" />
        </div>

        <div className="mt-4 space-y-2">
          {health.topSignals.map((signal) => (
            <div key={signal} className="flex gap-2 rounded-lg border border-line bg-paper p-3 text-sm leading-6 text-muted">
              <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <span>{signal}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="End-Of-Day Follow-Up" eyebrow="Advisor approval">
        <div className="grid gap-3 md:grid-cols-3">
          {brief.endOfDay.map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={item.status === "ready" ? "signal" : "amber"}>
                  {item.status === "ready" ? "ready" : "review"}
                </Badge>
                {item.target === "calendar" ? (
                  <CalendarPlus className="h-4 w-4 text-cobalt" />
                ) : (
                  <CheckSquare className="h-4 w-4 text-signal" />
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Memory Layer And Roadmap" eyebrow="Hackathon scope">
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-signal" />
            <p className="text-sm font-semibold text-ink">{brief.memoryLayer.current}</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {brief.memoryLayer.alternatives.map((item) => (
              <div key={item.name} className="rounded-lg border border-line bg-panel p-3">
                <Badge tone={item.decision === "now" ? "signal" : item.decision === "later" ? "amber" : "neutral"}>
                  {item.decision}
                </Badge>
                <p className="mt-2 text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.useWhen}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <table className="w-full min-w-[620px] border-collapse bg-panel text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="border-b border-line px-3 py-3">Stage</th>
                <th className="border-b border-line px-3 py-3">Build Target</th>
                <th className="border-b border-line px-3 py-3">Owner</th>
                <th className="border-b border-line px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {brief.roadmap.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-line px-3 py-3 font-semibold text-ink">{item.stage}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{item.title}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{item.owner}</td>
                  <td className="border-b border-line px-3 py-3">
                    <Badge tone={item.status === "built" ? "signal" : item.status === "next" ? "amber" : "neutral"}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
