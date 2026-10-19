"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Archive, ArrowRight, ArrowUp, ChartSpline, Compass, ListChecks, MessageCircle, Settings2, Sun, Sunrise, Sunset, X, type LucideIcon } from "lucide-react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { SeverityMark, StatusIcon } from "@/components/briefing/marks";
import { AutomationControl } from "@/components/dashboard/automation/automation-status";
import { AgendaMenu } from "@/components/dashboard/global/agenda-menu";
import { CommandSearch } from "@/components/dashboard/global/command-search";
import { NotificationsMenu } from "@/components/dashboard/shell-menus";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { dailyBriefing as briefingCopy } from "@/content/briefing";
import { overviewConcepts as copy } from "@/content/overview-concepts";
import type { CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, BriefingPeriod } from "@/types";
import type { Lens, OverviewConceptData } from "./data";
import {
  ActionLine,
  ApprovalSheet,
  BriefingOverlay,
  periodName,
  SPACES,
  Spark,
  storyOfBriefing,
  storyOfLens,
  timeOf,
  updatesLine,
  useBriefing,
  useDecisions,
  useSuspended,
  WhyToggle,
  WorkflowSwitch,
  type SpaceId,
  type StoryKey,
} from "./shared";

const SPACE_ICON: Record<SpaceId, LucideIcon> = { overview: Compass, business: ChartSpline, assistant: MessageCircle, actions: ListChecks, workspace: Archive, settings: Settings2 };
const PERIOD_ICON: Record<BriefingPeriod, LucideIcon> = { morning: Sunrise, midday: Sun, evening: Sunset };

/** How the Core looks while each question is in view: it finds, understands, proposes, acts, rests */
const CORE_FOR: Record<StoryKey, CoreState> = { matters: "identifying", why: "understanding", recommend: "ready", can: "executing", done: "active" };

/** Where each lens sits on the ring around the Core, as an angle (0 is to the right, 90 below) */
const ANGLE: Record<Lens["id"], number> = { sales: 196, clients: 152, goals: 270, marketing: 344, finance: 28 };

/**
 * Concept B, the Living Intelligence Environment: the overview as one place the owner enters, with
 * the Core at its centre. The parts of the business sit around it on one quiet ring, each saying
 * where it stands tonight; the briefing speaks from the left; the reasoning runs as one thread on
 * the right, one question open at a time, and the Core takes the look of the step in view. What
 * waits, what comes, what is done and the figures rest along the bottom. Choosing a lens turns the
 * whole environment to that part of the business, without leaving the page.
 */
