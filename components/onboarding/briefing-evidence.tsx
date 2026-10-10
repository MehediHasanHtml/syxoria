import type { CSSProperties, ReactNode } from "react";
import { briefing as copy } from "@/content/onboarding";
import { formatCurrency } from "@/lib/format";
import type { ActionItemStatus } from "@/lib/onboarding/mandate";
import type { BriefingDraft } from "@/types";

/**
 * The briefing's drawing — its signature, and the template for every briefing Syxoria writes.
 * One lane per thing that matters today, read left to right through the four steps of the
 * reasoning, each step drawing its own stretch of the same lanes:
 *
 *   priority        who, and how much is at stake            (StakeLanes)
 *   insight         what happened: the exchange, then the    (SilenceLanes)
 *                   silence, one mark per day, up to today
 *   — the line of today: everything left of it is what Syxoria understood, in white;
 *     everything right of it is what happens next, in the Core's emerald —
 *   recommendation  the way forward                           (NextLanes)
 *   action          what Syxoria does with each, and its state (ActionLanes)
 *
 * Everything is drawn to scale from the briefing's own data, never decorative. On wide screens
 * the four stretches meet edge to edge and read as one drawing; stacked, each stands under its
 * step. Revealed in the onboarding, at rest in the workspace. Styles: "The first briefing".
 */

type Shared = {
  drafts: BriefingDraft[];
  /** The deal the reasoning turns to: it stands out in every stretch */
  subject: string;
  /** A deal pointed at — in any stretch — answers in all of them */
  focus: string | null;
  onFocus: (id: string | null) => void;
};

