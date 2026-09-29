import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Building blocks shared by the story's chapters. Words sit at the bottom of
 * small screens (the Core above them) and in a side column on desktop.
 */

export const LEFT = "bottom-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] side:bottom-auto side:top-[calc(50%+var(--header-h)/2)] side:-translate-y-1/2 side:pb-0";
export const COL = "max-w-[34rem] side:max-w-[27rem] xl:max-w-[30rem] short:max-w-[21rem]";

export function Title({ lead, accent, as: Tag = "h2", id, className }: { lead: string; accent: string; as?: "h1" | "h2"; id?: string; className?: string }) {
  return (
    <Tag id={id} className={cn("font-display text-display font-light text-fg short:text-[1.85rem]", className)}>
      {lead} <em className="font-serif text-[1.08em] font-normal italic tracking-normal text-fg">{accent}</em>
    </Tag>
  );
}

export function Eyebrow({ children, className, ...rest }: { children: ReactNode; className?: string; "data-r"?: boolean }) {
  return (
    <p {...rest} className={cn("text-[11px] font-medium uppercase tracking-[0.3em] text-fg-3", className)}>
      {children}
    </p>
  );
}

/**
 * A chapter's words. Hidden until the story timeline reveals it; `[data-r]`
 * children stagger in. Only links and buttons take the pointer, so the Core
 * behind stays reachable.
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
