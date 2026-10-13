import type { CSSProperties } from "react";
import { briefing as copy } from "@/content/onboarding";
import { formatCurrency } from "@/lib/format";
import type { ActionItemStatus } from "@/lib/onboarding/mandate";
import type { BriefingDraft } from "@/types";

/**
 * The briefing's evidence — what each step of the reasoning shows for itself, drawn to scale from
 * the briefing's own data and never decorative:
 *
 *   priority        who is waiting, and what each is worth        (StakeList)
 *   insight         their conversation: both sides, their last     (Exchange)
 *                   message, then the silence day by day to today
 *   recommendation  what a reply changes, on the company's history (OutcomeScale)
 *   action          the follow-ups, and where each stands          (DraftList)
 *
 * One deal is in view at a time (the largest, until another is chosen): it is the same deal in
 * every piece. Nothing changes on hover — only a click or a key chooses. White = what is · the Core's emerald = what Syxoria does about it.
 * Revealed in the onboarding, at rest in the workspace. Styles: "The first briefing".
 */

type View = {
  drafts: BriefingDraft[];
  /** The deal in view */
  focus: string;
  /** Chosen: in view until another is */
  onChoose: (id: string) => void;
};

/** Who is waiting, and what each is worth — its weight drawn against the largest. Choosing one shows its conversation. */
export function StakeList({ drafts, focus, onChoose }: View) {
  const most = Math.max(1, ...drafts.map((d) => d.value));
  return (
    <ol className="onb-stake">
      {drafts.map((d, i) => (
        <li key={d.id} style={{ "--i": i } as CSSProperties}>
          <button type="button" className="onb-stake__row" aria-pressed={focus === d.id} onClick={() => onChoose(d.id)}>
            <span className="onb-stake__name truncate">{d.company}</span>
            <span aria-hidden="true" className="onb-stake__weight">
              <span style={{ width: `${(d.value / most) * 100}%` }} />
            </span>
            <span className="onb-stake__value tabular">{formatCurrency(d.value)}</span>
            <span className="onb-stake__quiet tabular">{copy.figures.days(d.quietDays)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** How fast the exchange is read out, in milliseconds: a day of conversation, the pause before the silence, a quiet day */
const READ = { talk: 12, pause: 140, quiet: 45 };

/**
 * One conversation on a line of time that ends today, both sides drawn: what they wrote above the
 * line, what the company wrote back below it (a bar per day, as tall as the emails that day). It
 * ends on their side — the message nobody answered — then the silence, one mark per quiet day,
 * lit past the point where the company's deals start to slip. Beyond today, in emerald: the reply,
 * as far as the mandate lets Syxoria take it.
 */
export function Exchange({
  draft,
  span,
  peak,
  threshold,
  reply,
  quick,
}: {
  draft: BriefingDraft;
  /** The days the line covers — the same for every deal, so they compare */
  span: number;
  /** The busiest day on either side, in any of the deals */
  peak: number;
  /** Quiet days after which deals start to slip */
  threshold?: number;
  /** Where the reply stands under the mandate — absent until the action is reached */
  reply?: { status: ActionItemStatus; label: string };
  /** Read out faster: a deal looked at again, not the first reading */
  quick?: boolean;
}) {
  const talk = draft.rhythm?.length ? draft.rhythm : [{ them: 1, you: 0 }];
  const lead = Math.max(0, span - talk.length - draft.quietDays);
  const pace = quick ? 0.3 : 1;
  const ms = (v: number) => `${Math.round(v * pace)}ms`;
  const silent = talk.length * READ.talk + READ.pause;
  const slips = threshold !== undefined && draft.quietDays > threshold;
  // a single email must still read as one: heights follow the square root of the count
  const height = (n: number) => Math.sqrt(n / Math.max(peak, 1)).toFixed(2);

  return (
    <div className="onb-exchange" style={{ "--span": span, "--end": ms(silent + draft.quietDays * READ.quiet) } as CSSProperties}>
      <p className="sr-only">{copy.exchange.summary(draft.company, draft.quietDays)}</p>
      <span aria-hidden="true" className="onb-exchange__sides">
        <span>{copy.exchange.them}</span>
        <span>{copy.exchange.you}</span>
      </span>
      <span aria-hidden="true" className="onb-exchange__days">
        {talk.map((v, k) => (
          <i key={k} className="onb-day" data-kind={k === talk.length - 1 ? "last" : v.them || v.you ? "talk" : "rest"} style={{ "--d": ms(k * READ.talk), gridColumnStart: k === 0 ? lead + 1 : undefined } as CSSProperties}>
            {v.them > 0 && <b data-side="them" style={{ "--v": height(v.them) } as CSSProperties} />}
            {v.you > 0 && <b data-side="you" style={{ "--v": height(v.you) } as CSSProperties} />}
          </i>
        ))}
        {Array.from({ length: draft.quietDays }, (_, q) => (
          <i key={`q${q}`} className="onb-day" data-kind={threshold !== undefined && q >= threshold ? "past" : "quiet"} style={{ "--d": ms(silent + q * READ.quiet) } as CSSProperties} />
        ))}
        {slips && (
          <span className="onb-exchange__edge" style={{ left: `${((lead + talk.length + threshold) / span) * 100}%`, "--d": ms(silent + threshold * READ.quiet) } as CSSProperties}>
            <span>{copy.exchange.edge(threshold)}</span>
          </span>
        )}
        <span className="onb-exchange__today">
          <span>{copy.exchange.today}</span>
        </span>
      </span>
      <span aria-hidden="true" className="onb-exchange__reply" data-status={reply?.status} data-on={reply ? "" : undefined}>
        <i />
        <span>{reply?.label}</span>
      </span>
    </div>
  );
}

/** How much better: the two outcomes, replying and leaving it, named and drawn to scale one under the other */
export function OutcomeScale({ acted, left, ratio }: { acted: string; left: string; ratio: number }) {
  const rows = [
    { label: acted, share: 1, on: true },
    { label: left, share: 1 / Math.max(ratio, 1), on: false },
  ];
  return (
    <div aria-hidden="true" className="onb-outcome">
      {rows.map((r, i) => (
        <div key={r.label} className="onb-outcome__row" data-on={r.on || undefined} style={{ "--i": i } as CSSProperties}>
          <span className="onb-outcome__label">{r.label}</span>
          <span className="onb-outcome__bar" style={{ width: `${r.share * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

/** What Syxoria does with each: the follow-up itself, who it goes to, and where it stands under the mandate */
export function DraftList({ drafts, focus, onChoose, status, statusLabel }: View & { status: ActionItemStatus; statusLabel: string }) {
  return (
    <ol className="onb-drafts">
      {drafts.map((d, i) => (
        <li key={d.id} className="onb-draft" data-focus={focus === d.id || undefined} style={{ "--i": i } as CSSProperties} onClick={() => onChoose(d.id)}>
          <span aria-hidden="true" className="onb-draft__node" data-status={status} />
          <span className="min-w-0 flex-1">
            <span className="onb-draft__subject block truncate">{d.subject}</span>
            <span className="onb-draft__to flex items-baseline justify-between gap-3">
              <span className="truncate">
                To {d.contact} · {d.company}
              </span>
              <span className="onb-draft__status shrink-0" data-status={status}>
                {statusLabel}
              </span>
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
