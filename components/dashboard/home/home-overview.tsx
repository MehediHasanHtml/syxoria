import Link from "next/link";
import { ArrowRight, CalendarClock, Lightbulb, TrendingDown, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { FigureLine } from "@/components/briefing/briefing-figure";
import { Timeline } from "@/components/briefing/briefing-changes";
import { DirectionMark, SeverityMark, StatusIcon } from "@/components/briefing/marks";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { briefingTime, dailyBriefing as words } from "@/content/briefing";
import { overview as copy } from "@/content/overview";
import { cn } from "@/lib/cn";
import type { BriefingActionItem, HomeOverview, HomeSignal } from "@/types";

const dayOf = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

const SIGNAL: Record<HomeSignal["kind"], LucideIcon> = { risk: TriangleAlert, opportunity: TrendingUp, deadline: CalendarClock, decline: TrendingDown };

/**
 * The workspace home: the executive overview. It reads top to bottom as one line, from
 * understanding to action: where the business stands (the greeting, the latest briefing's sentence,
 * four figures), what matters most (the priority, with its recommended next step), what waits for
 * the owner and what deserves attention, then what Syxoria recommends and what it has done.
 *
 * Everything comes from the latest briefing (services/overview.ts): the priority is its priority,
 * every status is read from its actions, the activity is its updates. So the home, the briefing and
 * Actions & Approvals never disagree. Nothing here approves or sends anything.
 * Layout by container queries on the main column (the shell sets `@container`). Styles: "HOME".
 */
export function HomeView({ data }: { data: HomeOverview }) {
  const { briefing, previous, owner } = data;
  const { priority, recommendation, actions } = briefing;
  const action = (id?: string) => (id ? actions.find((a) => a.id === id) : undefined);
  const waiting = actions.filter((a) => a.status === "awaiting-approval");
  const drafted = actions.filter((a) => a.status === "drafted" && a.needsApproval);
  const failed = actions.filter((a) => a.status === "unsuccessful");
  const briefingHref = `/app/briefings?briefing=${briefing.id}`;
  const updates = briefing.changes?.length ?? 0;

  return (
    <div className="hm">
      {/* A. WHERE THINGS STAND */}
      <header className="hm-head">
        <div className="min-w-0">
          <p className="bd-label">
            {dayOf(briefing.preparedAt)} · {copy.briefing(words.periods[briefing.period], briefingTime(briefing.preparedAt))}
          </p>
          <h1 className="hm-title">
            {words.greeting[briefing.period]}
            {owner.firstName ? (
              <>
                , <em className="hm-title__name">{owner.firstName}.</em>
              </>
            ) : (
              "."
            )}
          </h1>
          <p className="hm-lead">{briefing.headline}</p>
          {previous && updates > 0 && (
            <Link href={briefingHref} className="hm-news">
              <span aria-hidden="true" className="hm-news__dot" />
              {copy.since(updates, words.periods[previous.period])}
            </Link>
          )}
        </div>
        <ButtonLink href={briefingHref} variant="secondary" className="group shrink-0">
          {copy.openBriefing}
          <ArrowNudge />
        </ButtonLink>
      </header>

      {/* B. THE FIGURES THAT SAY HOW THE BUSINESS STANDS */}
      <section aria-label={copy.figures} className="hm-figures">
        {data.indicators.map((k) => (
          <Link key={k.id} href={k.href} className="hm-figure">
            <span className="bd-label">{k.label}</span>
            <span className="hm-figure__value tabular">{k.value}</span>
            <span className="hm-figure__caption">{k.caption}</span>
            {k.progress !== undefined && (
              <span aria-hidden="true" className="hm-figure__bar">
                <span style={{ width: `${Math.round(k.progress * 100)}%` }} />
              </span>
            )}
            {k.trend ? (
              <span className="hm-figure__trend" data-good={k.trend.good || undefined}>
                <DirectionMark direction={k.trend.direction} className="size-3.5" />
                {k.trend.text}
              </span>
            ) : (
              k.note && <span className="hm-figure__note">{k.note}</span>
            )}
          </Link>
        ))}
      </section>

      {/* two columns that run on their own: on a narrow screen, one column in the order the brief asks
          for (priority, alerts, recommendations, approvals, activity) */}
      <div className="hm-grid">
        <div className="hm-col">
          {/* C. TODAY'S PRIORITY: the focal point, with the next step it calls for */}
          <section aria-labelledby="hm-priority" className="hm-priority">
            <div className="hm-priority__top">
              <p id="hm-priority" className="bd-label hm-priority__label">
                {copy.priority.title}
              </p>
              <span className="hm-severity" data-level={priority.severity}>
                <SeverityMark level={priority.severity} />
                {words.severity[priority.severity]}
              </span>
            </div>
            <h2 className="hm-priority__title">{priority.title}</h2>
            <p className="hm-priority__why">{priority.why}</p>
            {(priority.metric || priority.detail) && (
              <div className="hm-priority__facts">
                {priority.metric && <FigureLine metric={priority.metric} />}
                {priority.detail && <span>{priority.detail}</span>}
              </div>
            )}

            <div className="hm-next">
              <p className="bd-label hm-next__label">{copy.priority.next}</p>
              <p className="hm-next__title">{recommendation.title}</p>
              <p className="hm-next__why">{recommendation.why}</p>
              {recommendation.metric && (
                <div className="hm-priority__facts">
                  <FigureLine metric={recommendation.metric} />
                </div>
              )}
              {recommendation.outcome && (
                <p className="hm-next__outcome">
                  <span>{copy.priority.outcome}: </span>
                  {recommendation.outcome}
                </p>
              )}
            </div>

            <div className="hm-priority__actions">
              <ButtonLink href={briefingHref} variant="primary" size="sm" className="group">
                {copy.priority.open}
                <ArrowNudge />
              </ButtonLink>
              <ButtonLink href={briefingHref} variant="ghost" size="sm">
                {copy.priority.why}
              </ButtonLink>
            </div>
          </section>

          {/* E. WHAT SYXORIA RECOMMENDS NEXT */}
          <Panel title={copy.recommendations.title} className="hm-recs">
            <ol className="hm-rec-list">
              {data.recommendations.map((r) => {
                const a = action(r.actionId);
                return (
                  <li key={r.id}>
                    <Link href={r.href} className="hm-rec">
                      <span className="min-w-0">
                        <span className="hm-rec__title">{r.title}</span>
                        <span className="hm-rec__why">{r.why}</span>
                        {r.outcome && (
                          <span className="hm-rec__outcome">
                            {copy.recommendations.outcome}: {r.outcome}
                          </span>
                        )}
                      </span>
                      <span className="hm-state" data-status={a?.status ?? "suggested"}>
                        {a ? <StatusIcon status={a.status} ring={false} /> : <Lightbulb aria-hidden="true" className="size-3.5" strokeWidth={1.9} />}
                        {a ? words.actions.statuses[a.status] : copy.recommendations.suggested}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        <div className="hm-col">
          {/* F. WHAT WAITS FOR THE OWNER */}
          <Panel title={copy.approvals.title} link={{ href: "/app/actions", label: copy.approvals.open }} className="hm-approvals">
            {waiting.length > 0 ? (
              <p className="hm-count">
                <span className="hm-count__n tabular">{waiting.length}</span>
                {copy.approvals.count(waiting.length)}
              </p>
            ) : (
              <p className="hm-muted">{copy.approvals.none}</p>
            )}
            <ul className="hm-rows">
              {waiting.slice(0, 2).map((a) => (
                <ActionRow key={a.id} action={a} trailing={<span className="hm-review">{copy.approvals.review}</span>} />
              ))}
              {failed.map((a) => (
                <ActionRow key={a.id} action={a} label={copy.approvals.attention} />
              ))}
              {drafted.map((a) => (
                <ActionRow key={a.id} action={a} label={copy.approvals.drafted} />
              ))}
            </ul>
            <p className="hm-foot">{copy.approvals.where}</p>
          </Panel>

          {/* D. WHAT DESERVES ATTENTION, BEYOND THE PRIORITY */}
          <Panel title={copy.signals.title} className="hm-alerts">
            <ul className="hm-signals">
              {data.signals.map((s) => {
                const Icon = SIGNAL[s.kind];
                return (
                  <li key={s.id}>
                    <Link href={s.href} className="hm-signal" data-kind={s.kind}>
                      <Icon className="hm-signal__icon" strokeWidth={1.7} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="hm-signal__kind">
                          {copy.signals.kinds[s.kind]}
                          {s.due && <> · {copy.signals.due(s.due)}</>}
                        </span>
                        <span className="hm-signal__title">{s.title}</span>
                        <span className="hm-signal__detail">{s.detail}</span>
                      </span>
                      {s.stake && <span className="hm-signal__stake tabular">{s.stake}</span>}
                      <span className="sr-only">, {words.severity[s.level]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* G. WHAT SYXORIA HAS DONE */}
          <Panel title={copy.activity.title} link={{ href: "/app/history", label: copy.activity.all }} className="hm-activity">
            {briefing.changes && <Timeline changes={briefing.changes.slice(0, 4)} actions={actions} />}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, link, className, children }: { title: string; link?: { href: string; label: string }; className?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={cn("hm-panel", className)}>
      <div className="hm-panel__head">
        <h2 className="bd-label">{title}</h2>
        {link && (
          <Link href={link.href} className="hm-link">
            {link.label}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** An action as one line: its status mark, its name, why it is here, and when */
function ActionRow({ action, label, trailing }: { action: BriefingActionItem; label?: string; trailing?: ReactNode }) {
  return (
    <li>
      <Link href="/app/actions" className="hm-row" data-status={action.status}>
        <StatusIcon status={action.status} />
        <span className="min-w-0">
          {label && <span className="hm-row__label">{label}</span>}
          <span className="hm-row__name">{action.name}</span>
          <span className="hm-row__meta">
            <span className="hm-row__status">{words.actions.statuses[action.status]}</span> · {action.note ?? action.timing}
          </span>
        </span>
        {trailing}
      </Link>
    </li>
  );
}
