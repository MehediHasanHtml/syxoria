"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarClock, Check } from "lucide-react";
import { ChangeIcon, DirectionMark, SeverityMark, StatusIcon } from "@/components/briefing/marks";
import { AutomationControl } from "@/components/dashboard/automation/automation-status";
import { AgendaMenu } from "@/components/dashboard/global/agenda-menu";
import { CommandSearch } from "@/components/dashboard/global/command-search";
import { NotificationsMenu } from "@/components/dashboard/shell-menus";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { briefingTime, dailyBriefing as briefingCopy } from "@/content/briefing";
import { overviewConcepts as copy } from "@/content/overview-concepts";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, BriefingMetric } from "@/types";
import type { OverviewConceptData } from "./data";
import {
  ActionLine,
  ApprovalSheet,
  BriefingOverlay,
  periodName,
  SPACES,
  Spark,
  storyOfBriefing,
  timeOf,
  updatesLine,
  useBriefing,
  useDecisions,
  WhyToggle,
  WorkflowSwitch,
} from "./shared";

/**
 * Concept A, the Executive Command Center: the overview as an edition of the business, set like a
 * front page. One lead (the briefing's priority) commands the page through type alone, the
 * reasoning reads beneath it as a short story (why, what I recommend, what I can do), what waits
 * for the owner runs down the margin, and the figures close the page as supporting evidence.
 * The three briefings of the day are its editions. The Core speaks only from the masthead.
 */
