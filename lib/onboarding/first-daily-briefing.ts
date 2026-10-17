import { dailyBriefing as copy } from "@/content/briefing";
import { formatCurrency } from "@/lib/format";
import { mockDailyBriefings } from "@/lib/mock-data/briefings";
import type { AutonomyPolicy, Briefing, BriefingActionItem, BriefingChange, BriefingDraft, BriefingPeriod, DailyBriefing, DailyBriefingSet, DataSource, Mandate } from "@/types";
import { followThrough, reachOf, resolveBriefingAction, type BriefingAction } from "./mandate";

/**
 * The first executive briefing, as the dial reads it (components/briefing): what the onboarding
 * found (the Briefing), worded by the mandate the user just gave and the tools connected. It is
 * the day's first briefing, so it has nothing to compare with (its history is what happened since
 * the tools were connected). The day's other two periods open an example of a usual day, marked
 * as such, never passed off as the user's own. The action and its lines only promise what the mandate
 * allows (resolveBriefingAction): with Guided, nothing goes out on its own.
 */

const PERIODS: BriefingPeriod[] = ["morning", "midday", "evening"];
const periodAt = (hour: number): BriefingPeriod => (hour < 12 ? "morning" : hour < 17 ? "midday" : "evening");
const pad = (n: number) => String(n).padStart(2, "0");
const percent = (v: number) => `${Math.round(v * 100)}%`;

/** When each kind of action happens, in the same words as its follow through (mandate.ts) */
const TIMING: Record<BriefingAction["kind"], string> = { handle: "10:00", prepare: "Ready by 9:00", offer: "On your word", list: "Every morning" };

function actionsFor(action: BriefingAction, drafts: BriefingDraft[], recommendationId: string): BriefingActionItem[] {
  const timing = TIMING[action.kind];
  switch (action.kind) {
    case "handle":
      return drafts.map((d) => ({ id: `reply_${d.id}`, name: copy.first.reply(d.contact), status: "scheduled", timing, next: copy.first.logged, needsApproval: false, recommendationId }));
    case "prepare":
      return drafts.map((d) => ({ id: `reply_${d.id}`, name: copy.first.reply(d.contact), status: "drafted", timing, next: copy.first.afterApproval, needsApproval: true, note: action.note, recommendationId }));
    case "offer":
      return drafts.map((d) => ({ id: `draft_${d.id}`, name: copy.first.draft(d.contact), status: "awaiting-approval", timing, next: copy.first.onWord, needsApproval: true, note: action.note, recommendationId }));
    case "list":
      return [{ id: "keep", name: copy.first.keep, status: "scheduled", timing, note: action.note, needsApproval: false, recommendationId }];
  }
}

