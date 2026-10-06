"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { Title } from "@/components/home/story/primitives";
import type { FieldState } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * Pieces every onboarding moment shares: its heading (the brand's title — a light lead and
 * an italic accent), the soft rise things arrive with, the larger inputs.
 */

export function StageHeading({ lead, accent, highlight, children, className }: { lead: string; accent: string; highlight?: string; children?: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  // each new moment moves focus to its heading, so keyboard and screen-reader users land in it
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className={className}>
      <div ref={ref} tabIndex={-1} className="outline-none">
        <Title as="h1" lead={lead} accent={accent} highlight={highlight} className="onb-rise text-[clamp(1.875rem,1.35rem+1.6vw,2.75rem)] leading-[1.1]" />
      </div>
      {children && (
        <p className="onb-rise mt-4 max-w-[34rem] text-[15px] leading-relaxed text-fg-2" style={rise(1)}>
          {children}
        </p>
      )}
    </div>
  );
}

/** Inline style for the n-th piece of a staggered arrival */
export const rise = (i: number): CSSProperties => ({ ["--i" as string]: i });

/** The onboarding's inputs: the product's, a little larger */
export function BigInput({ state = "default", className, ...props }: ComponentProps<"input"> & { state?: FieldState }) {
  return <input className={inputStyles(state, cn("h-12 rounded-lg text-[15px]", className))} aria-invalid={state === "error" || undefined} {...props} />;
}

/** A password field that can be shown, and warns when Caps Lock is on */
export function PasswordInput({ state = "default", className, ...props }: ComponentProps<"input"> & { state?: FieldState }) {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const check = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (
    <div>
      <div className="relative">
        <BigInput {...props} state={state} type={shown ? "text" : "password"} onKeyUp={check} onKeyDown={check} className={cn("pr-12", className)} />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-fg-3 transition-colors hover:bg-white/5 hover:text-fg"
        >
          {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {caps && (
        <p role="status" className="mt-2 text-[12.5px] text-caution">
          Caps Lock is on.
        </p>
      )}
    </div>
  );
}

/** A calm notice: errors that reassure rather than alarm, or a quiet confirmation */
export function Notice({ tone, children, action, className }: { tone: "error" | "success" | "info"; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "onb-rise flex flex-col gap-3 rounded-lg border px-4 py-3.5 text-[13.5px] leading-snug sm:flex-row sm:items-center sm:justify-between",
        tone === "error" && "border-negative/25 bg-negative/[0.06] text-fg-2",
        tone === "success" && "border-accent-line bg-accent-soft text-fg",
        tone === "info" && "border-white/[0.08] bg-white/[0.025] text-fg-2",
        className,
      )}
    >
      <p className="flex gap-2.5">
        <span aria-hidden="true" className={cn("mt-[0.45em] size-1.5 shrink-0 rounded-full", tone === "error" ? "bg-negative/80" : tone === "success" ? "bg-accent-strong" : "bg-fg-3")} />
        <span>{children}</span>
      </p>
      {action && <div className="flex shrink-0 gap-2 pl-4 sm:pl-0">{action}</div>}
    </div>
  );
}

/** A quiet text action (back, switch mode, correct …) */
export function QuietButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn("inline-flex items-center gap-1.5 rounded-sm text-[13.5px] text-fg-3 underline decoration-white/15 underline-offset-4 transition-colors hover:text-fg hover:decoration-accent disabled:pointer-events-none disabled:opacity-40", className)}
    />
  );
}
