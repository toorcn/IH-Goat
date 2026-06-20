import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Clock, Radio } from "lucide-react";

type BadgeTone = "neutral" | "signal" | "amber" | "rose" | "cobalt";
type FeatureTone = "signal" | "amber" | "rose" | "cobalt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[100dvh]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-4 sm:px-6 lg:gap-7 lg:px-8 lg:py-6">
        <header className="rounded-[1.65rem] border border-line/80 bg-panel/82 p-2 shadow-diffusion backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="focus-ring pressable group w-fit rounded-[1.15rem] px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                Peak Wealth Advisors
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Advisors&apos; Advisor
              </h1>
            </Link>
            <nav className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 text-sm font-medium text-muted md:mx-0 md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/briefing/meeting-2026-06-20-tan">Briefing</NavLink>
              <NavLink href="/qna/meeting-2026-06-20-tan">Q&A</NavLink>
              <NavLink href="/meeting/meeting-2026-06-20-tan">Meeting</NavLink>
              <NavLink href="/client/client-tan">Client</NavLink>
              <NavLink href="/post-meeting/meeting-2026-06-20-tan">Review</NavLink>
            </nav>
          </div>
        </header>
        <div className="flex flex-col gap-5 lg:gap-7">{children}</div>
      </div>
    </main>
  );
}

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring pressable shrink-0 rounded-full border border-transparent px-3.5 py-2 text-ink transition-colors hover:border-line hover:bg-paper"
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
    <section className={`surface-enter rounded-[1.6rem] border border-line/80 bg-panel p-4 shadow-diffusion sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
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
    <div className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-normal text-ink md:text-4xl">
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
    amber: "border-amber/35 bg-amber/15 text-amber",
    rose: "border-rose/30 bg-rose/10 text-rose",
    cobalt: "border-cobalt/30 bg-cobalt/10 text-cobalt"
  };

  return (
    <Link
      href={href}
      className="focus-ring group flex min-h-[220px] flex-col rounded-lg border border-line bg-panel p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-signal/50 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-lg border p-2 ${tones[tone]}`}>{icon}</div>
        <ArrowRight className="mt-1 h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-signal" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink">
        {cta}
        <ArrowRight className="h-4 w-4 text-signal" />
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
    amber: "bg-amber/15",
    rose: "bg-rose/10",
    cobalt: "bg-cobalt/10"
  };

  return (
    <div className={`rounded-lg border border-line p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-muted">{detail}</p> : null}
    </div>
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
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold leading-none ${tones[tone]}`}>
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
      className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-cobalt"
    >
      {children}
      {icon}
    </Link>
  );
}

export function SecondaryButton({
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
      className="focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-signal/50 hover:bg-paper"
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
    <div className="hover-lift rounded-[1.15rem] border border-line/80 bg-paper/80 p-3 transition-transform">
      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
        <span className={tone === "signal" ? "text-signal" : tone === "amber" ? "text-amber" : "text-muted"}>
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-ink">{value}</p>
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
    <div className="rounded-[1.25rem] border border-dashed border-line bg-paper/80 px-4 py-8 text-center text-sm text-muted">
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
      <p>{children}</p>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="grid gap-5 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        {typeof eyebrow === "string" ? <Badge tone="signal">{eyebrow}</Badge> : eyebrow}
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap gap-2 md:justify-end">{action}</div> : null}
    </section>
  );
}
