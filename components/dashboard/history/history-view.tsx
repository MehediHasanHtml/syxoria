"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, CheckCheck, FileText, Lightbulb, Plug, Printer, ScrollText, Search, ShieldCheck, Stamp, Zap, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, KpiRow, Panel, WsHead, type ChipTone } from "@/components/dashboard/ws/kit";
import { Button } from "@/components/ui/button";
import type { HistoryEvent, HistoryKind, Report } from "@/types/workspace";

const KIND: Record<HistoryKind, { word: string; icon: LucideIcon }> = {
  insight: { word: "Insight", icon: Lightbulb },
  recommendation: { word: "Recommendation", icon: Zap },
  action: { word: "Action", icon: CheckCheck },
  approval: { word: "Approval", icon: Stamp },
  error: { word: "Error", icon: CircleAlert },
  briefing: { word: "Briefing", icon: ScrollText },
  safety: { word: "Safety", icon: ShieldCheck },
  connection: { word: "Connection", icon: Plug },
};
const STATUS: Record<HistoryEvent["status"], { word: string; tone: ChipTone }> = {
  done: { word: "Done", tone: "emerald" },
  pending: { word: "Pending", tone: "owner" },
  failed: { word: "Failed", tone: "warn" },
  interrupted: { word: "Interrupted", tone: "warn" },
  info: { word: "Noted", tone: "faint" },
};
const FILTERS: ("all" | HistoryKind)[] = ["all", "action", "approval", "recommendation", "insight", "error", "briefing", "safety", "connection"];
const PERIODS = [
  { id: "today", label: "Today", days: ["Today"] },
  { id: "3d", label: "Last three days", days: ["Today", "Yesterday", "Monday"] },
];

/**
 * History & Reports: a trustworthy record of Syxoria's activity. Every event, by day and filtered
 * by type or period, opens on what happened, why, whether it needed approval and who gave it, what
 * followed and what came of it. Reports summarise each week, month and quarter.
 */
