"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { assistant as copy } from "@/content/assistant";
import { cn } from "@/lib/cn";
import type { AssistantDay } from "@/types/workspace";
import { LANES, minutes, placeOn, pulseOf, type Activity } from "./day";

/** An exchange as the day shows it: when it began and when the last word was said */
export type ExchangeMark = { id: string; title: string; from: string; to: string; moments: string[] };

/** When an item happened, said the way the tooltip and the desk say it */
export function whenOf(i: Activity) {
  if (i.day) return `${i.day} ${i.at}`;
  if (i.lane === "monitoring") return copy.since(i.since ?? i.at);
  if (i.until) return `${i.at} to ${i.until}`;
  if (i.state === "waiting") return `${copy.desk.waited(i.at)}`;
  if (i.state === "ongoing") return copy.since(i.at);
  return i.at;
}

const LABEL_PX = 6.1; // the average width of a character of a label, to know where it fits

/** Rows for marks that would touch: each goes on the first row where it clears the one before */
function spread(spans: { a: number; b: number }[], order: number[], gap: number) {
  const ends: Record<number, number> = {};
  return spans.map(({ a, b }) => {
    const row = order.find((r) => ends[r] === undefined || a - ends[r] > gap) ?? order[0];
    ends[row] = b;
    return row;
  });
}

/**
 * Syxoria's day as one drawing: the hours across, four lanes (what it watches, analyses, decides
 * and does) and a thin line of exchanges under them. The past runs up to the line of now; what
 * waits for the owner runs into it as a line from the moment it began to wait; what is planned
 * lies beyond it. Every mark can be pointed at (a note says what it is) and chosen (the desk tells
 * its story); the marks related to what is chosen stay lit. Styles: "THE DAY" in assistant.css.
 */
