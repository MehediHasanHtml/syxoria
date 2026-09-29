"use client";

import { ArrowRight } from "lucide-react";
import { modules } from "@/content/home";
import { cn } from "@/lib/cn";
import { productModules } from "@/lib/mock-data/modules";
import type { Explore } from "../use-explore";
import { useCanHover } from "../use-explore";
import { COL, Eyebrow, LEFT, Layer, Title } from "./primitives";

const pad = (i: number) => String(i + 1).padStart(2, "0");

/**
 * 03 — The Core opened. The words beside it are the Core's information panel:
 * an overview until a branch (or a module name) is explored, then that
 * module's role, what it does and a way to open it in full. The list doubles
 * as the accessible, touch-friendly way to explore the same branches.
 */
export function ModulesChapter({ focus, explore, onOpen }: { focus: number | null; explore: Explore; onOpen: (i: number) => void }) {
  const canHover = useCanHover();
  const active = focus === null ? null : productModules[focus];

  return (
    <Layer name="modules" className={LEFT} labelledBy="modules-title">
      <div className={COL}>
        <Eyebrow data-r>{modules.eyebrow}</Eyebrow>
        <div data-r className="mt-6 short:mt-3">
          <Title id="modules-title" lead={modules.titleLead} accent={modules.titleAccent} />
        </div>

        {/* The information panel — fixed height so exploring never moves the layout */}
        <div data-r aria-live="polite" className="mt-5 h-[7.75rem] short:mt-3 short:h-[4.5rem] sm:h-[7.25rem]">
          {active === null || focus === null ? (
            <div key="overview" className="animate-fade-in">
              <p className="max-w-[26rem] text-[15px] leading-relaxed text-fg-2 short:text-[14px]">{modules.body}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-fg-3 short:hidden">{canHover ? modules.hint.pointer : modules.hint.touch}</p>
            </div>
          ) : (
            <div key={active.key} className="animate-fade-in">
              <p className="flex items-baseline gap-3 text-[11px] uppercase tracking-[0.24em]">
                <span className="tabular text-fg-3">{pad(focus)}</span>
                <span className="text-fg">{active.name}</span>
                <span className="text-accent">{active.role}</span>
              </p>
              <p className="mt-2.5 max-w-[26rem] text-[15px] leading-relaxed text-fg-2 short:line-clamp-2 short:text-[13.5px]">{active.summary}</p>
              <button
                type="button"
                {...explore(focus)}
                onClick={() => onOpen(focus)}
                aria-haspopup="dialog"
                className="group mt-3 inline-flex items-center gap-2 text-[13px] text-fg transition-colors hover:text-white short:hidden"
              >
                {modules.open} {active.name}
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Module list: a grid beside the Core, a swipeable row on small screens */}
        <ul
          data-r
          aria-label="The six modules"
          className="-mx-(--gutter) mt-4 flex snap-x gap-2 overflow-x-auto px-(--gutter) pb-1 scrollbar-none side:mx-0 side:grid side:grid-cols-2 side:gap-x-6 side:gap-y-0 side:overflow-visible side:px-0 side:pb-0 short:mt-2"
        >
          {productModules.map((m, i) => {
            const on = focus === i;
            return (
              <li key={m.key} className="shrink-0 snap-start">
                <button
                  type="button"
                  {...explore(i)}
                  aria-haspopup="dialog"
                  aria-pressed={on}
                  className={cn(
                    "group flex w-full items-baseline gap-2.5 whitespace-nowrap text-left transition-[color,border-color,background-color,opacity] duration-200 ease-out-soft",
                    // small screens: tappable chips
                    "h-11 items-center rounded-full border px-4 text-[13px]",
                    on ? "border-fg-3 bg-white/[0.06] text-fg" : "border-line text-fg-2",
                    // beside the Core: a quiet list with a hairline
                    "side:h-auto side:rounded-none side:border-0 side:border-t side:border-line side:bg-transparent side:px-0 side:py-2.5 short:side:py-1.5",
                    focus !== null && !on && "side:opacity-45",
                  )}
                >
                  <span className={cn("tabular text-[11px] transition-colors", on ? "text-accent" : "text-fg-3")}>{pad(i)}</span>
                  <span className={cn("transition-colors", on ? "text-fg" : "text-fg-2 group-hover:text-fg")}>{m.name}</span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-fg-3 hidden side:inline">{m.role}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Layer>
  );
}
