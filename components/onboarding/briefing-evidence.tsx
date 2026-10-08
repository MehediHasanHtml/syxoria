import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import type { BriefingDraft } from "@/types";

/**
 * The evidence of the briefing — one sign per step of its reasoning, each a different measure of
 * the same story: how much (the stake), how long (the silence), how much better (the outcome).
 * Drawn to scale from the briefing's own data, never decorative; they replace words rather than
 * add to them. Revealed in the onboarding, at rest in the workspace. Styles: "The first briefing".
 */

/** How much: what is at stake, split by deal, to scale — the one the reasoning turns to stands out */
export function StakeStrip({ drafts, focus, onFocus }: { drafts: BriefingDraft[]; focus: string; onFocus: (id: string | null) => void }) {
  const total = drafts.reduce((s, d) => s + d.value, 0) || 1;
  const focused = drafts.find((d) => d.id === focus) ?? drafts[0];
  return (
    <figure className="onb-stake" onPointerLeave={() => onFocus(null)}>
      <div aria-hidden="true" className="onb-stake__bar">
        {drafts.map((d, i) => (
          <span
            key={d.id}
            className="onb-stake__seg"
            data-focus={d.id === focused.id || undefined}
            style={{ flexGrow: d.value, ["--i" as string]: i } as CSSProperties}
            onPointerEnter={() => onFocus(d.id)}
          />
        ))}
      </div>
      <figcaption className="onb-stake__caption mt-2 flex items-baseline gap-1.5 text-[11.5px] text-fg-3">
        <span className="truncate text-fg-2">{focused.company}</span>
        <span className="tabular">· {Math.round((focused.value / total) * 100)}% of it</span>
        <span className="sr-only">
          {drafts.map((d) => `${d.company} ${formatCurrency(d.value)}`).join(", ")}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * How long: the silence, counted in days — the conversation, its last email, then one mark per
 * quiet day up to today; the days past the point where the company's deals start to slip are lit.
 */
export function SilenceLine({ days, threshold, note }: { days: number; threshold: number; note: string }) {
  return (
    <figure className="onb-silence" style={{ ["--days" as string]: days } as CSSProperties}>
      <div aria-hidden="true" className="onb-silence__track">
        <span className="onb-silence__talk" />
        <span className="onb-silence__last" />
        {Array.from({ length: days }, (_, i) => (
          <span key={i} className="onb-silence__day" data-past={i >= threshold || undefined} data-edge={i === threshold || undefined} style={{ ["--i" as string]: i } as CSSProperties} />
        ))}
        <span className="onb-silence__today" />
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[10.5px] text-fg-3">
        <span>Last email</span>
        <span>Today</span>
      </div>
      <figcaption className="onb-silence__note mt-2.5 flex items-center gap-2 text-[11.5px] leading-snug text-fg-2">
        <span aria-hidden="true" className="onb-silence__key" />
        {note}
      </figcaption>
    </figure>
  );
}

/** How much better: the two outcomes, acting and leaving it, drawn to scale */
export function OutcomeScale({ acted, left, ratio }: { acted: string; left: string; ratio: number }) {
  const rows = [
    { label: acted, share: 1, on: true },
    { label: left, share: 1 / Math.max(ratio, 1), on: false },
  ];
  return (
    <div aria-hidden="true" className="onb-outcome grid gap-2">
      {rows.map((r, i) => (
        <div key={r.label} className={cn("onb-outcome__row", r.on && "onb-outcome__row--on")} style={{ ["--i" as string]: i } as CSSProperties}>
          <span className="block text-[11px] leading-none text-fg-3">{r.label}</span>
          <span className="onb-outcome__bar mt-1.5 block" style={{ width: `${r.share * 100}%` }} />
        </div>
      ))}
    </div>
  );
}
