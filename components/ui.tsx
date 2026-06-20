import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Clock, Radio } from "lucide-react";

type BadgeTone = "neutral" | "signal" | "amber" | "rose" | "cobalt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="focus-ring group w-fit rounded-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Peak Wealth Advisors
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-ink">
              Advisors&apos; Advisor
            </h1>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-medium text-muted">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/briefing/meeting-2026-06-20-tan">Briefing</NavLink>
            <NavLink href="/meeting/meeting-2026-06-20-tan">Meeting</NavLink>
            <NavLink href="/client/client-tan">Client</NavLink>
            <NavLink href="/post-meeting/meeting-2026-06-20-tan">Review</NavLink>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring rounded-md border border-line bg-panel px-3 py-2 text-ink transition hover:border-signal/50 hover:text-signal"
    >
      {children}
    </Link>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = ""
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-panel p-4 shadow-soft ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold tracking-normal text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-line bg-paper text-muted",
    signal: "border-signal/30 bg-signal/10 text-ink",
    amber: "border-amber/40 bg-amber/15 text-ink",
    rose: "border-rose/40 bg-rose/10 text-ink",
    cobalt: "border-cobalt/30 bg-cobalt/10 text-ink"
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PrimaryButton({
  href,
  children,
  icon = <ArrowRight className="h-4 w-4" />
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-cobalt"
    >
      {children}
      {icon}
    </Link>
  );
}

export function IconPill({
  icon,
  label,
  value,
  tone = "neutral"
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: BadgeTone;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span className={tone === "signal" ? "text-signal" : tone === "amber" ? "text-amber" : "text-muted"}>
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function StatusIcon({ status }: { status: "ready" | "warning" | "live" | "done" }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-signal" />;
  if (status === "warning") return <CircleAlert className="h-4 w-4 text-amber" />;
  if (status === "live") return <Radio className="h-4 w-4 text-rose" />;
  return <Clock className="h-4 w-4 text-muted" />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
