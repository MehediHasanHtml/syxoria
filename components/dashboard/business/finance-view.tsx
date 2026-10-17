"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AreaChart } from "@/components/dashboard/charts/area-chart";
import { Chip, FocusCard, InsightList, KpiRow, Panel, RecList, euro, type ChipTone } from "@/components/dashboard/ws/kit";
import type { BriefingActionStatus } from "@/types";
import type { FinanceData, Invoice, Period, PeriodId } from "@/types/workspace";
import { BusinessHeader, usePeriod } from "./business-frame";

const INVOICE: Record<Invoice["status"], { word: (i: Invoice) => string; tone: ChipTone }> = {
  overdue: { word: (i) => `${i.days} days late`, tone: "warn" },
  "due-soon": { word: (i) => `Due in ${i.days} days`, tone: "owner" },
  sent: { word: () => "Sent", tone: "neutral" },
  draft: { word: () => "Not issued", tone: "faint" },
  paid: { word: () => "Paid", tone: "emerald" },
};

/**
 * Finance: what comes in, what goes out, the cash it leaves, what is owed and what falls due, with
 * the unusual variations Syxoria found and what it suggests. Anything involving money waits for
 * the owner: the page says so on every action.
 */
export function FinanceView({ data, periods, initial, statuses }: { data: FinanceData; periods: Period[]; initial: PeriodId; statuses: Record<string, BriefingActionStatus> }) {
  const [period, setPeriod] = usePeriod(initial);
  const view = data.periods[period];
  const top = Math.max(...view.cash.flatMap((c) => [c.in, c.out]));
  const totalExpenses = data.expenses.reduce((n, e) => n + e.amount, 0);

  return (
    <div className="ws">
      <BusinessHeader section="finance" periods={periods} period={period} onPeriod={setPeriod} />
      <KpiRow items={view.kpis} label="Financial figures" />

      <div className="ws-grid ws-grid--lead">
        <Panel title="Syxoria’s analysis" meta={`${data.insights.length} observations`} link={{ href: "/app/assistant", label: "Ask about it" }}>
          <InsightList insights={data.insights} />
        </Panel>
        <FocusCard focus={data.focus} />
      </div>

      <div className="ws-grid ws-grid--lead">
        <Panel title="Cash flow" meta="Money in and out, by month">
          <div className="ws-cash" role="img" aria-label={view.cash.map((c) => `${c.month}: ${euro(c.in)} in, ${euro(c.out)} out`).join("; ")}>
            {view.cash.map((c) => (
              <div key={c.month} className="ws-cash__month">
                <div className="ws-cash__bars">
                  <span className="ws-cash__in" style={{ height: `${(c.in / top) * 100}%` }} />
                  <span className="ws-cash__out" style={{ height: `${(c.out / top) * 100}%` }} />
                </div>
                <span className="ws-cash__net tabular" data-good={c.in >= c.out || undefined}>
                  {c.in >= c.out ? "+" : "Short "}
                  {euro(Math.abs(Math.round((c.in - c.out) / 100) * 100))}
                </span>
                <span className="ws-cash__label">{c.month}</span>
              </div>
            ))}
          </div>
          <p className="ws-legend">
            <span data-key="in">Money in</span>
            <span data-key="out">Money out</span>
            <span>Net under each month</span>
          </p>
          <div className="ws-sub">
            <p className="bd-label">Cash balance</p>
            <AreaChart key={period} data={view.balance} label="Cash balance at the end of each month" valueFormat="currency-compact" dateFormat="month" seriesLabel="Balance" height={120} xLabels={6} />
          </div>
        </Panel>
        <Panel title="Coming up" meta="Next three weeks">
          <ul className="ws-money">
            {data.upcoming.map((u) => (
              <li key={u.id} data-kind={u.kind}>
                <span className="ws-money__icon" aria-hidden="true">
                  {u.kind === "in" ? <ArrowDownLeft strokeWidth={1.8} /> : <ArrowUpRight strokeWidth={1.8} />}
                </span>
                <span className="min-w-0">
                  <span className="ws-row__title">{u.label}</span>
                  <span className="ws-row__detail">{u.date}</span>
                </span>
                <span className="ws-money__amount tabular">
                  {u.kind === "in" && "+"}
                  {euro(u.amount)}
                  <span className="sr-only">{u.kind === "in" ? " coming in" : " going out"}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="ws-note">After these, the balance stays above €160,000, about three and a half months of costs.</p>
        </Panel>
      </div>

      <div className="ws-grid ws-grid--wide">
        <Panel title="Invoices" meta="€9,700 outstanding">
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col" className="ws-num">Amount</th>
                  <th scope="col" className="ws-hide-sm">Issued</th>
                  <th scope="col">Due</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="ws-hide-md">What happens next</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/app/clients?client=${i.clientId}`} className="ws-cell-title">
                        {i.client}
                      </Link>
                      <span className="ws-cell-sub">{i.number}</span>
                    </td>
                    <td className="ws-num tabular">{euro(i.amount)}</td>
                    <td className="ws-hide-sm ws-cell-sub">{i.issued}</td>
                    <td className="ws-cell-sub">{i.due}</td>
                    <td>
                      <Chip tone={INVOICE[i.status].tone}>{INVOICE[i.status].word(i)}</Chip>
                    </td>
                    <td className="ws-hide-md ws-cell-sub">{i.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Expenses" meta={`${euro(totalExpenses)} this month`}>
          <ul className="ws-channels">
            {data.expenses.map((e) => (
              <li key={e.id} data-bad={!e.change.good || undefined}>
                <span className="ws-channels__top">
                  <span className="ws-channels__label">{e.label}</span>
                  <span className="ws-channels__revenue tabular">{euro(e.amount)}</span>
                </span>
                <span aria-hidden="true" className="ws-channels__bar" data-tone="neutral">
                  <span style={{ width: `${Math.max(2, Math.round((e.amount / totalExpenses) * 100))}%` }} />
                </span>
                <span className="ws-channels__meta">
                  {Math.round((e.amount / totalExpenses) * 100)}% of costs
                  <span className="ws-delta" data-good={e.change.good || undefined}>
                    {e.change.text}
                  </span>
                </span>
                {e.flag && <span className="ws-flag">{e.flag}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recommended actions" meta="Anything involving money waits for you" link={{ href: "/app/actions", label: "All actions" }}>
        <div className="ws-recs-grid">
          <RecList recs={data.recommendations} statuses={statuses} />
        </div>
      </Panel>
    </div>
  );
}