/** A stretch of the lanes: its line of small words above (what the marks are), then one lane per deal */
function Lanes({ slice, drafts, subject, focus, onFocus, axis, decorative, style, children }: Shared & { slice: string; axis?: ReactNode; decorative?: boolean; style?: CSSProperties; children: (d: BriefingDraft, i: number) => ReactNode }) {
  return (
    <div className="onb-lanes" data-slice={slice} style={style} aria-hidden={decorative || undefined}>
      <p aria-hidden="true" className="onb-lanes__axis">
        {axis}
      </p>
      <ol className="onb-lanes__rows" onPointerLeave={() => onFocus(null)}>
        {drafts.map((d, i) => (
          <li key={d.id} className="onb-lane" data-subject={d.id === subject || undefined} data-focus={focus === d.id || undefined} style={{ "--i": i } as CSSProperties} onPointerEnter={() => onFocus(d.id)}>
            {children(d, i)}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** How much: each deal and what it is worth, its weight drawn against the largest */
export function StakeLanes(props: Shared) {
  const most = Math.max(1, ...props.drafts.map((d) => d.value));
  return (
    <Lanes slice="stake" {...props}>
      {(d) => (
        <span className="onb-lane__who">
          <span className="flex items-baseline justify-between gap-3">
            <span className="onb-lane__name truncate">{d.company}</span>
            <span className="onb-lane__value tabular">{formatCurrency(d.value)}</span>
          </span>
          <span aria-hidden="true" className="onb-lane__weight">
            <span style={{ width: `${(d.value / most) * 100}%` }} />
          </span>
        </span>
      )}
    </Lanes>
  );
}

/** How fast the drawing is read out, in milliseconds: a day of exchange, the pause before the silence, a quiet day */
const READ = { talk: 12, pause: 140, quiet: 45 };

/**
 * What happened, day by day, on one shared line of time that ends today: the exchange (a bar per
 * day, as tall as the emails that day), the last email, then the silence — one small mark per
 * quiet day. Past the point where the company's deals start to slip, the marks are lit.
 */
export function SilenceLanes({ threshold, ...props }: Shared & { /** quiet days after which deals start to slip */ threshold?: number }) {
  const talkOf = (d: BriefingDraft) => (d.rhythm?.length ? d.rhythm : [1]);
  const span = Math.max(...props.drafts.map((d) => talkOf(d).length + d.quietDays));
  const peak = Math.max(1, ...props.drafts.flatMap(talkOf));
  const end = Math.max(...props.drafts.map((d) => talkOf(d).length * READ.talk + READ.pause + d.quietDays * READ.quiet));
  const share = (days: number) => `${(days / span) * 100}%`;

  return (
    <Lanes
      slice="silence"
      {...props}
      style={{ "--span": span, "--end": `${end}ms` } as CSSProperties}
      axis={
        <>
          <span>{copy.lanes.talk}</span>
          <span className="onb-lanes__today">{copy.lanes.today}</span>
        </>
      }
    >
      {(d) => {
        const talk = talkOf(d);
        const lead = span - talk.length - d.quietDays;
        const silent = talk.length * READ.talk + READ.pause;
        const slips = threshold !== undefined && d.quietDays > threshold;
        return (
          <>
            <span className="sr-only">
              {d.company}: {copy.lanes.quiet(d.quietDays)}
            </span>
            <span className="onb-lane__tag">{d.company}</span>
            <span aria-hidden="true" className="onb-lane__days">
              {talk.map((v, k) => (
                <i key={k} className="onb-day" data-kind={k === talk.length - 1 ? "last" : v ? "talk" : "rest"} style={{ "--v": (v / peak).toFixed(2), "--d": `${k * READ.talk}ms`, gridColumnStart: k === 0 ? lead + 1 : undefined } as CSSProperties} />
              ))}
              {Array.from({ length: d.quietDays }, (_, q) => (
                <i key={`q${q}`} className="onb-day" data-kind={threshold !== undefined && q >= threshold ? "past" : "quiet"} style={{ "--d": `${silent + q * READ.quiet}ms` } as CSSProperties} />
              ))}
            </span>
            {slips && <span aria-hidden="true" className="onb-lane__edge" style={{ left: share(lead + talk.length + threshold), "--d": `${silent + threshold * READ.quiet}ms` } as CSSProperties} />}
            <span aria-hidden="true" className="onb-lane__quiet tabular" style={{ left: share(lead + talk.length), "--d": `${silent + d.quietDays * READ.quiet}ms` } as CSSProperties}>
              {copy.lanes.quiet(d.quietDays)}
            </span>
          </>
        );
      }}
    </Lanes>
  );
}

/** The way forward: from the line of today, each conversation picked up again — in the Core's emerald */
export function NextLanes(props: Shared) {
  return (
    <Lanes slice="next" decorative {...props} axis={<span>{copy.lanes.next}</span>}>
      {() => <span className="onb-lane__go" />}
    </Lanes>
  );
}

/** What Syxoria does with each: the follow-up itself, who it goes to, and where it stands under the mandate */
export function ActionLanes({ status, statusLabel, ...props }: Shared & { status: ActionItemStatus; statusLabel: string }) {
  return (
    <Lanes slice="action" {...props}>
      {(d) => (
        <>
          <span aria-hidden="true" className="onb-lane__node" data-status={status} />
          <span className="min-w-0 flex-1">
            <span className="onb-lane__subject block truncate">{d.subject}</span>
            <span className="mt-0.5 flex items-baseline justify-between gap-3 text-[11.5px]">
              <span className="truncate text-fg-3">
                To {d.contact}
                <span className="onb-lane__tag-inline"> · {d.company}</span>
              </span>
              <span className="onb-lane__status shrink-0" data-status={status}>
                {statusLabel}
              </span>
            </span>
          </span>
        </>
      )}
    </Lanes>
  );
}

/** How much better: the two outcomes, acting and leaving it, drawn to scale beside the figure */
export function OutcomeScale({ acted, left, ratio }: { acted: string; left: string; ratio: number }) {
  const rows = [
    { label: acted, share: 1, on: true },
    { label: left, share: 1 / Math.max(ratio, 1), on: false },
  ];
  return (
    <div aria-hidden="true" className="onb-outcome">
      {rows.map((r, i) => (
        <div key={r.label} className="onb-outcome__row" data-on={r.on || undefined} style={{ "--i": i } as CSSProperties}>
          <span className="onb-outcome__bar" style={{ width: `${r.share * 100}%` }} />
          <span className="onb-outcome__label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}
