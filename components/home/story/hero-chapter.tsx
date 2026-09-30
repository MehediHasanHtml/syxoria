"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { hero } from "@/content/home";
import { cn } from "@/lib/cn";
import { useFilm } from "../film";
import { COL, Eyebrow, LEFT, Layer, Title } from "./primitives";

/** 01 — First impression: what Syxoria is, beside the Core floating in the dark. */
export function HeroChapter() {
  const film = useFilm();
  return (
    <Layer name="hero" className={cn(LEFT, "story-layer--visible")}>
      <div className={COL}>
        <Eyebrow data-r index={1}>
          {hero.eyebrow}
        </Eyebrow>
        <Title data-r data-split as="h1" id="hero-title" lead={hero.titleLead} accent={hero.titleAccent} className="mt-6 short:mt-3" />
        <p data-r data-split className="mt-6 max-w-[26rem] text-[15px] leading-relaxed text-fg-2 short:mt-3 short:text-[14px] sm:text-base">
          {hero.body}
        </p>
        <div data-r className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 short:mt-5">
          <Link
            href={hero.primaryCta.href}
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-fg pl-6 pr-5 text-sm font-medium text-canvas transition-[background-color,gap] duration-300 ease-out-soft hover:gap-3.5 hover:bg-white"
          >
            {hero.primaryCta.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => film.open()} className="group inline-flex items-center gap-3 text-sm text-fg-2 transition-colors hover:text-fg">
            <span className="grid size-11 place-items-center rounded-full border border-line-strong transition-[border-color,transform] duration-500 ease-out-soft group-hover:scale-110 group-hover:border-fg-3">
              <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
            </span>
            {hero.filmCta}
          </button>
        </div>
      </div>
    </Layer>
  );
}
