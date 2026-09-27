"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { product } from "@/content/home";
import { cn } from "@/lib/cn";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";
import overview from "@/public/product/dashboard-overview.png";
import insights from "@/public/product/dashboard-insights.png";
import projects from "@/public/product/dashboard-projects.png";
import { useFilm } from "./film";

const shots: Record<string, { image: StaticImageData; alt: string }> = {
  overview: {
    image: overview,
    alt: "Syxoria overview: revenue recovered, time saved, automations, a value-created chart and the momentum score.",
  },
  insights: { image: insights, alt: "Syxoria insights: recommendations ranked by impact, each ready to apply or dismiss." },
  projects: { image: projects, alt: "Syxoria projects: status, progress, owners and impact for every project." },
};

/**
 * Chapter three — the product.
 * The screen rises and straightens as you arrive, then switches on.
 * It is an entry point: hover shows a "play" cursor, click plays the film;
 * the views below switch what's on screen; the workspace is one link away.
 */
export function ProductStage({ integrations }: { integrations: { id: string; name: string }[] }) {
  const film = useFilm();
  const [view, setView] = useState("overview");
  const [hover, setHover] = useState(false);
  const cursor = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const screen = useRef<HTMLDivElement>(null);

  // Screen arrival: 0 (tilted, off) → 1 (upright, on)
  const onProgress = useCallback((p: number) => {
    const s = Math.min(1, Math.max(0, (p - 0.08) / 0.42));
    const e = 1 - (1 - s) ** 3;
    screen.current?.style.setProperty("--s", e.toFixed(4));
  }, []);
  const section = useScrollProgress<HTMLElement>(onProgress, { mode: "through" });

  // Cursor follower eases toward the pointer
  useEffect(() => {
    if (!hover) return;
    let raf = 0;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.2;
      pos.current.y += (target.current.y - pos.current.y) * 0.2;
      if (cursor.current) cursor.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover]);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!hover) {
      pos.current = { ...target.current };
      setHover(true);
    }
  }

  return (
    <section ref={section} id="product" aria-labelledby="product-title" className="relative py-28 sm:py-40">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-fg-3">{product.eyebrow}</p>
          <h2 id="product-title" className="mt-6 text-headline font-light text-fg">
            {product.title}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-fg-3">{product.body}</p>
        </div>

        {/* The screen */}
        <div className="mt-16 [perspective:2200px] sm:mt-20">
          <div
            ref={screen}
            className="product-screen relative mx-auto max-w-6xl rounded-[20px] border border-line-strong bg-[#0c0d0e] p-2 sm:p-2.5"
            style={{ ["--s" as string]: 0 }}
          >
            <div
              className="group relative aspect-[16/10] cursor-none overflow-hidden rounded-[13px] bg-black max-md:cursor-pointer"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(false)}
              onClick={film.open}
            >
              {Object.entries(shots).map(([id, s]) => (
                <Image
                  key={id}
                  src={s.image}
                  alt={id === view ? s.alt : ""}
                  aria-hidden={id !== view}
                  fill
                  sizes="(min-width: 1200px) 1152px, 96vw"
                  className={cn(
                    "product-shot object-cover object-top grayscale transition-[opacity,transform,filter] duration-700 ease-out-soft group-hover:scale-[1.012] group-hover:brightness-75",
                    id === view ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
              {/* glass: dark until the screen switches on */}
              <div aria-hidden="true" className="product-glass pointer-events-none absolute inset-0 bg-black" />

              {/* cursor follower (mouse) */}
              <div
                ref={cursor}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute left-0 top-0 grid size-24 place-items-center rounded-full bg-fg text-canvas transition-[opacity,scale] duration-300 ease-out-soft max-md:hidden",
                  hover ? "scale-100 opacity-100" : "scale-50 opacity-0",
                )}
              >
                <span className="flex flex-col items-center gap-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                  <Play className="size-4 fill-current" />
                  Play
                </span>
              </div>

              {/* keyboard / touch entry */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  film.open();
                }}
                className="absolute bottom-4 left-4 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-black/60 py-2 pl-2 pr-4 text-xs text-fg backdrop-blur-md transition-colors hover:bg-black/80 sm:bottom-6 sm:left-6"
              >
                <span className="grid size-7 place-items-center rounded-full bg-fg text-canvas">
                  <Play className="ml-px size-3 fill-current" aria-hidden="true" />
                </span>
                {product.film.label}
                <span className="tabular text-fg-3">{product.film.duration}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Views + entry */}
        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div role="tablist" aria-label="Product views" className="flex items-center gap-7">
            {product.views.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                onMouseEnter={() => setView(v.id)}
                className={cn(
                  "relative pb-2 text-sm transition-colors duration-300",
                  view === v.id ? "text-fg" : "text-fg-3 hover:text-fg-2",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-fg after:transition-transform after:duration-500 after:ease-out-soft",
                  view === v.id ? "after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Link href="/app" className="group inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg">
            Enter the workspace
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        {/* Roots: the tools it connects to */}
        <div className="mx-auto mt-28 max-w-6xl border-t border-line pt-10 sm:mt-36">
          <p className="text-center text-[11px] uppercase tracking-[0.3em] text-fg-3">{product.integrations}</p>
          <ul className="mt-10 grid grid-cols-5 gap-y-10 lg:grid-cols-10">
            {integrations.map((i) => (
              // Grayscale (not a flat silhouette) keeps each mark's inner detail;
              // the brand colour returns on hover.
              <li key={i.id} className="group flex flex-col items-center gap-3">
                <IntegrationLogo
                  id={i.id}
                  size={28}
                  className="opacity-75 grayscale transition-[filter,opacity] duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <span className="text-[11px] tracking-wide text-fg-3 transition-colors duration-500 group-hover:text-fg-2">{i.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
