"use client";

import { hero } from "@/content/home";
import { cn } from "@/lib/cn";
import { CoreButton, LensButton } from "../core-button";
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
          <CoreButton href={hero.primaryCta.href}>{hero.primaryCta.label}</CoreButton>
          <LensButton onClick={() => film.open()} aria-haspopup="dialog">
            {hero.filmCta}
          </LensButton>
        </div>
      </div>
    </Layer>
  );
}
