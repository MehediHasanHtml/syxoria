import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Lightbulb, Sparkles, TrendingUp, TriangleAlert, Waves, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DirectionMark, SeverityMark, StatusIcon } from "@/components/briefing/marks";
import { Sparkline } from "@/components/dashboard/charts/sparkline";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { dailyBriefing as words } from "@/content/briefing";
import { cn } from "@/lib/cn";
import type { BriefingActionStatus, BriefingSeverity } from "@/types";
import type { FocusPriority, Insight, InsightKind, Kpi, Priority3, WorkspaceRec } from "@/types/workspace";

/**
 * The workspace's shared pieces, the same on every page: the editorial heading, the ledger of
 * figures, the panel, Syxoria's insights, the one focus with the chain it runs through
 * (business data, analysis, recommendation, action, follow up), recommended actions, and the
 * small marks for status and priority. Every state is said with a word and a mark, never by
 * colour alone. Styles: "WORKSPACE" in globals.css.
 */

export function WsHead({ eyebrow, title, lead, children }: { eyebrow: ReactNode; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ws-head">
      <div className="min-w-0">
        <p className="bd-label">{eyebrow}</p>
        <h1 className="ws-title">{title}</h1>
        {lead && <p className="ws-lead">{lead}</p>}
      </div>
      {children && <div className="ws-head__side">{children}</div>}
    </header>
  );
}

