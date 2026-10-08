"use client";

import { ArrowRight, Check } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { useAwaken } from "@/lib/hooks/use-awaken";

type Props = Omit<ComponentProps<"button">, "onClick"> & {
  /** Real work under way: the emerald runs part-way in and holds there until it is done */
  busy?: boolean;
  /** The work succeeded: the emerald fills it, the arrow becomes a check */
  done?: boolean;
  /**
   * Whether what it submits is valid yet. Not yet: a quiet slab (still pressable, so the form can
   * say what is missing). Valid: the bone slab, with a fine line of emerald drawing itself around
   * it. Leave unset for buttons that are always ready.
   */
  ready?: boolean;
  /** "primary": bone on dark — the one obvious next step. "emerald": the final step into the product. */
  tone?: "primary" | "emerald";
  /** Called at once on press (with onAdvance: once, as the press is accepted) */
  onClick?: () => void;
  /**
   * Moving on to the next moment: the button answers at once — the emerald
   * starts running through it — and the next moment takes over a beat later. Pressed twice, it
   * still moves on once.
   */
  onAdvance?: () => void;
};

/**
 * The onboarding's call to action — deliberately not the landing page's stone button: a clean,
 * quiet slab with one arrow, so the next step is obvious without spectacle. Every one of them
 * answers in the same language — the Core's emerald filling it ("AWAKEN" and "ONBOARDING
 * BUTTON" in globals.css).
 */
export function OnbButton({ busy, done, ready, tone = "primary", className, children, disabled, type = "button", onClick, onAdvance, ...rest }: Props) {
  const { awake, run } = useAwaken();
  const fill = done ? "done" : busy ? "busy" : awake ? "run" : undefined;
  return (
    <button
      type={type}
      disabled={disabled || busy || done}
      aria-busy={busy || undefined}
      data-tone={tone}
      data-ready={ready === undefined ? undefined : String(ready)}
      data-fill={fill}
      onClick={
        onAdvance
          ? () => {
              if (run(onAdvance)) onClick?.();
            }
          : onClick
      }
      className={cn("onb-btn", className)}
      {...rest}
    >
      <span aria-hidden="true" className="awaken-fill" />
      {ready !== undefined && <span aria-hidden="true" className="onb-btn__ring" />}
      <span className="onb-btn__label">{children}</span>
      {done ? <Check aria-hidden="true" className="onb-btn__arrow size-4" strokeWidth={2.4} /> : <ArrowRight aria-hidden="true" className="onb-btn__arrow size-4" />}
    </button>
  );
}
