import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. They read
 * left to right as one line of thought, each given its own moment: the one just reached holds the
 * attention while the steps before it settle back. The action, where understanding becomes
 * execution, arrives last and strongest — the Core's emerald wells up through it, once.
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
  children: ReactNode;
}) {
  return (
    <section aria-label={label} data-kind={kind} data-shown={shown || undefined} data-current={current || undefined} className={cn("onb-brief", kind === "action" && "onb-brief--action")} style={style}>
      {kind === "action" && <span aria-hidden="true" className="onb-brief__fill" />}
      <p className="onb-brief__label flex items-center gap-2.5 font-label text-label uppercase">
        <span aria-hidden="true" className="onb-brief__mark" />
        {label}
      </p>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}
