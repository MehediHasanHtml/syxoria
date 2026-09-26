import { useId, type ReactElement, cloneElement } from "react";
import { cn } from "@/lib/cn";

/**
 * CSS-only tooltip (hover + keyboard focus). The trigger gets aria-describedby.
 * Use for supplementary hints only — never hide essential information here.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "right" | "bottom";
  className?: string;
}) {
  const id = useId();
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {cloneElement(children, { "aria-describedby": id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute z-(--z-overlay) whitespace-nowrap rounded-sm border border-line bg-canvas-3 px-2 py-1 text-xs text-fg-2 opacity-0 shadow-panel",
          "transition-[opacity,transform] duration-200 ease-out-soft group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0",
          side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2 -translate-y-1 group-hover/tt:translate-y-0 group-focus-within/tt:translate-y-0",
          side === "right" && "left-full top-1/2 ml-2.5 -translate-x-1 -translate-y-1/2 group-hover/tt:translate-x-0 group-focus-within/tt:translate-x-0",
        )}
      >
        {content}
      </span>
    </span>
  );
}