export function DayScore({
  day,
  items,
  exchanges,
  focus,
  related,
  onFocus,
  onExchange,
  onHistory,
  isHeld,
  openExchange,
}: {
  day: AssistantDay;
  items: Activity[];
  exchanges: ExchangeMark[];
  focus: string | null;
  related: Set<string>;
  onFocus: (id: string) => void;
  onExchange: (id: string) => void;
  onHistory: () => void;
  isHeld: (actionId?: string) => boolean;
  openExchange: string | null;
}) {
  const at = placeOn(day);
  const now = at(day.now);
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = plot.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const today = items.filter((i) => !i.day);
  const lane = (l: Activity["lane"]) => today.filter((i) => i.lane === l);
  const watches = lane("monitoring");
  const analyses = lane("analysing");
  const waiting = lane("deciding").filter((i) => i.state === "waiting");
  const decided = lane("deciding").filter((i) => i.state !== "waiting");
  const work = lane("doing");
  const tomorrow = items.filter((i) => i.day);

  // marks close together sit on rows above and below, so none hides another
  const rows = spread(work.map((w) => ({ a: at(w.at), b: at(w.at) })), [1, 0, 2], 1.6);
  const talkRows = spread(exchanges.map((e) => ({ a: at(e.from), b: at(e.to) })), [0, 1], 0.8);

  // a label runs from its mark; one that would cross the line of now ends on it instead
  const flips = (x: number, text: string) => width > 0 && (x / 100) * width + text.length * LABEL_PX + 20 > (now / 100) * width;

  const pulse = pulseOf(items, day);
  const start = minutes(day.dayStart);
  const span = minutes(day.dayEnd) - start;
  const area = `M0 20 ${pulse.map((p) => `L${(((p.t - start) / span) * 100).toFixed(2)} ${(20 - p.v * 17).toFixed(2)}`).join(" ")} L${now.toFixed(2)} 20 Z`;
  const hours: number[] = [];
  for (let h = Math.ceil(start / 60); h * 60 <= start + span; h++) if (h % 2 === 0) hours.push(h);

  const mark = (i: Activity, className: string, style: CSSProperties, children?: ReactNode, attrs?: Record<string, string | boolean | undefined>) => (
    <button
      key={i.id}
      type="button"
      className={cn("sd-mark", className)}
      style={style}
      data-state={i.state}
      data-by={i.by}
      data-on={focus === i.id || undefined}
      data-related={related.has(i.id) || undefined}
      data-held={i.lane === "doing" && isHeld(i.actionId) && (i.state === "ahead" || i.state === "ongoing") ? true : undefined}
      data-edge={at(i.at) > 72 ? "end" : undefined}
      aria-pressed={focus === i.id}
      aria-label={`${whenOf(i)}, ${i.title}, ${copy.states[i.state]}`}
      onClick={() => onFocus(i.id)}
      {...attrs}
    >
      {children}
      <span className="sd-tip" aria-hidden="true">
        <span className="sd-tip__when tabular">{whenOf(i)}</span>
        <span className="sd-tip__title">{i.title}</span>
        <span className="sd-tip__state">{i.by && i.state !== "waiting" ? `${copy.states[i.state]} · ${copy.decidedBy[i.by]}` : copy.states[i.state]}</span>
      </span>
    </button>
  );

  const row = (r: number, of: number) => ({ "--row": r, "--rows": of }) as CSSProperties;
  const counts = {
    monitoring: watches.length,
    analysing: analyses.length,
    deciding: waiting.length,
    doing: work.filter((w) => w.state === "done").length,
  };

  return (
    <div className="sd" data-focus={focus || related.size ? true : undefined} style={{ "--now": `${now}%` } as CSSProperties} role="group" aria-label={copy.day}>
      <div className="sd-guides" aria-hidden="true">
        {hours.map((h) => (
          <span key={h} className="sd-guides__hour" style={{ left: `${(((h * 60 - start) / span) * 100).toFixed(2)}%` }} />
        ))}
        <span className="sd-guides__future" />
        <span className="sd-guides__now" />
      </div>

      {/* the hours, and how busy the day has been */}
      <div className="sd-head sd-head--axis" />
      <div className="sd-axis" ref={plot}>
        <svg className="sd-pulse" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
          <path d={area} />
        </svg>
        {hours.map((h) => (
          <span key={h} className="sd-axis__hour tabular" data-near={Math.abs(((h * 60 - start) / span) * 100 - now) < 4.5 || undefined} style={{ left: `${(((h * 60 - start) / span) * 100).toFixed(2)}%` }}>
            {h}:00
          </span>
        ))}
        <span className="sd-axis__now tabular">{copy.now.at(day.now)}</span>
      </div>
      <div className="sd-ahead sd-ahead--axis">{copy.desk.ahead}</div>

      {LANES.map((l, n) => (
        <div key={l} className="contents" style={{ "--lane": n + 2 } as CSSProperties}>
          <div className="sd-head" data-lane={l}>
            <span className="sd-head__name">{copy.lanes[l].name}</span>
            <span className="sd-head__sub">{copy.lanes[l].sub(counts[l])}</span>
          </div>

          <div className="sd-plot" data-lane={l}>
            {l === "monitoring" &&
              watches.map((w, r) => {
                const x = at(w.at);
                return mark(
                  w,
                  "sd-watch",
                  { ...row(r, watches.length), "--x": `${x}%`, "--cut": `${((now - x) / (100 - x)) * 100}%` } as CSSProperties,
                  <>
                    <span className="sd-watch__line" />
                    <span className="sd-label" data-since={w.since ? true : undefined}>
                      {w.title}
                    </span>
                    {w.marks?.map((m) => (
                      <span key={m.at} className="sd-moment" style={{ left: `${((at(m.at) - x) / (100 - x)) * 100}%` }} />
                    ))}
                    <span className="sd-watch__now" />
                  </>,
                );
              })}

            {l === "analysing" &&
              analyses.map((a) => {
                const x = at(a.at);
                const end = a.until ? at(a.until) : now;
                return mark(a, "sd-span", { ...row(0, 1), "--x": `${x}%`, "--w": `${Math.max(end - x, 0.7)}%` } as CSSProperties);
              })}

            {l === "deciding" && (
              <>
                {waiting.map((d, r) => {
                  const x = at(d.at);
                  return mark(
                    d,
                    "sd-wait",
                    { ...row(r, waiting.length + 1), "--x": `${x}%`, "--w": `${now - x}%` } as CSSProperties,
                    <>
                      <span className="sd-wait__line" />
                      <span className="sd-wait__ring" />
                      <span className="sd-label" data-flip={flips(x, d.title) || undefined}>
                        {d.title}
                      </span>
                    </>,
                  );
                })}
                {decided.map((d) => mark(d, "sd-dot sd-dot--decided", { ...row(waiting.length, waiting.length + 1), "--x": `${at(d.at)}%` } as CSSProperties))}
              </>
            )}

            {l === "doing" &&
              work.map((w, k) => {
                const x = at(w.at);
                if (w.state === "ongoing")
                  return mark(
                    w,
                    "sd-run",
                    { ...row(rows[k], 3), "--x": `${x}%`, "--w": `${Math.max(now - x, 0.7)}%` } as CSSProperties,
                    w.progress && <span className="sd-run__fill" style={{ width: `${(w.progress.done / w.progress.of) * 100}%` }} />,
                  );
                return mark(w, "sd-dot", { ...row(rows[k], 3), "--x": `${x}%` } as CSSProperties);
              })}
          </div>

          <div className="sd-ahead" data-lane={l}>
            {l === "monitoring" &&
              watches.map((w, r) => (
                <span key={w.id} className="sd-horizon" style={row(r, watches.length)}>
                  {w.horizon}
                </span>
              ))}
            {l === "doing" &&
              tomorrow.map((t, r) => (
                <button
                  key={t.id}
                  type="button"
                  className="sd-tomorrow"
                  style={row(r, Math.max(tomorrow.length, 3))}
                  data-on={focus === t.id || undefined}
                  data-related={related.has(t.id) || undefined}
                  data-held={isHeld(t.actionId) || undefined}
                  onClick={() => onFocus(t.id)}
                >
                  <span className="tabular">{t.at}</span>
                  {t.title}
                </button>
              ))}
          </div>
        </div>
      ))}

      {/* the exchanges: one part of the day among the others */}
      <div className="sd-head sd-head--talk">
        <span className="sd-head__name">{copy.exchanges.name}</span>
      </div>
      <div className="sd-plot sd-plot--talk">
        {exchanges.map((e, k) => {
          const x = at(e.from);
          const w = Math.max(at(e.to) - x, 0.5);
          return (
            <button
              key={e.id}
              type="button"
              className="sd-mark sd-talk"
              style={{ ...row(talkRows[k], 2), "--x": `${x}%`, "--w": `${w}%` } as CSSProperties}
              data-on={openExchange === e.id || undefined}
              data-edge={x > 72 ? "end" : undefined}
              aria-pressed={openExchange === e.id}
              aria-label={`${e.from}, ${e.title}`}
              onClick={() => onExchange(e.id)}
            >
              {Array.from(new Set(e.moments)).map((m) => (
                <span key={m} className="sd-talk__at" style={{ left: `${w > 0.5 ? ((at(m) - x) / w) * 100 : 50}%` }} />
              ))}
              <span className="sd-tip" aria-hidden="true">
                <span className="sd-tip__when tabular">{e.from === e.to ? e.from : `${e.from} to ${e.to}`}</span>
                <span className="sd-tip__title">{e.title}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="sd-ahead sd-ahead--talk">
        <button type="button" className="sd-all" onClick={onHistory}>
          {copy.exchanges.all}
        </button>
      </div>
    </div>
  );
}
