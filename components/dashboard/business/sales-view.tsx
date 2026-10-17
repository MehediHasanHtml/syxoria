"use client";

import Link from "next/link";
import { FileText, Mail, Phone, StickyNote, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { Chip, FocusCard, InsightList, KpiRow, Mark, Panel, RecList, euro } from "@/components/dashboard/ws/kit";
import type { BriefingActionStatus } from "@/types";
import type { Deal, DealStage, Interaction, Period, PeriodId, SalesData } from "@/types/workspace";
import { BusinessHeader, usePeriod } from "./business-frame";

const STAGE: Record<DealStage, string> = { lead: "Discovery", qualified: "Qualified", proposal: "Proposal", negotiation: "Contract", won: "Signed" };
const FLAG: Record<NonNullable<Deal["flag"]>, { word: string; tone: "emerald" | "warn" | "faint" }> = {
  hot: { word: "Ready to close", tone: "emerald" },
  risk: { word: "At risk", tone: "warn" },
  quiet: { word: "Gone quiet", tone: "warn" },
};
export const INTERACTION: Record<Interaction["kind"], LucideIcon> = { email: Mail, call: Phone, meeting: Users, document: FileText, note: StickyNote };
const BY: Record<Interaction["by"], string> = { you: "You", client: "Client", syxoria: "Syxoria", team: "Team" };

/**
 * Sales: where revenue stands and where it comes from, the pipeline stage by stage, the deals
 * that matter with their next step, and what Syxoria noticed, recommends and has prepared. One
 * line runs through the page: business data, analysis, recommendation, action, follow up.
 */
export function SalesView({ data, periods, initial, statuses }: { data: SalesData; periods: Period[]; initial: PeriodId; statuses: Record<string, BriefingActionStatus> }) {
  const [period, setPeriod] = usePeriod(initial);
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const view = data.periods[period];
  const max = Math.max(...data.pipeline.map((s) => s.value));
  const deals = filter === "all" ? data.deals : data.deals.filter((d) => d.flag === "risk" || d.flag === "quiet");
  const open = data.pipeline.filter((s) => s.stage !== "won").reduce((n, s) => n + s.value, 0);

  return (
    <div className="ws">
      <BusinessHeader section="sales" periods={periods} period={period} onPeriod={setPeriod} />
      <KpiRow items={view.kpis} label="Sales figures" />

      <div className="ws-grid ws-grid--lead">
        <Panel title="Syxoria’s analysis" meta={`${data.insights.length} insights`} link={{ href: "/app/assistant?c=cv_risk", label: "Ask about it" }}>
          <InsightList insights={data.insights} />
        </Panel>
        <FocusCard focus={data.focus} />
      </div>

      <div className="ws-grid ws-grid--lead">
        <Panel title="Revenue" meta={view.chart.label}>
          <AreaChart key={period} data={view.chart.series} compare={view.chart.compare} label={view.chart.label} valueFormat="currency-compact" dateFormat={period === "month" ? "short" : "month"} seriesLabel="This period" compareLabel="Year before" height={220} xLabels={6} />
        </Panel>
        <Panel title="Pipeline" meta={`${euro(open)} open`}>
          <ol className="ws-pipeline">
            {data.pipeline.map((s) => (
              <li key={s.stage} data-stage={s.stage}>
                <span className="ws-pipeline__label">{s.label}</span>
                <span className="ws-pipeline__count tabular">{s.count}</span>
                <span aria-hidden="true" className="ws-pipeline__bar">
                  <span style={{ width: `${Math.round((s.value / max) * 100)}%` }} />
                </span>
                <span className="ws-pipeline__value tabular">{euro(s.value)}</span>
              </li>
            ))}
          </ol>
          <p className="ws-note">Weighted by probability: {euro(Math.round(data.deals.reduce((n, d) => n + d.value * (d.probability / 100), 0) / 100) * 100)} expected from open deals.</p>
        </Panel>
      </div>

      <div className="ws-grid ws-grid--wide">
        <Panel
          title="Strategic opportunities"
          meta={`${data.deals.filter((d) => d.flag === "risk" || d.flag === "quiet").length} need your attention`}
          action={
            <div className="ws-filter" role="group" aria-label="Show">
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                All
              </button>
              <button type="button" aria-pressed={filter === "attention"} onClick={() => setFilter("attention")}>
                Needs attention
              </button>
            </div>
          }
        >
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th scope="col">Opportunity</th>
                  <th scope="col" className="ws-num">Value</th>
                  <th scope="col">Stage</th>
                  <th scope="col" className="ws-num ws-hide-sm">Probability</th>
                  <th scope="col" className="ws-hide-md">Last activity</th>
                  <th scope="col">Next step</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/app/clients?client=${d.clientId}`} className="ws-cell-main">
                        <Mark name={d.client} tone={d.flag === "hot" ? "emerald" : d.flag ? "warn" : undefined} />
                        <span className="min-w-0">
                          <span className="ws-cell-title">{d.client}</span>
                          <span className="ws-cell-sub">{d.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="ws-num tabular">{euro(d.value)}</td>
                    <td>
                      <Chip tone={d.stage === "negotiation" ? "emerald" : "neutral"}>{STAGE[d.stage]}</Chip>
                    </td>
                    <td className="ws-num ws-hide-sm">
                      <span className="ws-prob">
                        <span aria-hidden="true" className="ws-prob__ring" style={{ ["--p" as string]: d.probability }} />
                        <span className="tabular">{d.probability}%</span>
                      </span>
                    </td>
                    <td className="ws-hide-md ws-cell-sub">{d.lastActivity}</td>
                    <td>
                      <span className="ws-cell-next">{d.nextStep}</span>
                      {d.flag && <Chip tone={FLAG[d.flag].tone}>{FLAG[d.flag].word}</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Recommended actions" meta={`${data.recommendations.length} actions`} link={{ href: "/app/actions", label: "All actions" }}>
          <RecList recs={data.recommendations} statuses={statuses} />
        </Panel>
      </div>

      <div className="ws-grid ws-grid--half">
        <Panel title="Recent commercial interactions" link={{ href: "/app/history", label: "Full history" }}>
          <ol className="ws-timeline">
            {data.interactions.map((x) => {
              const Icon = INTERACTION[x.kind];
              return (
                <li key={x.id}>
                  <span className="ws-timeline__icon" data-by={x.by} aria-hidden="true">
                    <Icon strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="ws-timeline__title">{x.title}</span>
                    <span className="ws-timeline__detail">
                      {x.detail} · {BY[x.by]}
                    </span>
                  </span>
                  <span className="ws-timeline__at tabular">{x.at}</span>
                </li>
              );
            })}
          </ol>
        </Panel>
        <Panel title="Prospects gone quiet" meta={euro(data.quiet.reduce((n, q) => n + q.value, 0))}>
          <ul className="ws-rows">
            {data.quiet.map((q) => (
              <li key={q.id}>
                <Link href={`/app/clients?client=${q.clientId}`} className="ws-row">
                  <span className="ws-days" data-long={q.days >= 14 || undefined}>
                    <span className="tabular">{q.days}</span>
                    <span>days</span>
                  </span>
                  <span className="min-w-0">
                    <span className="ws-row__title">
                      {q.client} <span className="ws-row__dim">· {q.contact}</span>
                    </span>
                    <span className="ws-row__detail">{q.reason}</span>
                  </span>
                  <span className="ws-row__value tabular">{euro(q.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="ws-note">Past ten quiet days, your proposals close half as often. Syxoria drafted what each one is waiting for.</p>
        </Panel>
      </div>
    </div>
  );
}
