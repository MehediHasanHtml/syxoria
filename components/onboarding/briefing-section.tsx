import type { ReactNode } from "react";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. Each is named,
 * and beside its name says in plain words the question it answers (what needs you · why now · what
 * I suggest · what I'll do). What it holds is its own: the four are not four columns but one sheet
 * — what is, above; what Syxoria does about it, below — so each takes the shape of what it has to
 * show. They arrive in order, each given its own moment: the one just reached holds the attention
 * while the steps before it settle back. The action, where understanding becomes execution,
 * arrives last and strongest — the Core's emerald wells up through it, once.
 * Styles: "The first briefing".
 */
export function BriefingSection({
  label,
  gloss,
  kind,
  shown,
  current,
  aside,
  children,
}: {
  label: string;
  /** The question the step answers, in plain words */
  gloss: string;
  kind: "priority" | "insight" | "recommendation" | "action";
  shown: boolean;
  /** The step just reached, while the reasoning is still unfolding */
  current?: boolean;
  /** Opposite the step's name — the action says which mandate it is acting under */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={`${label}: ${gloss}`} data-kind={kind} data-shown={shown || undefined} data-current={current || undefined} className="onb-brief">
      {kind === "action" && <span aria-hidden="true" className="onb-brief__fill" />}
      <p className="onb-brief__label font-label text-label uppercase">
        {label}
        <span className="onb-brief__gloss">{gloss}</span>
        {aside && <span className="onb-brief__aside">{aside}</span>}
      </p>
      {children}
    </section>
  );
}
