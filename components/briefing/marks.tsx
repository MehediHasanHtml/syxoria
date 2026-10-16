import { CalendarClock, Check, CheckCheck, CircleAlert, CircleDot, Hand, LoaderCircle, PenLine, Plus, Repeat2, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BriefingActionStatus, BriefingChangeKind, BriefingSeverity } from "@/types";

/**
 * The briefing's small marks. Every state is said three ways: a word, a shape, and only then a
 * restrained tone — never by colour alone.
 */

const BARS: Record<BriefingSeverity, number> = { routine: 0, watch: 1, high: 2, critical: 3 };

/** How pressing a priority is: three rising bars, as many filled as it is urgent */
export function SeverityMark({ level, className }: { level: BriefingSeverity; className?: string }) {
  const on = BARS[level];
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn("bd-severity size-3", className)} data-level={level}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1 + i * 4} y={8 - i * 3} width="2.4" height={3 + i * 3} rx="0.6" data-on={i < on || undefined} />
      ))}
    </svg>
  );
}

const STATUS: Record<BriefingActionStatus, LucideIcon> = {
  drafted: PenLine,
  "awaiting-approval": Hand,
  scheduled: CalendarClock,
  "in-progress": LoaderCircle,
  completed: Check,
  unsuccessful: CircleAlert,
};

export function StatusIcon({ status, className }: { status: BriefingActionStatus; className?: string }) {
  const Icon = STATUS[status];
  return (
    <span aria-hidden="true" className={cn("bd-status", className)} data-status={status}>
      <Icon className="size-3.5" strokeWidth={1.8} />
    </span>
  );
}

const CHANGE: Record<BriefingChangeKind, LucideIcon> = {
  new: Plus,
  unresolved: CircleDot,
  decided: Check,
  changed: Repeat2,
  "in-progress": LoaderCircle,
  completed: CheckCheck,
  risk: TriangleAlert,
  opportunity: TrendingUp,
};

export function ChangeIcon({ kind, className }: { kind: BriefingChangeKind; className?: string }) {
  const Icon = CHANGE[kind];
  return <Icon aria-hidden="true" className={cn("bd-change__icon size-3.5", className)} data-kind={kind} strokeWidth={1.8} />;
}
