import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One step of the briefing's reasoning — priority, insight, recommendation, action. They read
 * left to right as one line of thought; the action, where understanding becomes execution,
 * carries a little more of the Core's emerald.
 */
export function BriefingSection({ label, kind, shown, style, children }: { label: string; kind: "priority" | "insight" | "recommendation" | "action"; shown: boolean; style?: CSSProperties; children: ReactNode }) {
  return (
    <section aria-label={label} data-kind={kind} data-shown={shown || undefined} className={cn("onb-brief", kind === "action" && "onb-brief--action")} style={style}>
      <p className="onb-brief__label flex items-center gap-2.5 font-label text-label uppercase">
        <span aria-hidden="true" className="onb-brief__mark" />
        {label}
      </p>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}