export function CommandCenter({ data, initial }: { data: OverviewConceptData; initial?: string }) {
  const { set } = data;
  const { briefing, select, isLatest } = useBriefing(set, initial);
  const story = storyOfBriefing(briefing);
  const [matters, why, recommend, can] = story.steps;
  const [overlay, setOverlay] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const { decided, decide } = useDecisions();
  const latest = set.briefings[set.briefings.length - 1];

  const statusOf = (a: BriefingActionItem) => (decided[a.id] === "approved" ? "approved" : a.status);
  const carried = briefing.actions.filter((a) => a.recommendationId === briefing.recommendation.id);
  const waiting = data.actions.filter((a) => a.status === "awaiting-approval");
  const waitingNow = waiting.filter((a) => !decided[a.id]);
  const sheetAction = data.actions.find((a) => a.id === sheet) ?? null;
  const since = briefing.comparedWith ? briefingTime(briefing.comparedWith.preparedAt) : null;
  // the decision this recommendation itself waits on, if any (other approvals stay in the margin)
  const ownWaiting = carried.find((a) => a.status === "awaiting-approval");

  return (
    <div className="ca">
      {/* ---------- Masthead: the six spaces, and the tools that follow the owner everywhere ---------- */}
      <header className="ca-mast">
        <Link href="/concept/overview/command-center" className="ca-mast__brand" aria-label="Syxoria, Executive Overview">
          <span className="ca-word">Syxoria</span>
          <span className="ca-company">{set.company}</span>
        </Link>
        <nav className="ca-nav" aria-label="Spaces">
          {SPACES.map((s) =>
            s.id === "overview" ? (
              <span key={s.id} aria-current="page" className="ca-nav__item" title={copy.spaces[s.id].full}>
                {copy.spaces[s.id].label}
              </span>
            ) : (
              <Link key={s.id} href={s.href} className="ca-nav__item" title={copy.spaces[s.id].full}>
                {copy.spaces[s.id].label}
                {s.id === "actions" && waitingNow.length > 0 && <span className="ca-nav__count tabular">{waitingNow.length}</span>}
              </Link>
            ),
          )}
        </nav>
        <div className="ca-tools">
          <div className="ca-search">
            <CommandSearch index={data.searchIndex} />
          </div>
          <AutomationControl />
          <AgendaMenu events={data.events} />
          <NotificationsMenu notifications={data.notifications} />
          <ThemeToggle />
          <Avatar initials={data.user.initials} name={data.user.name} />
        </div>
      </header>

      <main className="ca-page">
        {/* ---------- Dateline: the day's three briefings are its editions ---------- */}
        <div className="ca-dateline">
          <p className="ca-date">{dayOf(set.date)}</p>
          <div role="radiogroup" aria-label={briefingCopy.periodsLabel} className="ca-editions">
            {set.briefings.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={b.id === briefing.id}
                onClick={() => select(b.id)}
                className="ca-edition"
              >
                <span>{periodName(b)}</span>
                <span className="ca-edition__time tabular">{timeOf(b)}</span>
                {b.example && <span className="ca-tag">{copy.briefing.example}</span>}
                {b.id === latest.id && <span className="ca-edition__latest" aria-label={copy.briefing.latest} />}
              </button>
            ))}
          </div>
          <div className="ca-dateline__end">
            <button type="button" className="ca-textbtn" onClick={() => setOverlay(true)}>
              {copy.briefing.open}
              <ArrowUpRight aria-hidden="true" />
            </button>
            <Link href="/app/history" className="ca-textbtn ca-textbtn--quiet">
              {copy.briefing.earlier}
            </Link>
          </div>
        </div>

        <div className="ca-grid">
          <div className="ca-main">
            {/* ---------- The lead: what matters now ---------- */}
            <article className="ca-lead" key={briefing.id}>
              <p className="ca-greet">
                {briefingCopy.greeting[briefing.period]}, {set.owner.firstName}. <span>{briefing.headline}</span>
              </p>
              <div className="ca-lead__grid">
                <div>
                  <p className="ca-kicker">
                    <span>{copy.questions.matters}</span>
                    <span className="ca-kicker__sev">
                      <SeverityMark level={briefing.priority.severity} />
                      {briefingCopy.severity[briefing.priority.severity]}
                    </span>
                    {briefing.priority.change && since && briefing.priority.change.kind !== "unchanged" && (
                      <span className="ca-tag">{briefing.priority.change.kind === "new" ? copy.briefing.newSince(since) : copy.briefing.changedSince(since)}</span>
                    )}
                  </p>
                  <h1 className="ca-headline">{briefing.priority.title}</h1>
                  <p className="ca-standfirst">
                    {briefing.priority.why}
                    {briefing.priority.detail && <span className="ca-standfirst__detail"> {briefing.priority.detail}.</span>}
                  </p>
                  <div className="ca-lead__links">
                    <WhyToggle step={matters} className="ca-why" />
                    <Link href={`/app/assistant?q=${encodeURIComponent(briefing.priority.title)}`} className="ca-textbtn ca-textbtn--quiet">
                      {copy.ask.about}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                {briefing.priority.metric && (
                  <aside className="ca-figure" aria-label="The figure behind it">
                    <MetricBlock metric={briefing.priority.metric} />
                  </aside>
                )}
              </div>
              {!isLatest && (
                <p className="ca-earlier">
                  {`You are reading the ${periodName(briefing).toLowerCase()} briefing.`}
                  <button type="button" className="ca-textbtn" onClick={() => select(latest.id)}>
                    Back to the latest
                  </button>
                </p>
              )}
            </article>

            {/* ---------- The reasoning: why, what I recommend, what I can do ---------- */}
            <section className="ca-story" aria-label="The reasoning" key={`${briefing.id}-story`}>
              <div className="ca-story__why">
                <p className="ca-kicker">
                  <span>{copy.questions.why}</span>
                </p>
                <h2 className="ca-h2">{why.title}</h2>
                <p className="ca-body">{why.body}</p>
                {why.metric && (
                  <p className="ca-inline-figure">
                    <InlineMetric metric={why.metric} />
                  </p>
                )}
                {why.evidence && (
                  <ul className="ca-facts">
                    {why.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ca-story__rec">
                <p className="ca-kicker ca-kicker--syx">
                  <span>{copy.questions.recommend}</span>
                </p>
                <h2 className="ca-rec">{recommend.title}</h2>
                <p className="ca-body">{recommend.body}</p>
                {recommend.detail && <p className="ca-body ca-body--quiet">{recommend.detail}</p>}
                <div className="ca-rec__do">
                  {ownWaiting && !decided[ownWaiting.id] ? (
                    <button type="button" className="cx-btn cx-btn--primary" onClick={() => setSheet(ownWaiting.id)}>
                      Review and approve
                    </button>
                  ) : (
                    <Link href={`/app/assistant?q=${encodeURIComponent(recommend.title)}`} className="cx-btn cx-btn--primary">
                      Prepare it with Syxoria
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  )}
                  <WhyToggle step={recommend} className="ca-why" />
                </div>

                <div className="ca-can">
                  <p className="ca-kicker">
                    <span>{copy.questions.can}</span>
                    <span className="ca-kicker__note">{can.title}</span>
                  </p>
                  <ul className="ca-actions">
                    {(carried.length ? carried : briefing.actions.slice(0, 3)).map((a) => (
                      <ActionLine key={a.id} action={a} status={statusOf(a)}>
                        <WorkflowSwitch workflowId={a.workflowId} />
                      </ActionLine>
                    ))}
                  </ul>
                  <p className="ca-mode">
                    {briefingCopy.actions.mode(set.autonomy.name)}. {set.autonomy.promise} {set.autonomy.limit}
                  </p>
                </div>
              </div>
            </section>

            {/* ---------- What is already done ---------- */}
            <section className="ca-done" aria-label={copy.questions.done} key={`${briefing.id}-done`}>
              <div className="ca-done__head">
                <p className="ca-kicker">
                  <span>{copy.questions.done}</span>
                  <span className="ca-kicker__note">{updatesLine(briefing)}</span>
                </p>
                <h2 className="ca-h2">{briefing.followThrough.title}</h2>
              </div>
              <ol className="ca-thread">
                {briefing.followThrough.steps.map((s) => (
                  <li key={s.id} data-state={s.state}>
                    <span className="ca-thread__dot" aria-hidden="true" />
                    <span className="ca-thread__label">{s.label}</span>
                    <span className="ca-thread__when tabular">{s.when}</span>
                    {s.detail && <span className="ca-thread__detail">{s.detail}</span>}
                    <span className="sr-only">, {briefingCopy.follow.states[s.state]}</span>
                  </li>
                ))}
              </ol>
              {briefing.changes && briefing.changes.length > 0 && (
                <ul className="ca-changes">
                  {briefing.changes
                    .filter((c) => c.highlight)
                    .slice(0, 3)
                    .map((c) => (
                      <li key={c.id}>
                        <ChangeIcon kind={c.kind} />
                        <span>
                          <span className="ca-changes__title">{c.title}</span>
                          {c.detail && <span className="ca-changes__detail">{c.detail}</span>}
                        </span>
                        {c.at && <span className="ca-changes__at tabular">{c.at}</span>}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>

          {/* ---------- The margin: what waits, what comes, what else ---------- */}
          <aside className="ca-margin" aria-label="On your desk">
            <section className="ca-note">
              <h2 className="ca-note__title">
                {copy.approvals.title}
                <span className="ca-note__count tabular">{waitingNow.length}</span>
              </h2>
              {waiting.length ? (
                <ul className="ca-approvals">
                  {waiting.slice(0, 3).map((a) => (
                    <li key={a.id} data-decided={decided[a.id]}>
                      <button type="button" onClick={() => setSheet(a.id)}>
                        <StatusIcon status={decided[a.id] === "approved" ? "approved" : a.status} />
                        <span className="ca-approvals__text">
                          <span className="ca-approvals__title">{a.title}</span>
                          <span className="ca-approvals__why">{decided[a.id] ? (decided[a.id] === "approved" ? "Approved in this preview" : "Set aside in this preview") : a.purpose}</span>
                        </span>
                        <ArrowRight aria-hidden="true" className="ca-approvals__go" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ca-muted">{copy.approvals.none}</p>
              )}
              {waiting.length > 3 && (
                <Link href="/app/actions" className="ca-textbtn ca-textbtn--quiet">
                  {`All ${waiting.length} in Actions`}
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </section>

            <section className="ca-note">
              <h2 className="ca-note__title">{copy.agenda.title}</h2>
              <ul className="ca-agenda">
                {data.events.slice(0, 4).map((e) => (
                  <li key={e.id}>
                    <span className="ca-agenda__when tabular">
                      {e.day} <strong>{e.time}</strong>
                    </span>
                    <Link href={e.href} className="ca-agenda__title">
                      {e.title}
                    </Link>
                    {e.with && <span className="ca-agenda__with">{e.with}</span>}
                  </li>
                ))}
              </ul>
            </section>

            <section className="ca-note">
              <h2 className="ca-note__title">{copy.signals.title}</h2>
              <ul className="ca-signals">
                {data.signals.map((s) => (
                  <li key={s.id}>
                    <Link href={s.href}>
                      <span className="ca-signals__title">{s.title}</span>
                      <span className="ca-signals__detail">{s.detail}</span>
                      {(s.stake || s.due) && (
                        <span className="ca-signals__meta tabular">
                          {s.stake}
                          {s.stake && s.due ? " · " : ""}
                          {s.due}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        {/* ---------- The figures: supporting evidence, closing the page ---------- */}
        <section className="ca-figures" aria-label={copy.figures.title}>
          <div className="ca-figures__head">
            <p className="ca-kicker">
              <span>{copy.figures.title}</span>
            </p>
            <Link href="/app/business/sales" className="ca-textbtn ca-textbtn--quiet">
              {copy.figures.all}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <ul className="ca-figures__row">
            {data.figures.map((f) => (
              <li key={f.id}>
                <Link href={f.href}>
                  <span className="ca-figures__label">{f.label}</span>
                  <span className="ca-figures__value tabular">{f.value}</span>
                  <span className="ca-figures__caption">{f.caption}</span>
                  {f.trend ? (
                    <span className={cn("ca-figures__trend", f.trend.good ? "is-good" : "is-bad")}>
                      <DirectionMark direction={f.trend.direction} className="size-3.5" />
                      {f.trend.text}
                    </span>
                  ) : f.note ? (
                    <span className="ca-figures__trend">{f.note}</span>
                  ) : null}
                  {f.spark ? <Spark points={f.spark} /> : f.progress !== undefined ? <Progress share={f.progress} /> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <ApprovalSheet action={sheetAction} decided={sheet ? decided[sheet] : undefined} onDecide={(d) => sheet && decide(sheet, d)} onClose={() => setSheet(null)} />
      <BriefingOverlay set={set} briefingId={briefing.id} open={overlay} onClose={() => setOverlay(false)} />
    </div>
  );
}

/* ---------- The figure of a step, set for what it is ---------- */

function MetricBlock({ metric }: { metric: BriefingMetric }) {
  if (metric.kind === "message")
    return (
      <>
        <p className="ca-figure__label">
          <SeverityMark level={metric.urgency} />
          {briefingCopy.severity[metric.urgency]}
        </p>
        <p className="ca-figure__quote">“{metric.value}”</p>
        <p className="ca-figure__caption">{metric.caption}</p>
      </>
    );
  return (
    <>
      <p className="ca-figure__value tabular" data-kind={metric.kind}>
        {metric.kind === "change" && <DirectionMark direction={metric.direction} className="ca-figure__mark" />}
        {metric.kind === "result" && <Check aria-hidden="true" className="ca-figure__mark" strokeWidth={1.5} />}
        {metric.value}
      </p>
      <p className="ca-figure__caption">{metric.caption}</p>
      {metric.kind === "change" && metric.from && <p className="ca-figure__meta">{briefingCopy.figure.from(metric.from)}</p>}
      {metric.kind === "deadline" && (
        <p className="ca-figure__meta">
          <CalendarClock aria-hidden="true" />
          {briefingCopy.figure.due(metric.due)}
        </p>
      )}
      {metric.kind === "progress" && <Progress share={metric.share} />}
    </>
  );
}

function InlineMetric({ metric }: { metric: BriefingMetric }) {
  return (
    <>
      {metric.kind === "change" && <DirectionMark direction={metric.direction} className="size-3.5" />}
      <strong className="tabular">{metric.value}</strong> <span>{metric.caption}</span>
    </>
  );
}

function Progress({ share }: { share: number }) {
  return (
    <span className="ca-progress" aria-hidden="true">
      <span style={{ width: `${Math.round(share * 100)}%` }} />
    </span>
  );
}

/* ---------- Helpers ---------- */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "Wednesday 14 October", the same on the server and in the browser */
function dayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[day]} ${d} ${MONTHS[m - 1]}`;
}

