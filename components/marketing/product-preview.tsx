"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { ArrowNudge, ButtonLink } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/hooks/use-in-view";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { PreviewData } from "./product-screens";
import overviewShot from "@/public/product/dashboard-overview.png";
import insightsShot from "@/public/product/dashboard-insights.png";
import projectsShot from "@/public/product/dashboard-projects.png";
import { DemoTrigger } from "./demo-trigger";

type View = "overview" | "insights" | "projects";

/**
 * Screenshots of the real product (/app), captured at 1440×900 @2x.
 * Re-capture after UI changes — see README "Product screenshots".
 */
const views: { value: View; label: string; image: StaticImageData; alt: string }[] = [
  {
    value: "overview",
    label: "Overview",
    image: overviewShot,
    alt: "Syxoria overview dashboard: revenue recovered, time saved, active automations and client response time, a value-created chart and the momentum score.",
  },
  {
    value: "insights",
    label: "Insights",
    image: insightsShot,
    alt: "Syxoria insights: recommendations ranked by impact, each with an apply or dismiss action.",
  },
  {
    value: "projects",
    label: "Projects",
    image: projectsShot,
    alt: "Syxoria projects list with status, progress, owners and impact for each project.",
  },
];

/**
 * Live product preview (not a screenshot): real components on mock data.
 * - rises and flattens from a perspective tilt when scrolled into view
 * - subtle pointer tilt on desktop
 * - tabs switch between real screens
 * - entry points: interactive tour + the actual workspace
 */
export function ProductPreview({ data }: { data: PreviewData }) {
  const [view, setView] = useState<View>("overview");
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "0px 0px -20% 0px" });
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse" || !frame.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    frame.current.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
    frame.current.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
  }
  function onPointerLeave() {
    frame.current?.style.setProperty("--rx", "0deg");
    frame.current?.style.setProperty("--ry", "0deg");
  }

  const active = views.find((v) => v.value === view)!;

  return (
    <div ref={ref} className="relative">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Tabs items={views} value={view} onValueChange={setView} label="Preview screen" idPrefix="preview" />
        <p className="text-xs text-fg-3">The real workspace, with sample data.</p>
      </div>

      <div className="[perspective:2000px]" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <div
          ref={frame}
          className={cn(
            "relative rounded-xl border border-line-strong bg-canvas-2 p-1.5 shadow-float transition-[transform,opacity] duration-[1100ms] ease-out-soft will-change-transform",
            "before:pointer-events-none before:absolute before:inset-x-12 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/60 before:to-transparent",
          )}
          style={{
            transform: inView
              ? "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))"
              : "rotateX(14deg) translate3d(0, 40px, 0) scale(0.97)",
            opacity: inView ? 1 : 0.4,
          }}
        >
          <div
            id={`preview-panel-${view}`}
            role="tabpanel"
            aria-labelledby={`preview-tab-${view}`}
            className="overflow-hidden rounded-lg border border-line"
          >
            <Image
              key={active.value}
              src={active.image}
              alt={active.alt}
              placeholder="blur"
              sizes="(min-width: 1320px) 1200px, 94vw"
              className="block h-auto w-full animate-fade-in"
            />
          </div>
        </div>
        {/* floor reflection */}
        <div aria-hidden="true" className="mx-auto h-16 w-[86%] bg-[radial-gradient(closest-side,rgb(214_168_113/0.12),transparent)] blur-md" />
      </div>

      <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <DemoTrigger label="Take the interactive tour" data={data} variant="primary" />
        <ButtonLink href="/app" variant="ghost" size="lg">
          Open the sample workspace
          <ArrowNudge />
        </ButtonLink>
      </div>
    </div>
  );
}
