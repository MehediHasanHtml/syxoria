"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Play } from "lucide-react";
import { useState } from "react";
import { ModuleIcon } from "@/components/shared/module-icon";
import { moduleExamples } from "@/content/home";
import { productModules } from "@/lib/mock-data/modules";
import { useFilm } from "./film";
import { Sheet } from "./sheet";

const pad = (i: number) => String(i + 1).padStart(2, "0");

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
        <span>
          Module <span className="tabular text-fg-2">{pad(shown)}</span> / {pad(count - 1)}
        </span>
      }
    >
      <div key={m.key} className="animate-fade-in">
        <div className="flex items-center gap-4">
          <ModuleIcon module={m.key} framed tone="accent" />
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{m.role}</p>
        </div>
        <h2 className="mt-5 font-display text-headline font-light text-fg">{m.name}</h2>
        <p className="mt-4 text-lead text-fg-2">{m.summary}</p>

        <h3 className="mt-10 text-[11px] uppercase tracking-[0.28em] text-fg-3">What it does</h3>
        <ul className="mt-4 grid gap-3">
          {m.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-3 text-[15px] text-fg">
              <Check className="mt-1 size-4 shrink-0 text-fg-3" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>

        <h3 className="mt-10 text-[11px] uppercase tracking-[0.28em] text-fg-3">In your workspace</h3>
        <div className="mt-4 rounded-xl border border-line bg-surface/60 p-5">
          <p className="flex items-center justify-between gap-4 text-[10.5px] uppercase tracking-[0.22em] text-fg-3">
            <span>{m.name}</span>
            <span className="tabular normal-case tracking-normal text-accent">{example.impact}</span>
          </p>
          <p className="mt-3 text-[15px] text-fg">{example.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{example.detail}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-full bg-fg pl-5 pr-4 text-sm font-medium text-canvas transition-colors hover:bg-white">
            Start free
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              film.open();
            }}
            className="inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg"
          >
            <Play className="size-3.5 fill-current" aria-hidden="true" />
            Watch the demo
          </button>
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
