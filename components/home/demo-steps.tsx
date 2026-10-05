"use client";

import { useEffect, useRef, useState } from "react";
import { workspace } from "@/content/home";
import { cn } from "@/lib/cn";

/**
 * The demo's story, told underneath it: one line per moment of the session
 * (a payment arrives · Nexo proposes · you approve · Volt carries it out ·
 * the numbers move), following the same progress as the dashboard.
 */
export function DemoSteps({ progress, className }: { progress: () => number; className?: string }) {
  const steps = workspace.demo.steps;
  const [active, setActive] = useState(-1);
  const read = useRef(progress);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    read.current = progress;
  });

  useEffect(() => {
    let raf = 0;
    let shown = -2;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = read.current();
      const i = steps.findLastIndex((s) => p >= s.at);
      if (i !== shown) {
        shown = i;
        setActive(i);
      }
      steps.forEach((s, k) => {
        const end = steps[k + 1]?.at ?? 1;
        const f = fills.current[k];
        if (f) f.style.scale = `${Math.min(1, Math.max(0, (p - s.at) / (end - s.at))).toFixed(3)} 1`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [steps]);

  return (
    <ol className={cn("grid grid-cols-5 gap-4", className)}>
      {steps.map((s, i) => (
        <li key={s.title} className={cn("transition-opacity duration-500", i === active ? "opacity-100" : i < active ? "opacity-55" : "opacity-30")}>
          <span className="relative block h-px overflow-hidden bg-line">
            <span ref={(n) => void (fills.current[i] = n)} className="absolute inset-0 origin-left bg-fg" style={{ scale: "0 1" }} />
          </span>
          <p className={cn("mt-3 font-label text-label uppercase transition-colors duration-500", i === active ? "text-fg" : "text-fg-2")}>{s.title}</p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-fg-3">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
