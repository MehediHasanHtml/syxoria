"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useState } from "react";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { ActionState, Chip, FocusCard, InsightList, KpiRow, Panel, Progress, type ChipTone } from "@/components/dashboard/ws/kit";
import type { BriefingActionStatus } from "@/types";
import type { GoalStatus, GoalsData, Period, PeriodId } from "@/types/workspace";
import { BusinessHeader, usePeriod } from "./business-frame";

export const GOAL: Record<GoalStatus, { word: string; tone: ChipTone }> = {
  "on-track": { word: "On track", tone: "emerald" },
  "at-risk": { word: "At risk", tone: "owner" },
  behind: { word: "Behind", tone: "warn" },
  achieved: { word: "Met", tone: "emerald" },
};

/**
 * Goals & KPIs: every objective with its target, where it stands, where an even pace would put it
 * today, the gap, the deadline and who owns it; one goal opened in detail with what would close
 * the gap; and the scoreboard of indicators against their targets for the period.
 */
export function GoalsView({ data, periods, initial, statuses }: { data: GoalsData; periods: Period[]; initial: PeriodId; statuses: Record<string, BriefingActionStatus> }) {
  const [period, setPeriod] = usePeriod(initial);
  const [open, setOpen] = useState(data.goals.find((g) => g.status === "at-risk")?.id ?? data.goals[0].id);
  const view = data.periods[period];
  const goal = data.goals.find((g) => g.id === open) ?? data.goals[0];

  return (
    <div className="ws">
      <BusinessHeader section="goals" periods={periods} period={period} onPeriod={setPeriod} />
      <KpiRow items={view.kpis} label="Goals at a glance" />

      <div className="ws-grid ws-grid--lead">
        <Panel title="Important deviations" meta={`${data.deviations.length} found`}>
          <InsightList insights={data.deviations} />
        </Panel>
        <FocusCard focus={data.focus} />
      </div>

      <div className="ws-grid ws-grid--wide">
        <Panel title="Objectives" meta={`${data.goals.length} goals`}>
          <div role="radiogroup" aria-label="Open a goal" className="ws-goals">
            {data.goals.map((g) => (
              <button key={g.id} type="button" role="radio" aria-checked={g.id === open} onClick={() => setOpen(g.id)} className="ws-goal" data-status={g.status}>
                <span className="ws-goal__top">
                  <span className="ws-goal__area">{g.area}</span>
                  <Chip tone={GOAL[g.status].tone}>{GOAL[g.status].word}</Chip>
                </span>
                <span className="ws-goal__title">{g.title}</span>
                <span className="ws-goal__numbers">
                  <span className="ws-goal__current tabular">{g.current}</span>
                  <span className="ws-goal__target">of {g.target}</span>
                </span>
                <Progress
                  value={g.progress}
                  expected={g.expected}
                  tone={g.status === "behind" ? "warn" : g.status === "at-risk" ? "neutral" : "emerald"}
                  label={`${Math.round(g.progress * 100)}% of the target`}
                />
                <span className="ws-goal__meta">
                  <span>{g.gap}</span>
                  <span>{g.deadline}</span>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Goal in detail" meta={goal.area}>
          <div key={goal.id} className="ws-goal-detail">
            <div className="ws-goal-detail__head">
              <h3 className="ws-goal-detail__title">{goal.title}</h3>
              <Chip tone={GOAL[goal.status].tone}>{GOAL[goal.status].word}</Chip>
            </div>
            <dl className="ws-facts">
              <div>
                <dt>Target</dt>
                <dd className="tabular">{goal.target}</dd>
              </div>
              <div>
                <dt>Now</dt>
                <dd className="tabular">{goal.current}</dd>
              </div>
              <div>
                <dt>Gap</dt>
                <dd>{goal.gap}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{goal.deadline}</dd>
              </div>
            </dl>
            <AreaChart data={goal.series} label={`${goal.metric}, recent trend`} valueFormat="number" dateFormat="short" seriesLabel={goal.metric} height={120} xLabels={3} />
            <p className="ws-goal-detail__why">{goal.why}</p>
            <p className="ws-goal-detail__owner">Owned by {goal.owner}</p>
            {goal.recommendations.length > 0 && (
              <>
                <p className="bd-label mt-4">What would close the gap</p>
                <ul className="ws-mini-recs">
                  {goal.recommendations.map((r) => (
                    <li key={r.title}>
                      <Lightbulb aria-hidden="true" strokeWidth={1.7} />
                      <span className="min-w-0 flex-1">
                        {r.title}
                        <span className="ws-mini-recs__meta">
                          {r.actionId && statuses[r.actionId] && <ActionState status={statuses[r.actionId]} />}
                          <span>{r.approval ? "Needs your approval" : "No approval needed"}</span>
                        </span>
                      </span>
                      {r.actionId && (
                        <Link href={`/app/actions?action=${r.actionId}`} className="ws-link" aria-label={`Open: ${r.title}`}>
                          <ArrowRight aria-hidden="true" className="size-3.5" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Scoreboard" meta={periods.find((p) => p.id === period)?.label}>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th scope="col">Indicator</th>
                <th scope="col" className="ws-hide-sm">Area</th>
                <th scope="col" className="ws-num">Now</th>
                <th scope="col" className="ws-num">Target</th>
                <th scope="col" className="ws-hide-sm">Deviation</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.scoreboard.map((k) => (
                <tr key={k.id}>
                  <td className="ws-cell-title">{k.label}</td>
                  <td className="ws-hide-sm ws-cell-sub">{k.area}</td>
                  <td className="ws-num tabular">{k.value}</td>
                  <td className="ws-num tabular ws-cell-sub">{k.target}</td>
                  <td className="ws-hide-sm">
                    <span className="ws-delta" data-good={k.status === "on-track" || k.status === "achieved" || undefined}>
                      {k.deviation}
                    </span>
                  </td>
                  <td>
                    <Chip tone={GOAL[k.status].tone}>{GOAL[k.status].word}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
