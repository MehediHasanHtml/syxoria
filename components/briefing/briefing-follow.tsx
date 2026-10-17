"use client";

import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useAutomationIfAny } from "@/components/dashboard/automation/automation-provider";
import { automation as words } from "@/content/automation";
import { dailyBriefing as copy } from "@/content/briefing";
import { isHeld } from "@/lib/automation";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, BriefingFollowStep, DailyBriefing } from "@/types";
import { STATUS_ORDER, StatusIcon } from "./marks";

/**
 * Under the dial, what Syxoria is doing about it. By default, the thread that follows the
 * priority from the moment it was found to the deal closing (done · under way · to come · did not
 * go through), and beside its title where every action stands, most pressing first ("1 needs you ·
 * 2 sent"). That summary opens the list of every action with its status — drafted, awaiting
 * approval, scheduled, in progress, sent, completed, unsuccessful — each line opening on its
 * next step and the recommendation it carries out. Nothing here approves or sends: that happens
 * in the workspace, and the panel says so.
 *
 * Through the day, the thread is the same thread moving on: the steps that moved since the
 * previous briefing (done, under way or failed since then) carry a quiet emerald halo, and the
 * panel names it ("Moved since 8:00").
 */
export function FollowThroughPanel({
  briefing,
  previous,
  since,
  onShowRecommendation,
  onViewChange,
}: {
  briefing: DailyBriefing;
  /** The previous briefing's thread, to show what moved since */
  previous?: BriefingFollowStep[];
  /** The previous briefing's time */
  since: string | null;
  onShowRecommendation: () => void;
  /** Told before every action opens or closes, so the page can make room for the list */
  onViewChange?: (all: boolean) => void;
}) {
  const [all, setOpen] = useState(false);
  const setAll = (open: boolean) => {
    onViewChange?.(open);
    setOpen(open);
  };
  const { actions, followThrough } = briefing;
  const before = new Map(previous?.map((s) => [s.id, s.state]));
  const moved = (s: BriefingFollowStep) => Boolean(previous && since) && s.state !== "next" && before.get(s.id) !== s.state;
  const anyMoved = !all && followThrough.steps.some(moved);
  const waiting = actions.filter((a) => a.status === "awaiting-approval").length;
  const running = actions.filter((a) => a.status === "in-progress").length;
  const failed = actions.filter((a) => a.status === "unsuccessful").length;
  const counts = STATUS_ORDER.map((status) => ({ status, n: actions.filter((a) => a.status === status).length })).filter((c) => c.n > 0);
  const summary = counts.map((c) => copy.actions.counts[c.status](c.n)).join(", ");

  return (
    <section aria-label={copy.follow.title} className="bd-follow" data-view={all ? "actions" : "thread"}>
      <div className="bd-follow__head">
        <div className="min-w-0">
          <p className="bd-label">
            {all ? copy.actions.title : copy.follow.title}
            {anyMoved && since && (
              <span className="bd-follow__key">
                <span aria-hidden="true" className="bd-follow__dot" />
                {copy.day.moved(since)}
              </span>
            )}
          </p>
          <p className="bd-follow__title">{all ? copy.actions.summary(failed, waiting, running) : followThrough.title}</p>
        </div>
        {all ? (
          <button type="button" className="bd-link bd-link--why shrink-0" aria-expanded onClick={() => setAll(false)}>
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            {copy.follow.thread}
          </button>
        ) : (
          <button type="button" className="bd-counts" aria-expanded={false} aria-label={`${copy.follow.all} (${actions.length}): ${summary}`} onClick={() => setAll(true)}>
            {counts.map((c) => (
              <span key={c.status} className="bd-counts__item" data-status={c.status}>
                <StatusIcon status={c.status} ring={false} />
                {copy.actions.counts[c.status](c.n)}
              </span>
            ))}
            <span className="bd-counts__all">
              {copy.follow.all}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </span>
          </button>
        )}
      </div>
      {all ? (
        <ActionList actions={actions} recommendation={briefing.recommendation} onShowRecommendation={onShowRecommendation} />
      ) : (
        <Thread key={briefing.id} steps={followThrough.steps} moved={moved} since={since} />
      )}
    </section>
  );
}

function Thread({ steps, moved, since }: { steps: BriefingFollowStep[]; moved: (s: BriefingFollowStep) => boolean; since: string | null }) {
  return (
    <ol className="bd-thread" style={{ "--n": steps.length } as CSSProperties}>
      {steps.map((s, i) => (
        <li key={s.id} className="bd-thread__step" data-state={s.state} data-moved={moved(s) || undefined} style={{ "--i": i } as CSSProperties}>
          <span aria-hidden="true" className="bd-thread__node">
            {s.state === "done" && <Check className="size-3" strokeWidth={2.6} />}
            {s.state === "failed" && <CircleAlert className="size-3.5" strokeWidth={2} />}
          </span>
          <span className="bd-thread__label">{s.label}</span>
          <span className="bd-thread__when tabular">{s.when}</span>
          {s.detail && <span className="bd-thread__detail">{s.detail}</span>}
          <span className="sr-only">
            , {copy.follow.states[s.state]}
            {moved(s) && since && `, ${copy.day.moved(since).toLowerCase()}`}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ActionList({
  actions,
  recommendation,
  onShowRecommendation,
}: {
  actions: BriefingActionItem[];
  recommendation: { id: string; title: string };
  onShowRecommendation: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  // in the workspace, what a hold keeps from starting says so beside its status
  const automation = useAutomationIfAny();
  return (
    <ul className="bd-actions">
      {actions.map((a) => {
        const expanded = open === a.id;
        const asks = a.needsApproval && (a.status === "awaiting-approval" || a.status === "drafted");
        const held = automation ? isHeld(automation.state, automation.ctx, a.id) : false;
        return (
          <li key={a.id} className="bd-action" data-status={a.status} data-open={expanded || undefined}>
            <button type="button" className="bd-action__row" aria-expanded={expanded} aria-controls={`bd-action-${a.id}`} onClick={() => setOpen(expanded ? null : a.id)}>
              <StatusIcon status={a.status} />
              <span className="bd-action__name">{a.name}</span>
              <span className="bd-action__state">
                {held && <span className="ax-held">{words.settings.targeted.paused}</span>}
                <span className="bd-action__status">{copy.actions.statuses[a.status]}</span>
                <span className="bd-action__timing tabular">{a.timing}</span>
              </span>
              <ChevronDown aria-hidden="true" className={cn("bd-action__chevron size-3.5", expanded && "rotate-180")} />
            </button>
            <div id={`bd-action-${a.id}`} className="bd-action__more" hidden={!expanded}>
              {asks && (
                <p className="bd-action__asks">
                  {copy.actions.needsYou}: {a.note}
                </p>
              )}
              {!asks && a.note && <p>{a.note}</p>}
              {a.next && (
                <p>
                  <span className="text-fg-3">{copy.actions.next}: </span>
                  {a.next}
                </p>
              )}
              <p>
                <span className="text-fg-3">{copy.actions.carriesOut}: </span>
                {a.recommendationId === recommendation.id ? (
                  <button type="button" className="bd-link bd-link--inline" onClick={onShowRecommendation}>
                    {recommendation.title}
                  </button>
                ) : (
                  copy.actions.earlier
                )}
              </p>
              {a.status === "awaiting-approval" && <p className="text-fg-3">{copy.actions.approveElsewhere}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
