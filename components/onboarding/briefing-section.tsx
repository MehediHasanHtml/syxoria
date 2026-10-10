import type { ReactNode } from "react";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. All four share
 * one composition, their rows lined up across the briefing: what the step is and its figure (the
 * briefing reads at a glance as four of them — how much, how long, how much better, when), its
 * stretch of the drawing (the lanes meet edge to edge, so the four read as one), then what it
 * means. They arrive left to right, each given its own moment: the one just reached holds the
 * attention while the steps before it settle back. The action, where understanding becomes
 * execution, arrives last and strongest — the Core's emerald wells up through it, once.
 * Styles: "The first briefing".
 */
export function BriefingSection({
  label,
  kind,
  shown,
  current,
  aside,
  lead,
  lanes,
  children,
}: {
  label: string;
  kind: "priority" | "insight" | "recommendation" | "action";
  shown: boolean;
  /** The step just reached, while the reasoning is still unfolding */
  current?: boolean;
  /** Beside the step's name — the action says which mandate it is acting under */
  aside?: ReactNode;
  /** The step's figure, and what it measures */
  lead: ReactNode;
  /** The step's stretch of the drawing */
  lanes: ReactNode;
  /** What the step means: one statement, and what supports it */
  children: ReactNode;
}) {
  return (
    <section aria-label={label} data-kind={kind} data-shown={shown || undefined} data-current={current || undefined} className="onb-brief">
      {kind === "action" && <span aria-hidden="true" className="onb-brief__fill" />}
      <div className="onb-brief__top">
        <p className="onb-brief__label font-label text-label uppercase">
          <span aria-hidden="true" className="onb-brief__mark" />
          {label}
          {aside && <span className="onb-brief__aside">{aside}</span>}
        </p>
        {lead}
      </div>
      <div className="onb-brief__lanes">{lanes}</div>
      <div className="onb-brief__words onb-brief__then">{children}</div>
    </section>
  );
}
