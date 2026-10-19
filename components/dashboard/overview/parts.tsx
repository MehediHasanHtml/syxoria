"use client";

/*
 * The Executive Overview's parts: the day's briefings, one story told as the five questions, Why?,
 * action lines with the targeted kill switch, the approval sheet, the full briefing over the page.
 * Also used by the concept pages (/concept/overview). Styles: app/styles/executive.css.
 */

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CirclePause, CirclePlay, X } from "lucide-react";
import { DailyBriefingView } from "@/components/briefing/daily-briefing";
import { StatusIcon } from "@/components/briefing/marks";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { briefingTime, dailyBriefing as briefingCopy } from "@/content/briefing";
import { overviewCopy as copy } from "@/content/overview";
import { globalHold, holdFor } from "@/lib/automation";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, BriefingActionStatus, BriefingMetric, BriefingSeverity, DailyBriefing, DailyBriefingSet } from "@/types";
import type { WorkspaceAction } from "@/types/workspace";
import type { Lens } from "./data";

/* ---------- The day's briefings ---------- */

/** The briefing in view, the user's own by default (on a first day the others are examples) */
export function useBriefing(set: DailyBriefingSet, initial?: string) {
  const own = set.briefings.filter((b) => !b.example);
  const start = initial && set.briefings.some((b) => b.id === initial) ? initial : (own[own.length - 1] ?? set.briefings[set.briefings.length - 1]).id;
  const [id, setId] = useState(start);
  const index = set.briefings.findIndex((b) => b.id === id);
  const briefing = set.briefings[index];
  const latest = set.briefings[set.briefings.length - 1];
  return { briefing, index, select: setId, isLatest: briefing.id === latest.id };
}

export const periodName = (b: DailyBriefing) => briefingCopy.periods[b.period];
export const timeOf = (b: DailyBriefing) => briefingTime(b.preparedAt);

/** "6 updates since 13:00", or what a first briefing honestly says */
export function updatesLine(b: DailyBriefing) {
  if (!b.comparedWith) return copy.briefing.firstDay;
  const since = briefingTime(b.comparedWith.preparedAt);
  const sameDay = b.comparedWith.preparedAt.slice(0, 10) === b.preparedAt.slice(0, 10);
  return copy.briefing.updates(b.changes?.length ?? 0, sameDay ? since : `yesterday ${since}`);
}

/* ---------- One story, five questions ---------- */

export type StoryKey = keyof typeof copy.questions;
export type StoryState = "done" | "now" | "next" | "failed";
export type StoryStep = {
  key: StoryKey;
  title: string;
  body?: string;
  detail?: string;
  evidence?: string[];
  outcome?: string;
  limits?: string;
  metric?: BriefingMetric;
  state: StoryState;
};
export type Story = {
  id: string;
  label: string;
  severity: BriefingSeverity;
  title: string;
  stake?: string;
  due?: string;
  steps: StoryStep[];
  cta: { label: string; href: string };
};

/** The briefing told as the five questions: its four dimensions, then how far it has gone */
export function storyOfBriefing(b: DailyBriefing): Story {
  const done = b.followThrough.steps.filter((s) => s.state === "done");
  const failed = b.followThrough.steps.filter((s) => s.state === "failed");
  return {
    id: b.id,
    label: `${periodName(b)} briefing`,
    severity: b.priority.severity,
    title: b.priority.title,
    steps: [
      { key: "matters", title: b.priority.title, body: b.priority.why, detail: b.priority.detail, evidence: b.priority.evidence, metric: b.priority.metric, state: "done" },
      { key: "why", title: b.insight.title, body: b.insight.why, detail: b.insight.detail, evidence: b.insight.evidence, metric: b.insight.metric, state: "done" },
      { key: "recommend", title: b.recommendation.title, body: b.recommendation.why, detail: b.recommendation.detail, evidence: b.recommendation.evidence, outcome: b.recommendation.outcome, limits: b.recommendation.limits, metric: b.recommendation.metric, state: "now" },
      { key: "can", title: b.action.title, body: b.action.why, detail: b.action.detail, evidence: b.action.evidence, outcome: b.action.outcome, metric: b.action.metric, state: b.actions.some((a) => a.status === "awaiting-approval") ? "now" : "next" },
      {
        key: "done",
        title: b.followThrough.title,
        evidence: [...done, ...failed].map((s) => `${s.label}, ${s.when}${s.detail ? `: ${s.detail}` : ""}`),
        state: failed.length ? "failed" : done.length ? "done" : "next",
      },
    ],
    cta: { label: copy.briefing.open, href: "/app/briefings" },
  };
}

