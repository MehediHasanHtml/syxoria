"use client";

import { ArrowRight } from "lucide-react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { integrations } from "@/content/home";
import { Sheet } from "./sheet";

const { more } = integrations;

/** The wider list behind "More integrations", grouped by what they do. */
export function IntegrationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label={more.title} header={`${integrations.eyebrow} · ${more.count}`}>
      <h2 className="font-display text-headline font-light text-fg">{more.title}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{more.body}</p>

      <div className="mt-10 grid gap-9">
        {more.groups.map((g) => (
          <section key={g.name} aria-labelledby={`int-${g.name}`}>
            <h3 id={`int-${g.name}`} className="text-[11px] uppercase tracking-[0.28em] text-fg-3">
              {g.name}
            </h3>
            <ul className="mt-3.5 grid grid-cols-2 gap-2">
              {g.tools.map((t) => (
                <li key={t.name} className="flex h-11 items-center gap-2.5 rounded-lg border border-line bg-surface/40 px-3 text-[13.5px] text-fg">
                  {"logo" in t && t.logo ? (
                    <IntegrationLogo id={t.logo} size={16} />
                  ) : (
                    <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-surface-3 text-[9px] font-medium text-fg-2">
                      {t.name[0]}
                    </span>
                  )}
                  <span className="truncate">{t.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-line p-5">
        <p className="text-[14px] text-fg-2">{more.api}</p>
        <a href={more.request.href} className="group mt-3 inline-flex items-center gap-2 text-sm text-fg">
          {more.request.label}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </Sheet>
  );
}
