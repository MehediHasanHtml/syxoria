"use client";

import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { workspace } from "@/content/home";
import { useFilm } from "../film";
import { ProductPreview } from "../product-preview";
import { Eyebrow, LEFT, Layer, Title } from "./primitives";

/**
 * 04 — The workspace rises out of the Core. The screen previews itself on
 * hover/tap; two pieces of real product UI (a suggestion, a momentum reading)
 * assemble around it (`data-float`) while the workflow steps light up.
 */
export function WorkspaceChapter({ active }: { active: boolean }) {
  const film = useFilm();
  const { insight, momentum } = workspace.cards;
  return (
    <>
      <div className="pointer-events-none absolute inset-0 [perspective:1800px]">
        <div className="container-story flex h-full items-start pt-[calc(var(--header-h)+4svh)] side:items-center side:justify-end side:pt-(--header-h)">
          <div data-panel className="story-layer pointer-events-auto relative w-full side:w-[54%] short:max-w-[23rem]">
            <ProductPreview active={active} />

            {/* A suggestion waiting for approval */}
            <div
              data-float
              aria-hidden="true"
              className="story-layer pointer-events-none absolute -left-14 top-[20%] hidden w-[15rem] rounded-xl border border-white/10 bg-canvas-2/85 p-3.5 shadow-float backdrop-blur-xl lg:block short:hidden"
            >
              <p className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-fg-3">
                <span>{insight.module} · Suggestion</span>
                <span className="tabular text-accent">{insight.impact}</span>
              </p>
              <p className="mt-2 text-[13px] leading-snug text-fg">{insight.title}</p>
              <span className="mt-3 inline-flex h-7 items-center rounded-full bg-fg px-3 text-[11.5px] font-medium text-canvas">{insight.action}</span>
            </div>

            {/* Momentum, moving */}
            <div
              data-float
              aria-hidden="true"
              className="story-layer pointer-events-none absolute -bottom-6 right-6 hidden w-[13.5rem] rounded-xl border border-white/10 bg-canvas-2/85 p-3.5 shadow-float backdrop-blur-xl lg:block short:hidden"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-fg-3">
                {momentum.module} · {momentum.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="tabular flex items-baseline gap-1.5 whitespace-nowrap font-display text-2xl font-light leading-none text-fg">
                  {momentum.value}
                  <span className="font-sans text-[11px] text-fg-3">{momentum.note}</span>
                </p>
                <svg viewBox="0 0 64 24" className="h-6 w-16 text-accent" aria-hidden="true">
                  <path d="M1 20 L12 17 L22 18 L32 12 L42 13 L52 7 L63 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Layer name="workspace" className={LEFT} labelledBy="workspace-title">
        <div className="max-w-[34rem] side:max-w-[20rem] xl:max-w-[22rem] short:max-w-[19rem]">
          <Eyebrow data-r>{workspace.eyebrow}</Eyebrow>
          <div data-r className="mt-6 short:mt-3">
            <Title id="workspace-title" lead={workspace.titleLead} accent={workspace.titleAccent} className="side:text-headline" />
          </div>
          <p data-r className="mt-5 text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
            {workspace.body}
          </p>
          <ol className="mt-6 grid gap-2.5 max-sm:hidden short:hidden">
            {workspace.steps.map((s, i) => (
              <li key={s} data-wstep className="story-layer flex items-center gap-3 text-[13px] text-fg-2">
                <span className="grid size-5 place-items-center rounded-full border border-line-strong text-fg">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="tabular text-[11px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <div data-r className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 short:mt-4">
            <button type="button" onClick={() => film.open()} className="group inline-flex items-center gap-2.5 text-sm text-fg">
              <span className="grid size-9 place-items-center rounded-full bg-fg text-canvas transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-px size-3 fill-current" aria-hidden="true" />
              </span>
              {workspace.demo.label}
              <span className="tabular text-fg-3">{workspace.demo.duration}</span>
            </button>
            <Link href={workspace.enter.href} className="group inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg">
              {workspace.enter.label}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Layer>
    </>
  );
}