export function HistoryView({ events, reports, initial, initialTab }: { events: HistoryEvent[]; reports: Report[]; initial?: string; initialTab?: "activity" | "reports" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState(initialTab ?? "activity");
  const [kind, setKind] = useState<(typeof FILTERS)[number]>("all");
  const [period, setPeriod] = useState("3d");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(initial && events.some((e) => e.id === initial) ? initial : events.find((e) => e.kind === "error")?.id ?? events[0].id);
  const [report, setReport] = useState(reports[0].id);

  const days = useMemo(() => PERIODS.find((p) => p.id === period)?.days ?? [], [period]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => days.includes(e.day) && (kind === "all" || e.kind === kind) && (!q || [e.title, e.detail, e.why ?? ""].some((v) => v.toLowerCase().includes(q))));
  }, [events, days, kind, query]);
  const grouped = days.map((d) => ({ day: d, items: list.filter((e) => e.day === d) })).filter((g) => g.items.length);
  const event = events.find((e) => e.id === open) ?? events[0];
  const rep = reports.find((r) => r.id === report) ?? reports[0];
  const choose = (id: string) => {
    setOpen(id);
    router.replace(`${pathname}?event=${id}`, { scroll: false });
  };
  const today = events.filter((e) => e.day === "Today");

  return (
    <div className="ws">
      <WsHead eyebrow="Knowledge" title="History & Reports" lead="A complete record of what Syxoria noticed, recommended, prepared and did: when, why, and with whose approval." />

      <KpiRow
        label="Activity at a glance"
        items={[
          { id: "e", label: "Events today", value: String(today.length), caption: "noticed, decided or carried out", delta: { text: "Latest at 18:50", direction: "up", good: true } },
          { id: "a", label: "Your approvals today", value: String(today.filter((e) => e.kind === "approval").length), caption: "contract, quote and a reminder", delta: { text: "2 still waiting", direction: "up", good: false } },
          { id: "x", label: "Errors and interruptions", value: String(events.filter((e) => e.status === "failed" || e.status === "interrupted").length), caption: "each with what it needs", delta: { text: "1 waits on a call", direction: "up", good: false } },
          { id: "r", label: "Reports", value: String(reports.length), caption: "weekly, monthly and quarterly", delta: { text: "Next: Friday 17:00", direction: "up", good: true } },
        ]}
      />

      <div role="tablist" aria-label="Show" className="ws-subnav">
        <button type="button" role="tab" aria-selected={tab === "activity"} onClick={() => setTab("activity")}>
          Activity <span className="ws-count">{events.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "reports"} onClick={() => setTab("reports")}>
          Reports <span className="ws-count">{reports.length}</span>
        </button>
      </div>

      {tab === "activity" ? (
        <>
          <div className="ws-toolbar">
            <div className="ws-chips" role="group" aria-label="Type">
              {FILTERS.map((f) => (
                <button key={f} type="button" aria-pressed={kind === f} onClick={() => setKind(f)}>
                  {f === "all" ? "Everything" : KIND[f].word}
                </button>
              ))}
            </div>
            <div className="ws-toolbar__tools">
              <label className="ws-search">
                <Search aria-hidden="true" />
                <span className="sr-only">Search the history</span>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the history" />
              </label>
              <label className="ws-select">
                <span className="sr-only">Period</span>
                <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {PERIODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="ws-grid ws-grid--split">
            <Panel title="Timeline" meta={`${list.length} events`}>
              {grouped.length === 0 ? (
                <p className="ws-empty">Nothing of this kind in the period.</p>
              ) : (
                grouped.map((g) => (
                  <section key={g.day} className="ws-day">
                    <h3 className="ws-day__title">{g.day}</h3>
                    <ol className="ws-log" role="listbox" aria-label={`Events, ${g.day}`}>
                      {g.items.map((e) => {
                        const Icon = KIND[e.kind].icon;
                        return (
                          <li key={e.id} role="option" aria-selected={e.id === event.id}>
                            <button type="button" onClick={() => choose(e.id)} className="ws-log__item" data-kind={e.kind} data-status={e.status}>
                              <span className="ws-log__at tabular">{e.at}</span>
                              <span className="ws-log__icon" aria-hidden="true">
                                <Icon strokeWidth={1.7} />
                              </span>
                              <span className="min-w-0">
                                <span className="ws-log__title">{e.title}</span>
                                <span className="ws-log__detail">
                                  {KIND[e.kind].word} · {e.detail}
                                </span>
                              </span>
                              <Chip tone={STATUS[e.status].tone}>{STATUS[e.status].word}</Chip>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))
              )}
            </Panel>

            <Panel title="Event" meta={`${event.day}, ${event.at}`}>
              <article key={event.id} className="ws-detail">
                <div className="ws-detail__chips">
                  <Chip>{KIND[event.kind].word}</Chip>
                  <Chip tone={STATUS[event.status].tone}>{STATUS[event.status].word}</Chip>
                </div>
                <h2 className="ws-detail__title">{event.title}</h2>
                <dl className="ws-explain">
                  <div>
                    <dt>What happened</dt>
                    <dd>{event.detail}</dd>
                  </div>
                  {event.why && (
                    <div>
                      <dt>Why</dt>
                      <dd>{event.why}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Approval</dt>
                    <dd>{event.approval ?? "Nothing to approve: information only"}</dd>
                  </div>
                  {event.followed && (
                    <div>
                      <dt>What followed</dt>
                      <dd>{event.followed}</dd>
                    </div>
                  )}
                  {event.result && (
                    <div>
                      <dt>Result</dt>
                      <dd>{event.result}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Status now</dt>
                    <dd>{STATUS[event.status].word}</dd>
                  </div>
                </dl>
                {event.sources && (
                  <section className="ws-detail__block">
                    <h3 className="bd-label">Supporting information</h3>
                    <ul className="ws-sources">
                      {event.sources.map((s) => (
                        <li key={s}>
                          <FileText aria-hidden="true" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {event.href && (
                  <Link href={event.href} className="ws-link mt-4">
                    Open what it concerns
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                )}
              </article>
            </Panel>
          </div>
        </>
      ) : (
        <div className="ws-grid ws-grid--split">
          <Panel title="Reports">
            <ul className="ws-reports" role="listbox" aria-label="Open a report">
              {reports.map((r) => (
                <li key={r.id} role="option" aria-selected={r.id === rep.id}>
                  <button type="button" onClick={() => setReport(r.id)} className="ws-report">
                    <span className="ws-goal__area">{r.kind}</span>
                    <span className="ws-report__title">
                      {r.title}, {r.period}
                    </span>
                    <span className="ws-report__summary">{r.summary}</span>
                    <span className="ws-cell-sub">Prepared {r.generated}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel
            title="Report"
            meta={rep.period}
            action={
              <Button size="sm" variant="ghost" onClick={() => window.print()}>
                <Printer aria-hidden="true" />
                Print or save as PDF
              </Button>
            }
          >
            <article key={rep.id} className="ws-detail">
              <h2 className="ws-detail__title">
                {rep.title}, {rep.period}
              </h2>
              <p className="ws-detail__purpose">{rep.summary}</p>
              <div className="ws-highlights">
                {rep.highlights.map((h) => (
                  <div key={h.label}>
                    <span className="bd-label">{h.label}</span>
                    <span className="ws-highlights__value tabular">{h.value}</span>
                    {h.delta && (
                      <span className="ws-delta" data-good={h.good || undefined}>
                        {h.delta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {rep.sections.map((s) => (
                <section key={s.title} className="ws-detail__block">
                  <h3 className="bd-label">{s.title}</h3>
                  <p className="ws-detail__purpose">{s.text}</p>
                </section>
              ))}
            </article>
          </Panel>
        </div>
      )}
    </div>
  );
}
