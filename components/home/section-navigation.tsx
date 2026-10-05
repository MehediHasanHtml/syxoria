"use client";

import { cn } from "@/lib/cn";
import { NAV_SECTIONS } from "./chapters";
import { useSmoothScroll } from "./smooth-scroll";
import { useActiveSection } from "./use-active-section";

/**
 * The numbered navigation on the right: every number jumps (smoothly) to its
 * section, and the current one follows the scroll — marked by a short line of
 * the Core's light. Hovering the rail shows all the names. For explorers and
 * direct visitors alike.
 */
export function SectionNavigation() {
  const { scrollTo } = useSmoothScroll();
  const activeId = useActiveSection();
  const active = Math.max(0, NAV_SECTIONS.findIndex((s) => s.id === activeId));

  return (
    <nav data-rail aria-label="Sections" className="group/nav transition-opacity duration-700 ease-out-soft fixed right-2 top-1/2 z-(--z-sticky) hidden -translate-y-1/2 md:block lg:right-3">
      <ol className="flex flex-col">
        {NAV_SECTIONS.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={on ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(i === 0 ? 0 : `#${s.id}`);
                  history.replaceState(null, "", i === 0 ? location.pathname : `#${s.id}`);
                }}
                className="group flex h-9 items-center justify-end gap-2.5 rounded-full pl-3 pr-1 outline-offset-0"
              >
                <span
                  className={cn(
                    "whitespace-nowrap text-[10px] uppercase tracking-[0.28em] transition-[opacity,transform,color] duration-300 ease-out-soft [text-shadow:0_1px_12px_rgb(0_0_0/0.9)]",
                    // names appear when the rail is hovered or focused — the rest of the time it stays out of the way
                    "translate-x-1 opacity-0 group-hover/nav:translate-x-0 group-hover/nav:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
                    on ? "text-fg" : "text-fg-3 group-hover:text-fg",
                  )}
                >
                  {s.label}
                </span>
                <span className={cn("tabular text-[11px] transition-colors duration-300", on ? "text-fg" : "text-fg-3 group-hover:text-fg")}>{String(i + 1).padStart(2, "0")}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px transition-[width,background-color,box-shadow] duration-500 ease-out-soft",
                    on ? "w-4 bg-accent-strong shadow-[0_0_8px_rgb(79_174_134/0.6)]" : "w-2 bg-fg-3 group-hover:w-3 group-hover:bg-fg-2",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
