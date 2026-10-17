"use client";

import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { Chip, FocusCard, InsightList, KpiRow, Panel, RecList, euro, type ChipTone } from "@/components/dashboard/ws/kit";
import type { BriefingActionStatus } from "@/types";
import type { Campaign, MarketingData, Period, PeriodId } from "@/types/workspace";
import { BusinessHeader, usePeriod } from "./business-frame";

const STATUS: Record<Campaign["status"], { word: string; tone: ChipTone }> = {
  live: { word: "Live", tone: "emerald" },
  scheduled: { word: "Scheduled", tone: "neutral" },
  ended: { word: "Ended", tone: "faint" },
  paused: { word: "Paused", tone: "warn" },
  draft: { word: "Draft", tone: "neutral" },
};
const FUNNEL_WIDTH = [100, 82, 64, 48, 34];

/**
 * Marketing: what brings clients and at what cost. The leads over time, the path from a visit to
 * a signature, each campaign and channel with what it really returns, the content that works,
 * what needs improving, and what Syxoria suggests doing about it.
 */
export function MarketingView({ data, periods, initial, statuses }: { data: MarketingData; periods: Period[]; initial: PeriodId; statuses: Record<string, BriefingActionStatus> }) {
  const [period, setPeriod] = usePeriod(initial);
  const view = data.periods[period];
  const maxRevenue = Math.max(...data.channels.map((c) => c.revenue), 1);

  return (
    <div className="ws">
      <BusinessHeader section="marketing" periods={periods} period={period} onPeriod={setPeriod} />
      <KpiRow items={view.kpis} label="Marketing figures" />

      <div className="ws-grid ws-grid--lead">
        <Panel title="Syxoria’s analysis" meta={`${data.insights.length} insights`} link={{ href: "/app/assistant", label: "Ask about it" }}>
          <InsightList insights={data.insights} />
        </Panel>
        <FocusCard focus={data.focus} />
      </div>

      <div className="ws-grid ws-grid--lead">
        <Panel title="Qualified leads" meta={view.chart.label}>
          <AreaChart key={period} data={view.chart.series} compare={view.chart.compare} label={view.chart.label} valueFormat="number" dateFormat={period === "month" ? "short" : "month"} seriesLabel="This period" compareLabel="Before" height={220} xLabels={6} />
        </Panel>
        <Panel title="From visit to signature" meta="This month">
          <ol className="ws-funnel">
            {data.funnel.map((f, i) => (
              <li key={f.label}>
                <span aria-hidden="true" className="ws-funnel__bar" style={{ width: `${FUNNEL_WIDTH[i] ?? 30}%` }} data-last={i === data.funnel.length - 1 || undefined} />
                <span className="ws-funnel__label">{f.label}</span>
                <span className="ws-funnel__value tabular">{f.value.toLocaleString("en-GB")}</span>
                <span className="ws-funnel__note">{f.note}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="ws-grid ws-grid--wide">
        <Panel title="Campaigns" meta={`${data.campaigns.filter((c) => c.status === "live").length} live`}>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th scope="col">Campaign</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ws-num ws-hide-sm">Spend</th>
                  <th scope="col" className="ws-num">Leads</th>
                  <th scope="col" className="ws-num ws-hide-sm">Qualified</th>
                  <th scope="col" className="ws-num ws-hide-md">Cost per lead</th>
                  <th scope="col" className="ws-hide-md">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="ws-cell-title">{c.name}</span>
                      <span className="ws-cell-sub">
                        {c.channel} · {c.dates}
                      </span>
                    </td>
                    <td>
                      <Chip tone={STATUS[c.status].tone}>{STATUS[c.status].word}</Chip>
                    </td>
                    <td className="ws-num tabular ws-hide-sm">{c.spend ? euro(c.spend) : "None"}</td>
                    <td className="ws-num tabular">{c.leads}</td>
                    <td className="ws-num tabular ws-hide-sm">{c.qualified}</td>
                    <td className="ws-num tabular ws-hide-md">{c.costPerLead ? euro(c.costPerLead) : "None"}</td>
                    <td className="ws-hide-md">{c.change && <span className="ws-delta" data-good={c.change.good || undefined}>{c.change.text}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Acquisition channels" meta="Last 90 days">
          <ul className="ws-channels">
            {data.channels.map((c) => (
              <li key={c.id} data-bad={!c.change.good || undefined}>
                <span className="ws-channels__top">
                  <span className="ws-channels__label">{c.label}</span>
                  <span className="ws-channels__revenue tabular">{euro(c.revenue)}</span>
                </span>
                <span aria-hidden="true" className="ws-channels__bar">
                  <span style={{ width: `${Math.max(2, Math.round((c.revenue / maxRevenue) * 100))}%` }} />
                </span>
                <span className="ws-channels__meta">
                  {c.leads} leads · {c.signed} signed · {c.cost ? `${euro(c.cost)} spent` : "no spend"}
                  <span className="ws-delta" data-good={c.change.good || undefined}>
                    {c.change.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="ws-grid ws-grid--3">
        <Panel title="Content that works">
          <ul className="ws-rows">
            {data.content.map((c) => (
              <li key={c.id}>
                <div className="ws-row">
                  <span className="min-w-0">
                    <span className="ws-row__title">{c.title}</span>
                    <span className="ws-row__detail">
                      {c.kind} · {c.views.toLocaleString("en-GB")} views · {c.engagement}
                    </span>
                  </span>
                  <span className="ws-row__value tabular">{c.leads} leads</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Needs improving" meta={`${data.improvements.length} areas`}>
          <ul className="ws-improve">
            {data.improvements.map((m) => (
              <li key={m.id}>
                <span className="ws-improve__title">{m.title}</span>
                <span className="ws-improve__detail">{m.detail}</span>
                <span className="ws-improve__impact">{m.impact}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recommended actions" link={{ href: "/app/actions", label: "All actions" }}>
          <RecList recs={data.recommendations} statuses={statuses} />
        </Panel>
      </div>
    </div>
  );
}
