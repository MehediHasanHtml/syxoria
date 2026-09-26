"use client";

import { Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AccordionItem = { id: string; title: string; content: ReactNode };

/**
 * Accessible accordion (button + region). Height animates via CSS grid rows,
 * so no JS measurement or layout thrashing.
 */
export function Accordion({ items, className, defaultOpen }: { items: AccordionItem[]; className?: string; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const baseId = useId();

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        const btnId = `${baseId}-${item.id}-btn`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left text-base text-fg transition-colors hover:text-white sm:text-[17px]"
              >
                <span className="font-medium tracking-tight">{item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border border-line text-fg-2 transition-[transform,border-color,color] duration-300 ease-out-soft group-hover:border-line-strong group-hover:text-fg",
                    isOpen && "rotate-45 border-accent-line text-accent",
                  )}
                >
                  <Plus className="size-3.5" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out-soft",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="max-w-2xl pb-7 pr-12 text-[15px] leading-relaxed text-fg-2">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
