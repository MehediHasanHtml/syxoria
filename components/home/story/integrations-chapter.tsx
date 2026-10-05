"use client";

import { Plus } from "lucide-react";
import { integrations } from "@/content/home";
import { cn } from "@/lib/cn";
import { COL, Eyebrow, LEFT, Layer, Title } from "./primitives";

/** 05 — Tools wire themselves to the Core; the few shown are clearly examples. */
export function IntegrationsChapter({ onMore }: { onMore: () => void }) {
  return (
    <Layer name="integrations" className={cn(LEFT, "side:top-auto side:bottom-[12svh] side:translate-y-0")} labelledBy="integrations-title">
      <div className={COL}>
        <Eyebrow data-r>
          {integrations.eyebrow}
        </Eyebrow>
        <Title data-r data-split id="integrations-title" lead={integrations.titleLead} accent={integrations.titleAccent} className="mt-6 short:mt-3" />
        <p data-r data-split className="mt-5 max-w-[25rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
          {integrations.body}
        </p>
        <div data-r className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 short:mt-4">
          <button
            type="button"
            onClick={onMore}
            aria-haspopup="dialog"
            className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.03] pl-2 pr-4 text-sm text-fg backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-300 ease-out-soft hover:border-accent-line hover:bg-white/[0.05] hover:shadow-[0_0_24px_-8px_var(--core-glow)]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-fg text-canvas transition-transform duration-300 ease-out-soft group-hover:rotate-90">
              <Plus className="size-3.5" aria-hidden="true" />
            </span>
            {integrations.more.label}
            <span className="tabular text-accent">{integrations.more.count}</span>
          </button>
          <p className="text-[12px] text-fg-3 short:hidden">{integrations.more.note}</p>
        </div>
      </div>
    </Layer>
  );
}