/** A lens's own focus told the same way: the data and its reading, then the chain it runs through */
export function storyOfLens(lens: Lens): Story {
  const [data, analysis, rec, action, follow] = lens.focus.chain;
  const done = lens.focus.chain.filter((c) => c.state === "done");
  return {
    id: lens.id,
    label: lens.focus.label,
    severity: lens.focus.severity,
    title: lens.focus.title,
    stake: lens.focus.stake,
    due: lens.focus.due,
    steps: [
      { key: "matters", title: lens.focus.title, body: lens.focus.why, evidence: [data.detail], state: data.state },
      { key: "why", title: analysis.detail, body: lens.focus.why, evidence: [data.detail, analysis.detail], state: analysis.state },
      { key: "recommend", title: rec.detail, state: rec.state },
      { key: "can", title: action.detail, state: action.state },
      { key: "done", title: done.length ? done.map((c) => c.detail).join(". ") : follow.detail, detail: follow.state !== "done" ? `Next: ${follow.detail}` : undefined, state: done.length ? "done" : "next" },
    ],
    cta: { label: lens.focus.cta, href: lens.focus.href },
  };
}

/* ---------- Why? ---------- */

/** The reasoning behind a step: what it rests on, what it should achieve, and its limits */
export function WhyPanel({ step, className }: { step: Pick<StoryStep, "evidence" | "outcome" | "limits">; className?: string }) {
  return (
    <div className={cn("cx-why", className)}>
      {step.evidence && step.evidence.length > 0 && (
        <div>
          <p className="cx-label">{copy.why.basis}</p>
          <ul>
            {step.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {step.outcome && (
        <div>
          <p className="cx-label">{copy.why.outcome}</p>
          <p>{step.outcome}</p>
        </div>
      )}
      {step.limits && (
        <div>
          <p className="cx-label">{copy.why.limits}</p>
          <p>{step.limits}</p>
        </div>
      )}
    </div>
  );
}

/** "Why?" as a quiet toggle, its panel right under it */
export function WhyToggle({ step, className }: { step: Pick<StoryStep, "evidence" | "outcome" | "limits">; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!step.evidence?.length && !step.outcome && !step.limits) return null;
  return (
    <div className={className}>
      <button type="button" className="cx-whybtn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? copy.why.close : copy.why.open}
      </button>
      <div id={id} hidden={!open}>
        <WhyPanel step={step} />
      </div>
    </div>
  );
}

/* ---------- Action states ---------- */

export const statusWord = (s: BriefingActionStatus) => briefingCopy.actions.statuses[s];

/** One action on one line: its mark, its name, its status in words and when */
export function ActionLine({ action, status, children }: { action: Pick<BriefingActionItem, "id" | "name" | "timing" | "next">; status: BriefingActionStatus; children?: ReactNode }) {
  return (
    <li className="cx-action" data-status={status}>
      <StatusIcon status={status} />
      <span className="cx-action__text">
        <span className="cx-action__name">{action.name}</span>
        <span className="cx-action__meta">
          {statusWord(status)} · {action.timing}
          {action.next ? <span className="cx-action__next"> · {action.next}</span> : null}
        </span>
      </span>
      {children}
    </li>
  );
}

/** The targeted kill switch, where a workflow shows up: pause just this one, or resume it */
export function WorkflowSwitch({ workflowId }: { workflowId?: string }) {
  const { state, pause, requestResume } = useAutomation();
  if (!workflowId) return null;
  const all = globalHold(state);
  const hold = holdFor(state, "workflow", workflowId);
  if (all) return null;
  return hold ? (
    <button type="button" className="cx-wf" data-held onClick={() => requestResume(hold)} title={copy.workflow.paused}>
      <CirclePlay aria-hidden="true" strokeWidth={1.7} />
      <span>{copy.workflow.resume}</span>
    </button>
  ) : (
    <button type="button" className="cx-wf" onClick={() => void pause("workflow", workflowId)} title={copy.workflow.pause}>
      <CirclePause aria-hidden="true" strokeWidth={1.7} />
      <span className="sr-only">{copy.workflow.pause}</span>
    </button>
  );
}

/* ---------- Approvals ---------- */

export type Decision = "approved" | "declined";
/** What the owner decided in this preview, by action */
export function useDecisions() {
  const [decided, setDecided] = useState<Record<string, Decision>>({});
  return { decided, decide: (id: string, d: Decision) => setDecided((m) => ({ ...m, [id]: d })) };
}

/** An action waiting for the owner, opened where it was met: why it exists, what it will send, under which rule */
export function ApprovalSheet({ action, decided, onDecide, onClose }: { action: WorkspaceAction | null; decided?: Decision; onDecide: (d: Decision) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (action && !d.open) d.showModal();
    if (!action && d.open) d.close();
  }, [action]);

  return (
    <dialog
      ref={ref}
      className="cx-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {action && (
        <div className="cx-sheet__body">
          <div className="cx-sheet__head">
            <p className="cx-label">
              {action.area}
              {action.client ? ` · ${action.client}` : ""}
            </p>
            <button type="button" className="cx-iconbtn" onClick={onClose} aria-label="Close">
              <X aria-hidden="true" />
            </button>
          </div>
          <h2 id={titleId} className="cx-sheet__title">
            {action.title}
          </h2>
          <p className="cx-sheet__state">
            <StatusIcon status={decided === "approved" ? "approved" : action.status} />
            {decided === "approved" ? statusWord("approved") : statusWord(action.status)} · {action.updated}
          </p>

          <section className="cx-sheet__part">
            <p className="cx-label">{copy.approvals.why}</p>
            <p>{action.why}</p>
          </section>

          {action.preview && (
            <section className="cx-sheet__part">
              <p className="cx-label">{copy.approvals.preview}</p>
              <div className="cx-mail">
                {action.preview.to && <p className="cx-mail__to">{action.preview.to}</p>}
                {action.preview.subject && <p className="cx-mail__subject">{action.preview.subject}</p>}
                {action.preview.body?.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {action.preview.fields && (
                  <dl>
                    {action.preview.fields.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>
          )}

          <section className="cx-sheet__part cx-sheet__cols">
            <div>
              <p className="cx-label">{copy.approvals.rule}</p>
              <p>{action.permission.rule}</p>
              <p className="cx-muted">{action.permission.reason}</p>
            </div>
            <div>
              <p className="cx-label">{copy.approvals.sources}</p>
              <ul>
                {action.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="cx-sheet__foot">
            {decided ? (
              <p className="cx-sheet__done" role="status">
                <Check aria-hidden="true" />
                {decided === "approved" ? copy.approvals.approved : copy.approvals.declined}
              </p>
            ) : (
              <>
                <button type="button" className="cx-btn cx-btn--primary" onClick={() => onDecide("approved")}>
                  {copy.approvals.approve}
                </button>
                <button type="button" className="cx-btn" onClick={() => onDecide("declined")}>
                  {copy.approvals.decline}
                </button>
                <Link href={`/app/actions?action=${action.id}`} className="cx-link">
                  {copy.approvals.edit}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

/* ---------- The full briefing (the approved dial), over the page ---------- */

export function BriefingOverlay({ set, briefingId, open, onClose }: { set: DailyBriefingSet; briefingId: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="cx-briefing"
      aria-label={copy.briefing.title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <div data-theme="dark" className="cx-briefing__frame">
          <button type="button" className="cx-iconbtn cx-briefing__close" onClick={onClose} aria-label="Close the briefing">
            <X aria-hidden="true" />
          </button>
          <DailyBriefingView key={briefingId} set={set} initial={briefingId} />
        </div>
      )}
    </dialog>
  );
}

/** Whether Syxoria is suspended everywhere, for the Core's look */
export function useSuspended() {
  const { state } = useAutomation();
  return Boolean(globalHold(state));
}

/** A small line chart of a few points, drawn to the box it is given */
export function Spark({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * 100).toFixed(2)} ${(28 - ((p - min) / span) * 24).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" className={cn("cx-spark", className)}>
      <path d={d} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