export function Panel({
  title,
  meta,
  link,
  action,
  className,
  children,
  id,
}: {
  title: string;
  meta?: ReactNode;
  link?: { href: string; label: string };
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section aria-label={title} id={id} className={cn("ws-panel", className)}>
      <div className="ws-panel__head">
        <h2 className="bd-label">
          {title}
          {meta !== undefined && <span className="ws-panel__meta">{meta}</span>}
        </h2>
        {link && (
          <Link href={link.href} className="ws-link">
            {link.label}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}

/** The figures that say how an area stands, on one ledger: value, what it is, how it moved */
export function KpiRow({ items, label }: { items: Kpi[]; label: string }) {
  return (
    <section aria-label={label} className="ws-kpis">
      {items.map((k) => (
        <div key={k.id} className="ws-kpi">
          <span className="bd-label">{k.label}</span>
          <span className="ws-kpi__value tabular">{k.value}</span>
          <span className="ws-kpi__caption">{k.caption}</span>
          {k.progress !== undefined && (
            <span aria-hidden="true" className="ws-kpi__bar">
              <span style={{ width: `${Math.round(k.progress * 100)}%` }} />
            </span>
          )}
          {k.delta && (
            <span className="ws-kpi__delta" data-good={k.delta.good || undefined}>
              <DirectionMark direction={k.delta.direction} className="size-3.5" />
              {k.delta.text}
            </span>
          )}
          {k.spark && <Sparkline values={k.spark} tone={k.delta && !k.delta.good ? "muted" : "accent"} className="ws-kpi__spark" />}
        </div>
      ))}
    </section>
  );
}

export type ChipTone = "neutral" | "emerald" | "warn" | "owner" | "faint";
export function Chip({ tone = "neutral", children, className }: { tone?: ChipTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("ws-chip", className)} data-tone={tone}>
      {children}
    </span>
  );
}

/** An action's status, the same words and marks as the briefing's */
export function ActionState({ status, held }: { status: BriefingActionStatus; held?: boolean }) {
  return (
    <span className="ws-state" data-status={status} data-held={held || undefined}>
      <StatusIcon status={status} ring={false} />
      {held ? "Paused" : words.actions.statuses[status]}
    </span>
  );
}

const LEVEL: Record<Priority3, BriefingSeverity> = { high: "high", medium: "watch", low: "routine" };
const PRIORITY_WORD: Record<Priority3, string> = { high: "High", medium: "Medium", low: "Low" };
export function PriorityTag({ level }: { level: Priority3 }) {
  return (
    <span className="ws-priority" data-level={level}>
      <SeverityMark level={LEVEL[level]} />
      {PRIORITY_WORD[level]}
    </span>
  );
}

const INSIGHT: Record<InsightKind, { icon: LucideIcon; word: string }> = {
  opportunity: { icon: TrendingUp, word: "Opportunity" },
  risk: { icon: TriangleAlert, word: "Risk" },
  growth: { icon: Sparkles, word: "Growth" },
  change: { icon: Waves, word: "Change" },
  anomaly: { icon: CircleAlert, word: "Unusual" },
};

/** What Syxoria noticed, each with what it rests on and where it leads */
export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <ul className="ws-insights">
      {insights.map((i) => {
        const { icon: Icon, word } = INSIGHT[i.kind];
        return (
          <li key={i.id}>
            <Link href={i.href} className="ws-insight" data-kind={i.kind}>
              <span className="ws-insight__kind">
                <Icon aria-hidden="true" strokeWidth={1.7} />
                {word}
              </span>
              <span className="ws-insight__title">{i.title}</span>
              <span className="ws-insight__body">{i.body}</span>
              <span className="ws-insight__foot">
                <span className="ws-insight__tag">{i.tag}</span>
                <span className="ws-insight__basis">{i.basis}</span>
              </span>
              <ArrowRight aria-hidden="true" className="ws-insight__go" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The one thing to focus on, and how far it has gone from data to follow up */
export function FocusCard({ focus }: { focus: FocusPriority }) {
  return (
    <section aria-labelledby="ws-focus" className="ws-focus">
      <div className="ws-focus__top">
        <p id="ws-focus" className="bd-label ws-focus__label">
          {focus.label}
        </p>
        <span className="ws-focus__severity">
          <SeverityMark level={focus.severity} />
          {words.severity[focus.severity]}
        </span>
      </div>
      <h2 className="ws-focus__title">{focus.title}</h2>
      <p className="ws-focus__why">{focus.why}</p>
      {(focus.stake || focus.due) && (
        <p className="ws-focus__facts">
          {focus.stake && <span className="tabular">{focus.stake}</span>}
          {focus.due && <span>{focus.due}</span>}
        </p>
      )}
      <ol className="ws-chain" aria-label="From data to follow up">
        {focus.chain.map((c) => (
          <li key={c.label} data-state={c.state}>
            <span aria-hidden="true" className="ws-chain__node">
              {c.state === "done" && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <span className="ws-chain__label">{c.label}</span>
            <span className="ws-chain__detail">{c.detail}</span>
            <span className="sr-only">, {c.state === "done" ? "done" : c.state === "now" ? "now" : c.state === "failed" ? "failed" : "to come"}</span>
          </li>
        ))}
      </ol>
      <ButtonLink href={focus.href} variant="primary" size="sm" className="group mt-1 self-start">
        {focus.cta}
        <ArrowNudge />
      </ButtonLink>
    </section>
  );
}

/** Recommended next steps: what, why, whether it needs the owner, and the way to it */
export function RecList({ recs, statuses }: { recs: WorkspaceRec[]; statuses?: Record<string, BriefingActionStatus> }) {
  return (
    <ul className="ws-recs">
      {recs.map((r) => {
        const status = r.actionId ? statuses?.[r.actionId] : undefined;
        return (
          <li key={r.id} className="ws-rec">
            <span className="ws-rec__icon" aria-hidden="true">
              <Lightbulb strokeWidth={1.7} />
            </span>
            <span className="min-w-0">
              <span className="ws-rec__title">{r.title}</span>
              <span className="ws-rec__why">{r.why}</span>
              <span className="ws-rec__meta">
                <PriorityTag level={r.priority} />
                {r.client && <span>{r.client}</span>}
                {status && <ActionState status={status} />}
                <span className="ws-rec__approval" data-asks={r.approval || undefined}>
                  {r.approval ? "Needs your approval" : "No approval needed"}
                </span>
              </span>
            </span>
            <Link href={r.actionId ? `/app/actions?action=${r.actionId}` : "/app/actions"} className="ws-rec__cta">
              {r.cta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Progress towards a target, with where an even pace would be today */
export function Progress({ value, expected, tone = "emerald", label }: { value: number; expected?: number; tone?: "emerald" | "warn" | "neutral"; label: string }) {
  return (
    <span role="img" aria-label={label} className="ws-progress" data-tone={tone}>
      <span className="ws-progress__fill" style={{ width: `${Math.min(100, Math.round(value * 100))}%` }} />
      {expected !== undefined && expected < 1 && <span className="ws-progress__pace" style={{ left: `${Math.round(expected * 100)}%` }} />}
    </span>
  );
}

/** Initials in a quiet circle, for a client or a person */
export function Mark({ name, tone }: { name: string; tone?: "emerald" | "warn" }) {
  const initials = name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden="true" className="ws-mark" data-tone={tone}>
      {initials}
    </span>
  );
}

export const euro = (n: number) => `€${n.toLocaleString("en-GB")}`;