export function LivingEnvironment({ data, initial }: { data: OverviewConceptData; initial?: string }) {
  const { set } = data;
  const router = useRouter();
  const { briefing, select, isLatest } = useBriefing(set, initial);
  const [lensId, setLensId] = useState<Lens["id"] | null>(null);
  const lens = data.lenses.find((l) => l.id === lensId) ?? null;
  const story = lens ? storyOfLens(lens) : storyOfBriefing(briefing);
  const [open, setOpen] = useState<StoryKey>("matters");
  const [pulse, setPulse] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const [ask, setAsk] = useState("");
  const { decided, decide } = useDecisions();
  const suspended = useSuspended();
  const latest = set.briefings[set.briefings.length - 1];

  const statusOf = (a: BriefingActionItem) => (decided[a.id] === "approved" ? "approved" : a.status);
  const waiting = data.actions.filter((a) => a.status === "awaiting-approval");
  const waitingNow = waiting.filter((a) => !decided[a.id]);
  const sheetAction = data.actions.find((a) => a.id === sheet) ?? null;
  const carried = briefing.actions.filter((a) => a.recommendationId === briefing.recommendation.id);
  const progress = briefing.action.metric?.kind === "progress" ? briefing.action.metric : null;
  // the lens the briefing's priority comes from: the one the Core points at first
  const priorityLens = data.lenses.find((l) => l.tone === "attention");

  const show = (key: StoryKey) => {
    setOpen(key);
    setPulse((p) => p + 1);
  };
  const turnTo = (id: Lens["id"] | null) => {
    setLensId(id);
    show("matters");
  };

  return (
    <div className="ev">
      {/* ---------- The bar: the six spaces in one pill, the tools at the edge ---------- */}
      <header className="sx-bar">
        <Link href="/concept/overview/living" className="sx-brand" aria-label="Syxoria, Executive Overview">
          Syxoria
        </Link>
        <nav className="sx-spaces" aria-label="Spaces">
          {SPACES.map((s) => {
            const Icon = SPACE_ICON[s.id];
            const label = copy.spaces[s.id].label;
            const inner = (
              <>
                <Icon aria-hidden="true" strokeWidth={1.6} />
                <span className="sx-spaces__label">{label}</span>
                {s.id === "actions" && waitingNow.length > 0 && <span className="sx-spaces__count tabular">{waitingNow.length}</span>}
              </>
            );
            return s.id === "overview" ? (
              <span key={s.id} aria-current="page" className="sx-spaces__item" title={copy.spaces[s.id].full}>
                {inner}
              </span>
            ) : (
              <Link key={s.id} href={s.href} className="sx-spaces__item" title={copy.spaces[s.id].full} aria-label={label}>
                {inner}
              </Link>
            );
          })}
        </nav>
        <div className="sx-tools">
          <div className="sx-search">
            <CommandSearch index={data.searchIndex} />
          </div>
          <AutomationControl />
          <AgendaMenu events={data.events} />
          <NotificationsMenu notifications={data.notifications} />
          <ThemeToggle />
          <Avatar initials={data.user.initials} name={data.user.name} />
        </div>
      </header>

      <main className="ev-stage">
        {/* ---------- The briefing speaks ---------- */}
        <section className="ev-voice" aria-label={`${periodName(briefing)} briefing`} key={`voice-${briefing.id}`}>
          <p className="ev-voice__greet">
            {briefingCopy.greeting[briefing.period]}, {set.owner.firstName}.
          </p>
          <h1 className="ev-voice__headline">{briefing.headline}</h1>
          <p className="ev-voice__line">{updatesLine(briefing)}</p>
          <div className="ev-voice__do">
            <button
              type="button"
              className="cx-btn cx-btn--primary"
              onClick={() => {
                turnTo(null);
                document.getElementById("ev-thread")?.focus();
              }}
            >
              See what needs you
              <ArrowRight aria-hidden="true" />
            </button>
            <button type="button" className="ev-voice__link" onClick={() => setOverlay(true)}>
              {copy.briefing.open}
            </button>
          </div>

          <div role="radiogroup" aria-label={briefingCopy.periodsLabel} className="ev-periods">
            {set.briefings.map((b) => {
              const Icon = PERIOD_ICON[b.period];
              return (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={b.id === briefing.id}
                  className="ev-period"
                  onClick={() => {
                    select(b.id);
                    turnTo(null);
                  }}
                >
                  <Icon aria-hidden="true" strokeWidth={1.6} />
                  <span>{periodName(b)}</span>
                  <span className="ev-period__time tabular">{timeOf(b)}</span>
                  {b.example && <span className="cx-tag">{copy.briefing.example}</span>}
                  {b.id === latest.id && <span className="ev-period__latest" aria-label={copy.briefing.latest} />}
                </button>
              );
            })}
          </div>
          {!isLatest && (
            <button type="button" className="ev-back" onClick={() => select(latest.id)}>
              Back to the latest briefing
            </button>
          )}
        </section>

        {/* ---------- The Core, and the business around it ---------- */}
        <section className="ev-heart" aria-label="Your business, around Syxoria">
          <div className="ev-ring">
            <svg className="ev-ring__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx="50" cy="50" rx="49.6" ry="49.4" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="ev-ring__pool" aria-hidden="true" />
            <button type="button" className="ev-core" onClick={() => turnTo(null)} aria-label="Back to the briefing" data-on={lens ? undefined : true}>
              <SyxoriaCore state={suspended ? "paused" : CORE_FOR[open]} pulse={pulse} label={`Syxoria, ${suspended ? "suspended" : "working"}`} className="ev-core__svg" />
            </button>
            <ul className="ev-lenses">
              {data.lenses.map((l) => {
                const a = (ANGLE[l.id] * Math.PI) / 180;
                const style = { "--x": `${50 + 50 * Math.cos(a)}%`, "--y": `${50 + 50 * Math.sin(a)}%` } as CSSProperties;
                return (
                  <li key={l.id} style={style} className="ev-lens" data-tone={l.tone} data-on={l.id === lensId || undefined} data-source={!lensId && l.id === priorityLens?.id ? true : undefined}>
                    <button type="button" aria-pressed={l.id === lensId} onClick={() => turnTo(l.id === lensId ? null : l.id)}>
                      <span className="ev-lens__dot" aria-hidden="true" />
                      <span className="ev-lens__text">
                        <span className="ev-lens__name">{l.name}</span>
                        <span className="ev-lens__word">{l.word}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="ev-heart__state" aria-live="polite">
            {suspended ? "Suspended. Nothing starts on its own." : `${set.autonomy.name} mode. ${set.autonomy.promise}`}
          </p>
          <form
            className="ev-ask"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/app/assistant${ask.trim() ? `?q=${encodeURIComponent(ask.trim())}` : ""}`);
            }}
          >
            <label className="sr-only" htmlFor="ev-ask">
              {copy.ask.placeholder}
            </label>
            <input id="ev-ask" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={lens ? `Ask about ${lens.name.toLowerCase()}` : copy.ask.placeholder} autoComplete="off" />
            <button type="submit" aria-label={copy.ask.send}>
              <ArrowUp aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* ---------- The thread: one question open at a time ---------- */}
        <section id="ev-thread" tabIndex={-1} className="ev-thread" aria-label="The reasoning" key={`thread-${story.id}`}>
          <div className="ev-thread__head">
            <p className="cx-label">
              <SeverityMark level={story.severity} />
              {story.label}
            </p>
            {lens && (
              <button type="button" className="ev-thread__back" onClick={() => turnTo(null)}>
                <X aria-hidden="true" />
                <span>Back to the briefing</span>
              </button>
            )}
            {(story.stake || story.due) && (
              <p className="ev-thread__meta tabular">
                {story.stake}
                {story.stake && story.due ? " · " : ""}
                {story.due}
              </p>
            )}
          </div>
          <ol className="ev-steps">
            {story.steps.map((s) => {
              const expanded = s.key === open;
              return (
                <li key={s.key} className="ev-step" data-state={s.state} data-open={expanded || undefined}>
                  <span className="ev-step__node" aria-hidden="true" />
                  <button type="button" className="ev-step__head" aria-expanded={expanded} onClick={() => show(s.key)}>
                    <span className="ev-step__q">{copy.questions[s.key]}</span>
                    <span className="ev-step__title">{s.title}</span>
                  </button>
                  {expanded && (
                    <div className="ev-step__body">
                      {s.body && s.body !== s.title && <p>{s.body}</p>}
                      {s.detail && <p className="cx-muted">{s.detail}</p>}
                      {s.key === "can" && !lens && (
                        <ul className="ev-step__actions">
                          {carried.map((a) => (
                            <ActionLine key={a.id} action={a} status={statusOf(a)}>
                              <WorkflowSwitch workflowId={a.workflowId} />
                            </ActionLine>
                          ))}
                        </ul>
                      )}
                      {s.key === "done" && s.evidence && (
                        <ul className="ev-step__list">
                          {s.evidence.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {s.key !== "done" && <WhyToggle step={s} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <Link href={lens ? story.cta.href : "/app/actions"} className="ev-thread__cta">
            {lens ? story.cta.label : "Follow every action"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>

      {/* ---------- Along the bottom: what waits, what comes, what is done, the figures ---------- */}
      <footer className="ev-dock">
        <section className="ev-pane ev-pane--wait">
          <p className="cx-label">{copy.approvals.title}</p>
          <p className="ev-pane__big tabular">{waitingNow.length}</p>
          {waitingNow[0] ? (
            <button type="button" className="ev-pane__item" onClick={() => setSheet(waitingNow[0].id)}>
              <StatusIcon status={waitingNow[0].status} />
              <span>{waitingNow[0].title}</span>
              <span className="ev-pane__go">{copy.approvals.review}</span>
            </button>
          ) : (
            <p className="cx-muted">{copy.approvals.none}</p>
          )}
        </section>

        <section className="ev-pane">
          <p className="cx-label">{copy.agenda.title}</p>
          <ul className="ev-pane__agenda">
            {data.events.slice(0, 2).map((e) => (
              <li key={e.id}>
                <span className="tabular">
                  {e.day} {e.time}
                </span>
                <Link href={e.href}>{e.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="ev-pane">
          <p className="cx-label">{copy.done.title}</p>
          {progress ? (
            <>
              <p className="ev-pane__big tabular">{progress.value}</p>
              <p className="ev-pane__unit">{progress.caption}</p>
            </>
          ) : (
            <p className="ev-pane__line">{briefing.followThrough.title}</p>
          )}
          <ol className="ev-pane__trail" aria-label={briefing.followThrough.title}>
            {briefing.followThrough.steps.map((s) => (
              <li key={s.id} data-state={s.state} title={`${s.label}, ${s.when}`}>
                <span className="sr-only">
                  {s.label}, {s.when}, {briefingCopy.follow.states[s.state]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="ev-pane ev-pane--figures">
          <div className="ev-pane__row">
            <p className="cx-label">{copy.figures.title}</p>
            <Link href="/app/business/sales" className="ev-pane__more" aria-label={copy.figures.all}>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <ul className="ev-figures">
            {data.figures.map((f) => (
              <li key={f.id}>
                <Link href={f.href}>
                  <span className="ev-figures__label">{f.label}</span>
                  <span className="ev-figures__value tabular">{f.value}</span>
                  {f.spark ? <Spark points={f.spark} /> : <span className={cn("ev-figures__bar")} style={{ "--share": f.progress ?? 0 } as CSSProperties} />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </footer>

      <ApprovalSheet action={sheetAction} decided={sheet ? decided[sheet] : undefined} onDecide={(d) => sheet && decide(sheet, d)} onClose={() => setSheet(null)} />
      <BriefingOverlay set={set} briefingId={briefing.id} open={overlay} onClose={() => setOverlay(false)} />
    </div>
  );
}
