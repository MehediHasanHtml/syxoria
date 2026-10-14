import type { ReactNode } from "react";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. Each is named,
 * and beside its name says in plain words the question it answers (what needs you · why it matters
 * · what to do · what I'm doing). What it holds is its own: the four are not four equal blocks — the
 * priority leads, the insight and recommendation share one drawing beside it, the action lies below
 * — so each takes the shape of what it has to show. They arrive in order, each given its own moment: the one just reached holds the attention
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
