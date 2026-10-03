"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { workspace } from "@/content/home";
import type { CoreState } from "@/lib/core/state";
import { LensButton } from "../core-button";
import { DemoSteps } from "../demo-steps";
import { useFilm } from "../film";
import { useCanHover } from "../use-explore";
import { Eyebrow, LEFT, Layer, Title } from "./primitives";

/**
 * 04 — The workspace. Its laptop is not here: it rises out of the Core and
 * stands beside it in the 3D scene, then glides with the scroll towards the
 * centre (see LiveScreen). Two layers of words go with it:
 *
 *   workspace  beside the laptop, while it stands next to the Core
 *   demo       once it is centred: the session it plays, told underneath, and how to open it fullscreen
 */
export function WorkspaceChapter({ state }: { state: CoreState }) {
  const film = useFilm();
  const canHover = useCanHover();
  return (
    <>
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
              <li key={s} data-r className="flex items-center gap-3 text-[13px] text-fg-2">
                <span className="grid size-5 place-items-center rounded-full border border-line-strong text-fg">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="tabular font-mono text-[10.5px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </Layer>

      <Layer name="demo" className="bottom-0 pb-[max(1.75rem,env(safe-area-inset-bottom))]" labelledBy="demo-title">
        <div className="mx-auto max-w-5xl">
          <div data-r className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <p id="demo-title" className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-fg-3">
              <span className="text-fg-2">04 — </span>
              {workspace.eyebrow} · {workspace.demo.live}
            </p>
            <div className="flex items-center gap-6">
              <p className="text-[12px] text-fg-3 max-md:hidden">{canHover ? workspace.demo.hint.pointer : workspace.demo.hint.touch}</p>
              <LensButton onClick={() => film.open({ at: state.live < 1 ? state.live : 0 })} aria-haspopup="dialog">
                {workspace.demo.openFull}
              </LensButton>
              <Link href={workspace.enter.href} className="group hidden items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg sm:inline-flex">
                {workspace.enter.label}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div data-r className="mt-5 max-sm:hidden short:hidden">
            <DemoSteps progress={() => state.live} />
          </div>
        </div>
      </Layer>
    </>
  );
}
