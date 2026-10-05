import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Building blocks shared by the story's chapters. Words sit at the bottom of
 * small screens (the Core above them) and in a side column on desktop.
 *
 * Reveal hooks for the story timeline: `data-r` marks a piece that comes in;
 * with `data-split` it is split into lines that rise out of their masks
 * (static text only — React must not re-render its content).
 */

export const LEFT = "bottom-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] side:bottom-auto side:top-[calc(50%+var(--header-h)/2)] side:-translate-y-1/2 side:pb-0";
/** Anchored low, like a caption: for chapters where the Core and what surrounds it need the room. */
export const LOW = "bottom-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] side:pb-[9svh]";
export const COL = "max-w-[34rem] side:max-w-[27rem] xl:max-w-[30rem] short:max-w-[21rem]";

type Reveal = { "data-r"?: boolean; "data-split"?: boolean };

/**
 * A chapter's title: a light lead, then an italic serif accent. `highlight` — a phrase of the accent
 * set in the Core's light, for the one idea a chapter must leave (used sparingly).
 */
export function Title({
  lead,
  accent,
  highlight,
  as: Tag = "h2",
  id,
  className,
  ...rest
}: { lead: string; accent: string; highlight?: string; as?: "h1" | "h2"; id?: string; className?: string } & Reveal) {
  const at = highlight ? accent.indexOf(highlight) : -1;
  return (
    <Tag {...rest} id={id} className={cn("font-display text-display font-extralight tracking-[-0.045em] text-fg short:text-[1.85rem]", className)}>
      {lead}{" "}
      <em className="font-serif text-[1.1em] font-normal italic tracking-[-0.01em] text-fg">
        {at < 0 || !highlight ? (
          accent
        ) : (
          <>
            {accent.slice(0, at)}
            <span className="text-accent-strong">{highlight}</span>
            {accent.slice(at + highlight.length)}
          </>
        )}
      </em>
    </Tag>
  );
}

/** The chapter's index and name, set in mono: "02 — One core" (the index in the Core's light). */
export function Eyebrow({ index, children, className, ...rest }: { index?: number; children: ReactNode; className?: string } & Reveal) {
  return (
    <p {...rest} className={cn("font-mono text-[10.5px] uppercase tracking-[0.32em] text-fg-3", className)}>
      {index !== undefined && (
        <span className="tabular">
          <span className="text-accent">{String(index).padStart(2, "0")}</span>
          <span className="text-fg-2"> — </span>
        </span>
      )}
      {children}
    </p>
  );
}

/**
 * A chapter's words. Hidden until the story timeline reveals it. Only links
 * and buttons take the pointer, so the Core behind stays reachable.
 */
export function Layer({ name, className, children, labelledBy }: { name: string; className?: string; children: ReactNode; labelledBy?: string }) {
  return (
    <div
      data-layer={name}
      role={labelledBy ? "group" : undefined}
      aria-labelledby={labelledBy}
      className={cn("story-layer pointer-events-none absolute inset-x-0 [&_a]:pointer-events-auto [&_button]:pointer-events-auto", className)}
    >
      <div className="container-story">{children}</div>
    </div>
  );
}