/** The same moment on `date` ("2026-10-17"), or on the day before it when the example compared with yesterday */
const onDate = (iso: string, date: string, from: string) => {
  if (iso.slice(0, 10) === from) return `${date}${iso.slice(10)}`;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.toISOString().slice(0, 10)}${iso.slice(10)}`;
};

/**
 * The day's other briefings, before there are any: the example day's briefing for that period
 * (TODO(api): an example served with the briefings), moved to today and marked as an example,
 * so the three briefings can be switched between from the first day.
 */
function exampleFor(period: BriefingPeriod, date: string): DailyBriefing | null {
  const b = mockDailyBriefings.find((e) => e.period === period);
  if (!b) return null;
  const from = b.preparedAt.slice(0, 10);
  return {
    ...b,
    id: `example_${period}`,
    preparedAt: onDate(b.preparedAt, date, from),
    comparedWith: b.comparedWith && { ...b.comparedWith, preparedAt: onDate(b.comparedWith.preparedAt, date, from) },
    example: true,
  };
}

/** "7:53", some minutes before `now` */
const minutesBefore = (now: Date, m: number) => {
  const t = new Date(now.getTime() - m * 60_000);
  return `${t.getHours()}:${pad(t.getMinutes())}`;
};

/**
 * The first briefing has no earlier briefing to be compared with: its history is what happened
 * since the tools were connected, a few minutes before. Only what the onboarding did, newest first.
 */
function sinceConnected({ n, worth, basedOn, sources, mode, now }: { n: number; worth: string; basedOn: string; sources: DataSource[]; mode?: string; now: Date }): BriefingChange[] {
  const since = copy.first.since;
  const changes: (BriefingChange | false)[] = [
    { id: "mandate", kind: "decided", title: since.mandate, detail: mode, at: minutesBefore(now, 0) },
    n > 0 && { id: "found", kind: "risk", title: since.found(n), detail: since.foundDetail(worth), at: minutesBefore(now, 1), dimension: "priority", highlight: true },
    { id: "read", kind: "completed", title: since.read, detail: basedOn, at: minutesBefore(now, 2), dimension: "insight", highlight: true },
    sources.length > 0 && { id: "connected", kind: "completed", title: since.connected(sources.map((s) => s.name)), detail: since.readOnly, at: minutesBefore(now, 4), highlight: true },
  ];
  return changes.filter((c): c is BriefingChange => Boolean(c));
}

export function firstDailyBriefing({
  briefing,
  mandate,
  policy,
  sources,
  firstName,
  now,
}: {
  briefing: Briefing;
  mandate: Mandate;
  policy: AutonomyPolicy;
  /** The connected tools: the action never promises what they can't do */
  sources: DataSource[];
  firstName: string | null;
  /** The visitor's own time: it names the briefing (morning, midday, evening) and its hour */
  now: Date;
}): DailyBriefingSet {
  const action = resolveBriefingAction(briefing, mandate, policy, sources);
  const { priority, insight, recommendation, impact, drafts } = briefing;
  const n = drafts.length;
  const worth = formatCurrency(drafts.reduce((s, d) => s + d.value, 0));
  const largest = [...drafts].sort((a, b) => b.value - a.value)[0];
  const curve = insight.curve;
  const threshold = insight.quiet?.threshold;
  const measured = curve && curve.length > 1 && threshold !== undefined ? { high: percent(curve[0]), low: percent(curve[curve.length - 1]), threshold } : null;

  const period = periodAt(now.getHours());
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const recommendationId = "rec_first";
  const steps = followThrough(action);
  const level = policy.levels.find((l) => l.id === mandate.level);
  const reach = reachOf(policy, mandate);

  const first: DailyBriefing = {
    id: "b_first",
    period,
    preparedAt: `${date}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`,
    headline: priority.title,
    priority: {
      dimension: "priority",
      severity: "high",
      title: priority.title,
      why: priority.detail,
      metric: n ? { kind: "money", value: worth, caption: copy.first.waiting } : undefined,
      detail: largest && copy.first.largest(largest.company, formatCurrency(largest.value)),
      evidence: drafts.map((d) => copy.first.quiet(d.company, formatCurrency(d.value), d.quietDays)),
    },
    insight: {
      dimension: "insight",
      title: insight.title,
      why: insight.detail,
      // the company's own close rates, only when they were measured
      metric: measured ? { kind: "change", value: measured.low, caption: copy.first.slips(measured.threshold), direction: "down", from: measured.high } : undefined,
      evidence: measured ? [copy.first.answered(measured.threshold, measured.high), copy.first.late(measured.low), briefing.basedOn] : [briefing.basedOn],
      limits: measured ? copy.first.history : copy.first.unmeasured,
    },
    recommendation: {
      dimension: "recommendation",
      id: recommendationId,
      title: recommendation.title,
      why: recommendation.detail,
      metric: impact ? { kind: "change", value: impact.value, caption: impact.label, direction: "up" } : undefined,
      evidence: drafts.slice(0, 3).map((d) => copy.first.wroteLast(d.contact, d.quietDays)),
      outcome: copy.first.outcome,
      limits: impact ? copy.first.average : undefined,
    },
    action: {
      dimension: "action",
      title: action.title,
      why: action.note,
      metric: { kind: "count", value: String(n), caption: copy.first.caption[action.kind] },
      evidence: [action.detail],
    },
    actions: actionsFor(action, drafts, recommendationId),
    followThrough: {
      title: action.title,
      steps: steps.map((s, i) => ({
        id: s.id,
        label: s.label,
        when: s.when ?? copy.first.pending,
        detail: i === 0 ? copy.first.proposals(n) : i === steps.length - 1 ? worth : undefined,
        state: s.state,
      })),
    },
    stage: { state: "identified", label: n ? copy.first.stage(n) : copy.first.nothing },
    changes: sinceConnected({ n, worth, basedOn: briefing.basedOn, sources, mode: level && copy.first.since.mode(level.name, copy.autonomy.promises[mandate.level]), now }),
    comparedWith: null,
  };

  return {
    date,
    company: "",
    owner: { firstName: firstName ?? "" },
    autonomy: {
      level: mandate.level,
      name: level?.name ?? mandate.level,
      share: reach.total ? reach.auto / reach.total : 0,
      promise: copy.autonomy.promises[mandate.level],
      limit: copy.autonomy.limit,
    },
    // the user's own briefing in its period, an example of a usual day in the other two
    briefings: PERIODS.map((p) => (p === period ? first : exampleFor(p, date))).filter((b): b is DailyBriefing => b !== null),
  };
}
