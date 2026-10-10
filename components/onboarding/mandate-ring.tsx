"use client";

import type { CSSProperties } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import type { CoreState } from "@/lib/core/core-states";
import { cn } from "@/lib/cn";
import type { AutonomyLevel } from "@/types";

/** The Core, at the activity each mode gives it: half lit and at rest · fully lit, steady · lit, its light moving */
const coreOf: Record<AutonomyLevel, CoreState> = { guided: "initializing", assisted: "active", autonomous: "executing" };

export type Reach = { auto: number; ask: number; off: number; total: number };

const R = 94;
/** degrees left open between two actions */
const GAP = 5;
const r2 = (v: number) => Math.round(v * 100) / 100;
const at = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${r2(100 + R * Math.cos(a))} ${r2(100 + R * Math.sin(a))}`;
};

/**
 * The mandate, drawn: the one Core on the screen (it comes down from the bar for this moment),
 * inside the boundary the user is setting. The ring is that boundary — one arc per action Syxoria
 * may take, lit where it acts on its own, a fine line where it asks first. Moving between modes
 * lights the arcs one by one and turns the mark that says where its own reach ends; even at its
 * widest the ring is never closed.
 * Styles: "Mandate" in globals.css.
 */
export function MandateRing({ level, reach, pulse, focus, vtName, className }: { level: AutonomyLevel; reach: Reach; pulse?: number; focus?: number | null; vtName?: string; className?: string }) {
  const step = 360 / reach.total;
  return (
    <span className={cn("onb-ring", className)} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="onb-ring__arcs">
        {Array.from({ length: reach.total }, (_, i) => {
          const from = -90 + i * step + GAP / 2;
          const mode = i < reach.auto ? "auto" : i < reach.auto + reach.ask ? "ask" : "off";
          return <path key={i} d={`M${at(from)}A${R} ${R} 0 0 1 ${at(from + step - GAP)}`} className="onb-ring__arc" data-mode={mode} data-focus={focus === i || undefined} style={{ "--i": i } as CSSProperties} />;
        })}
        {/* where its own reach ends: the mark turns with the mode */}
        <g className="onb-ring__edge" style={{ rotate: `${reach.auto * step}deg` }}>
          <line x1="100" y1={100 - R - 7} x2="100" y2={100 - R + 7} />
        </g>
      </svg>
      <SyxoriaCore state={coreOf[level]} pulse={pulse} vtName={vtName} className="onb-ring__core" />
    </span>
  );
}

/**
 * A mode's mark, small: the same ring reduced to one arc — the share of the actions it takes on
 * its own. Used wherever a mode is named (the mode switch, the comparison, the briefing's action).
 */
export function ModeGlyph({ share, className }: { share: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("onb-glyph", className)} aria-hidden="true">
      <circle cx="8" cy="8" r="6" className="onb-glyph__track" />
      <circle cx="8" cy="8" r="6" pathLength={1} className="onb-glyph__arc" strokeDasharray={`${r2(Math.max(0, Math.min(1, share)))} 1`} />
    </svg>
  );
}
