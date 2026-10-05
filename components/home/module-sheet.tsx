"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { ModuleIcon } from "@/components/shared/module-icon";
import { hero, moduleExamples } from "@/content/home";
import { cn } from "@/lib/cn";
import { productModules } from "@/lib/mock-data/modules";
import { CoreButton, LensButton } from "./core-button";
import { useFilm } from "./film";
import { Sheet } from "./sheet";

/**
 * "Explore deeper": everything about one module — what it does, what it looks
 * like in the workspace — with a way to step to the next branch of the Core.
 */
export function ModuleSheet({ index, onClose, onNavigate }: { index: number | null; onClose: () => void; onNavigate: (i: number) => void }) {
  const film = useFilm();
  // keep the last module on screen while the sheet slides out
  const [shown, setShown] = useState(index ?? 0);
  if (index !== null && index !== shown) setShown(index);
  const m = productModules[shown];
  const example = moduleExamples[m.key];
  const count = productModules.length;

  return (
    <Sheet
      open={index !== null}
      onClose={onClose}
      label={`${m.name} — ${m.role}`}
      header={
        <span className="flex items-center gap-4">
          Modules
          {/* where this module sits among the six: points, not numbers */}
          <span aria-hidden="true" className="flex items-center gap-1.5">
            {productModules.map((p, i) => (
              <span key={p.key} className={cn("size-1 rounded-full transition-colors duration-300", i === shown ? "bg-accent-strong" : "bg-line-strong")} />
            ))}
          </span>
        </span>
      }
    >
      <div key={m.key} className="animate-fade-in">
        <div className="flex items-center gap-4">
          <ModuleIcon module={m.key} framed tone="accent" />
          <p className="font-label text-label uppercase text-accent">{m.role}</p>
        </div>
        <h2 className="mt-5 font-display text-headline font-light text-fg">{m.name}</h2>
        <p className="mt-4 text-lead text-fg-2">{m.summary}</p>

        <h3 className="mt-10 font-label text-label uppercase text-fg-3">What it does</h3>
        <ul className="mt-4 grid gap-3">
          {m.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-3 text-[15px] text-fg">
              <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>

        <h3 className="mt-10 font-label text-label uppercase text-fg-3">In your workspace</h3>
        <div className="mt-4 rounded-xl border border-line bg-surface/60 p-5">
          <p className="flex items-center justify-between gap-4 font-label text-label uppercase text-fg-3">
            <span>{m.name}</span>
            <span className="tabular normal-case tracking-normal text-accent">{example.impact}</span>
          </p>
          <p className="mt-3 text-[15px] text-fg">{example.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{example.detail}</p>
        </div>

        {/* the homepage's own calls to action, exactly as in the hero */}
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
          <CoreButton href={hero.primaryCta.href}>{hero.primaryCta.label}</CoreButton>
          <LensButton
            onClick={() => {
              onClose();
              film.open();
            }}
            aria-haspopup="dialog"
          >
            Watch the demo
          </LensButton>
        </div>

        {/* Step through the branches without closing */}
        <nav aria-label="Other modules" className="mt-12 flex items-center justify-between border-t border-line pt-5 text-sm">
          <button type="button" onClick={() => onNavigate((shown - 1 + count) % count)} className="group inline-flex items-center gap-2 text-fg-2 transition-colors hover:text-fg">
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden="true" />
            {productModules[(shown - 1 + count) % count].name}
          </button>
          <button type="button" onClick={() => onNavigate((shown + 1) % count)} className="group inline-flex items-center gap-2 text-fg-2 transition-colors hover:text-fg">
            {productModules[(shown + 1) % count].name}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </Sheet>
  );
}
