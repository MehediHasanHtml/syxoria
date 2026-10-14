import { useId, type CSSProperties } from "react";
import { briefing as copy } from "@/content/onboarding";
import { formatCurrency } from "@/lib/format";
import type { ActionItemStatus, FollowStep } from "@/lib/onboarding/mandate";
import type { BriefingDraft } from "@/types";

/**
 * The briefing's evidence — what each step of the reasoning shows for itself, drawn to scale from
 * the briefing's own data and never decorative:
 *
 *   priority        who is waiting, and what each is worth              (DealList)
 *   insight         the company's own curve: how often deals close by   (CloseCurve)
 *   + recommendation  how long the client waited, each deal on it; then
 *                   in emerald, where a reply takes them back to
 *   action          the replies, and where each stands                  (ReplyList)
 *                   the life of the priority from here                  (FollowThrough)
 *
 * One deal is in view at a time (the largest, until another is chosen): the same deal in every
 * piece. Nothing changes on hover — only a click or a key chooses. White = what is · the Core's
 * emerald = what Syxoria does about it. Styles: "The executive briefing".
 */

type View = {
  drafts: BriefingDraft[];
  /** The deal in view */
  focus: string;
  /** Chosen: in view until another is */
  onChoose: (id: string) => void;
};

/** Who is waiting, and what each is worth — its weight drawn against the largest */
export function DealList({ drafts, focus, onChoose }: View) {
  const most = Math.max(1, ...drafts.map((d) => d.value));
  return (
    <ol className="onb-deals">
      {drafts.map((d, i) => (
        <li key={d.id} style={{ "--i": i } as CSSProperties}>
          <button type="button" className="onb-deals__row" aria-pressed={focus === d.id} onClick={() => onChoose(d.id)}>
            <span className="onb-deals__name truncate">{d.company}</span>
            <span aria-hidden="true" className="onb-deals__weight">
              <span style={{ width: `${(d.value / most) * 100}%` }} />
            </span>
            <span className="onb-deals__value tabular">{formatCurrency(d.value)}</span>
            <span className="onb-deals__days tabular">{copy.days(d.quietDays)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/** A smooth line through the points (Catmull-Rom, as cubic Béziers) */
function smooth(pts: [number, number][]) {
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}

const percent = (v: number) => `${Math.round(v * 100)}%`;

/**
 * The insight and the recommendation in one drawing. In white, what is: on the company's own
 * history, how often a deal closed by how many days the client had been waiting for an answer;
 * past the threshold it falls to half, and every deal waiting today sits on that line, as large as
 * it is worth. Then in emerald, what a reply changes: each one lifted back to where answered deals
 * close.
 */
export function CloseCurve({
  curve,
  threshold,
  lifted,
  drafts,
  focus,
  onChoose,
}: View & {
  /** Close rate by days waiting (index = days) */
  curve: number[];
  threshold: number;
  /** The recommendation has been reached: what a reply changes is drawn */
  lifted: boolean;
}) {
  const last = curve.length - 1;
  const top = Math.max(...curve) * 1.22;
  const x = (d: number) => (Math.min(d, last) / last) * 100;
  const y = (rate: number) => 100 - (rate / top) * 100;
  const rate = (d: number) => curve[Math.min(Math.round(d), last)];
  const line = smooth(curve.map((v, d) => [x(d), y(v)]));
  const high = curve[0];
  const low = curve[last];
  const most = Math.max(1, ...drafts.map((d) => d.value));
  const fill = `curve${useId().replace(/[^\w-]/g, "")}`;

  return (
    <figure className="onb-curve" data-lifted={lifted || undefined}>
      <figcaption className="sr-only">{copy.curve.summary(threshold, percent(high), percent(low))}</figcaption>
      <span aria-hidden="true" className="onb-curve__rate">
        {copy.curve.rate}
      </span>
      <div className="onb-curve__plot">
        {/* past the threshold: where deals slip */}
        <span aria-hidden="true" className="onb-curve__zone" style={{ left: `${x(threshold)}%` }}>
          <span>{copy.curve.edge(threshold)}</span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="onb-curve__svg">
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.06" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="onb-curve__area" d={`${line} L100 100 L0 100 Z`} fill={`url(#${fill})`} />
          <path className="onb-curve__line" d={line} vectorEffect="non-scaling-stroke" />
          {/* where an answered deal stands: the level a reply brings them back to */}
          <line className="onb-curve__level" x1="0" x2="100" y1={y(high)} y2={y(high)} vectorEffect="non-scaling-stroke" />
        </svg>
        <span aria-hidden="true" className="onb-curve__value" data-at="high" style={{ left: 0, top: `${y(high)}%` }}>
          {percent(high)}
        </span>
        <span aria-hidden="true" className="onb-curve__value" data-at="low" style={{ right: 0, top: `${y(low)}%` }}>
          {percent(low)}
        </span>

        {drafts.map((d, i) => {
          const size = 0.55 + (d.value / most) * 0.55;
          const on = focus === d.id;
          return (
            <span key={d.id} className="onb-curve__deal" data-on={on || undefined} style={{ left: `${x(d.quietDays)}%`, "--i": i } as CSSProperties}>
              {/* in emerald: where a reply takes it */}
              <span aria-hidden="true" className="onb-curve__lift" style={{ top: `${y(high)}%`, height: `${y(rate(d.quietDays)) - y(high)}%` }} />
              <span aria-hidden="true" className="onb-curve__target" style={{ top: `${y(high)}%` }} />
              <button
                type="button"
                className="onb-curve__dot"
                aria-pressed={on}
                aria-label={copy.curve.deal(d.company, d.quietDays)}
                onClick={() => onChoose(d.id)}
                style={{ top: `${y(rate(d.quietDays))}%`, "--s": `${r2(size)}rem` } as CSSProperties}
              />
              <span aria-hidden="true" className="onb-curve__name">
                {d.company} · {copy.days(d.quietDays)}
              </span>
            </span>
          );
        })}
      </div>
      <span aria-hidden="true" className="onb-curve__axis">
        <span>{copy.curve.days}</span>
        <span className="tabular">{copy.days(last)}</span>
      </span>
    </figure>
  );
}

/** Who each reply goes to, and where it stands under the mandate */
export function ReplyList({ drafts, focus, onChoose, status, statusLabel }: View & { status: ActionItemStatus; statusLabel: string }) {
  return (
    <ol className="onb-replies">
      {drafts.map((d, i) => (
        <li key={d.id} style={{ "--i": i } as CSSProperties}>
          <button type="button" className="onb-replies__item" aria-pressed={focus === d.id} title={d.subject} onClick={() => onChoose(d.id)}>
            <span aria-hidden="true" className="onb-replies__node" data-status={status} />
            <span className="truncate">{d.contact}</span>
            <span className="sr-only">
              , {d.company}: {statusLabel}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/**
 * The life of the priority, from the moment it was found to the deal closing: what Syxoria has
 * done, what it is doing now, what waits on the user, then on the client. The end carries what is
 * at stake — the result it all leads to.
 */
export function FollowThrough({ steps, outcome }: { steps: FollowStep[]; outcome: string }) {
  return (
    <ol className="onb-follow" style={{ "--n": steps.length } as CSSProperties}>
      {steps.map((s, i) => (
        <li key={s.id} className="onb-follow__step" data-state={s.state} data-by={s.by} style={{ "--i": i } as CSSProperties}>
          <span aria-hidden="true" className="onb-follow__node" />
          <span className="onb-follow__label">{s.label}</span>
          <span className="onb-follow__when tabular">{i === steps.length - 1 ? outcome : s.when}</span>
          {s.state !== "next" && <span className="sr-only">{s.state === "done" ? ", done" : ", under way"}</span>}
        </li>
      ))}
    </ol>
  );
}
