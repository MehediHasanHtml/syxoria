import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. They read
 * left to right as one line of thought, each given its own moment: the one just reached holds the
 * attention while the steps before it settle back. The first three share one composition (their
 * rows line up across the briefing): a figure, its evidence, then what it means — so the briefing
 * reads at a glance as three numbers. The action, where understanding becomes execution, arrives
 * last and strongest — the Core's emerald wells up through it, once.
 * Styles: "The first briefing".
 */
export function BriefingSection({
  label,
  kind,
  shown,
  current,
  style,
  children,
}: {
  label: string;
  kind: "priority" | "insight" | "recommendation" | "action";
  shown: boolean;
  /** The step just reached, while the reasoning is still unfolding */
  current?: boolean;
  style?: CSSProperties;
  /** The action: its content. The other steps: their rows — the figure, the evidence, the words */
  children: ReactNode;
}) {
  const action = kind === "action";
  return (
    <section aria-label={label} data-kind={kind} data-shown={shown || undefined} data-current={current || undefined} className={cn("onb-brief", action && "onb-brief--action")} style={style}>
      {action && <span aria-hidden="true" className="onb-brief__fill" />}
      <p className="onb-brief__label flex items-center gap-2.5 font-label text-label uppercase">
        <span aria-hidden="true" className="onb-brief__mark" />
        {label}
      </p>
      {action ? <div className="mt-3.5">{children}</div> : children}
    </section>
  );
}
