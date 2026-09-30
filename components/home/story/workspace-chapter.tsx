"use client";

import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { workspace } from "@/content/home";
import { useFilm } from "../film";
import { Eyebrow, LEFT, Layer, Title } from "./primitives";

/**
 * 04 — The workspace. Its screen is not here: it rises out of the Core and
 * stands beside it in the 3D scene (see LiveScreen). These are the words
 * next to it, and the accessible way to play the demo.
 */
export function WorkspaceChapter() {
  const film = useFilm();
  return (
    <Layer name="workspace" className={LEFT} labelledBy="workspace-title">
      <div className="max-w-[34rem] side:max-w-[19rem] xl:max-w-[21rem] short:max-w-[19rem]">
        <Eyebrow data-r index={4}>
          {workspace.eyebrow}
        </Eyebrow>
        <Title data-r data-split id="workspace-title" lead={workspace.titleLead} accent={workspace.titleAccent} className="mt-6 side:text-headline short:mt-3" />
        <p data-r data-split className="mt-5 text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px]">
          {workspace.body}
        </p>
        <ol className="mt-6 grid gap-2.5 max-sm:hidden short:hidden">
          {workspace.steps.map((s, i) => (
            <li key={s} data-wstep className="story-layer flex items-center gap-3 text-[13px] text-fg-2">
              <span className="grid size-5 place-items-center rounded-full border border-line-strong text-fg">
                <Check className="size-3" aria-hidden="true" />
              </span>
              <span className="tabular font-mono text-[10.5px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
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
  );
}
