import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Clock, Radio } from "lucide-react";

type BadgeTone = "neutral" | "signal" | "orange" | "rose" | "cobalt";
type FeatureTone = "signal" | "orange" | "rose" | "cobalt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
        <header className="animate-fade-slide-up flex flex-col gap-4 border-b border-line/80 pb-5 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="focus-ring group w-fit rounded-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Peak Wealth Advisors
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-normal text-ink">
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
      className="focus-ring rounded-md border border-line bg-panel/90 px-3 py-2 text-ink shadow-sm transition-all duration-200 hover:border-orange/50 hover:bg-panel hover:text-orange hover:shadow-glow"
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
    <section className={`animate-fade-slide-up rounded-lg border border-line/90 bg-panel/95 p-4 shadow-soft ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-heading text-lg font-bold tracking-normal text-orange">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className = ""
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`animate-fade-slide-up flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight tracking-normal text-orange md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function FeatureCard({
  eyebrow,
  title,
  description,
  href,
  cta,
  icon,
  tone = "signal",
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: ReactNode;
  tone?: FeatureTone;
  children?: ReactNode;
}) {
  const tones: Record<FeatureTone, string> = {
    signal: "border-signal/25 bg-signal/10 text-signal",
    orange: "border-orange/35 bg-orange/15 text-orange",
    rose: "border-rose/30 bg-rose/10 text-rose",
    cobalt: "border-cobalt/30 bg-cobalt/10 text-cobalt"
  };

  return (
    <Link
      href={href}
      className="focus-ring gradient-border group flex min-h-[220px] cursor-pointer flex-col rounded-lg border border-line bg-panel p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-orange/40 hover:bg-white hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg border p-2 ${tones[tone]}`}>{icon}</div>
        <ArrowRight className="mt-1 h-4 w-4 text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-orange" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors duration-200 group-hover:text-orange">
        {cta}
        <ArrowRight className="h-4 w-4 text-orange" />
      </span>
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-paper",
    signal: "bg-signal/10",
    orange: "bg-orange/15",
    rose: "bg-rose/10",
    cobalt: "bg-cobalt/10"
  };

  return (
    <div className={`animate-fade-slide-up rounded-lg border border-line p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold leading-none text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-muted">{detail}</p> : null}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-line bg-paper text-muted",
    signal: "border-signal/30 bg-signal/10 text-ink",
    orange: "border-orange/40 bg-orange/15 text-ink",
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
      className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-all duration-200 hover:bg-orange hover:shadow-glow"
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
    <div className="rounded-lg border border-line bg-paper p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span className={tone === "signal" ? "text-signal" : tone === "orange" ? "text-orange" : "text-muted"}>
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
  if (status === "warning") return <CircleAlert className="h-4 w-4 animate-pulse-soft text-orange" />;
  if (status === "live") return <Radio className="h-4 w-4 animate-pulse-soft text-rose" />;
  return <Clock className="h-4 w-4 text-muted" />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
