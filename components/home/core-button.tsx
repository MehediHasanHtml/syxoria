"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/cn";

/**
 * The page's calls to action, made of the Core's own materials (styles in
 * globals.css, "CORE BUTTONS"):
 *
 *   CoreButton  dark stone with a line of the Core's light running around its edge; a small core
 *               on the left whose two halves part on hover to show its light. The line follows the
 *               cursor, a soft light travels inside, and the button leans towards the pointer.
 *   LensButton  the quiet one — a lens whose ring of light draws itself on hover (compact: a smaller one).
 */

type Action = {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  "aria-haspopup"?: "dialog";
  /** As a <button> only: submit a form, be unavailable, or be working (its core glows and breathes) */
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
};

/** Magnetic hover, eased every frame: the button leans towards the pointer and reports where it is. */
function useMagnet<T extends HTMLElement>(strength = 0.22, max = 6) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ring = el.querySelector<HTMLElement>(".core-btn__ring");
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let a = 0;
    let ta = 0;
    let raf = 0;
    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      a += ((((ta - a + 540) % 360) - 180) * 0.14);
      el.style.setProperty("--tx", `${x.toFixed(2)}px`);
      el.style.setProperty("--ty", `${y.toFixed(2)}px`);
      ring?.style.setProperty("--ring-a", `${a.toFixed(1)}deg`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 || el.dataset.hover !== undefined ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (!reduced) {
        tx = Math.max(-max, Math.min(max, dx * strength));
        ty = Math.max(-max, Math.min(max, dy * strength * 1.3));
      }
      // the line of light gathers on the side nearest the cursor (the conic gradient starts at the top)
      ta = (Math.atan2(dy, dx) * 180) / Math.PI + 90 - 26;
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      if (el.dataset.hover === undefined) {
        // start from where the turning line is now, so it does not jump
        const now = ring ? parseFloat(getComputedStyle(ring).getPropertyValue("--ring-a")) : 0;
        a = Number.isFinite(now) ? now : ta;
        el.dataset.hover = "";
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      tx = ty = 0;
      delete el.dataset.hover;
      ring?.style.removeProperty("--ring-a");
      if (!raf) raf = requestAnimationFrame(loop);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength, max]);
  return ref;
}

/** A link (internal or not) or a button, with the same look. */
function Action({ href, onClick, className, children, innerRef, type = "button", disabled, busy, ...rest }: Action & { innerRef: Ref<HTMLAnchorElement & HTMLButtonElement> }) {
  if (href && /^(mailto:|https?:)/.test(href))
    return (
      <a ref={innerRef} href={href} className={className} {...rest}>
        {children}
      </a>
    );
  if (href)
    return (
      <Link ref={innerRef} href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  return (
    <button ref={innerRef} type={type} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} className={className} {...rest}>
      {children}
    </button>
  );
}

export function CoreButton({ className, children, ...rest }: Action) {
  const ref = useMagnet<HTMLAnchorElement & HTMLButtonElement>();
  return (
    <Action {...rest} innerRef={ref} className={cn("core-btn", className)}>
      <span aria-hidden="true" className="core-btn__ring" />
      <span aria-hidden="true" className="core-btn__glow" />
      <span aria-hidden="true" className="core-btn__seed">
        <span className="core-btn__half" />
        <span className="core-btn__seam" />
        <span className="core-btn__half" />
      </span>
      <span>{children}</span>
      <span aria-hidden="true" className="core-btn__arrow">
        <ArrowRight className="size-4" />
      </span>
    </Action>
  );
}

/** `compact`: a smaller lens tinted with the Core's light, for a secondary control beside other content. */
export function LensButton({ className, children, note, icon, compact, ...rest }: Action & { note?: string; icon?: ReactNode; compact?: boolean }) {
  const ref = useMagnet<HTMLAnchorElement & HTMLButtonElement>(0.16, 4);
  return (
    <Action {...rest} innerRef={ref} className={cn("lens-btn", compact && "lens-btn--compact", className)}>
      <span aria-hidden="true" className="lens-btn__lens">
        <svg viewBox="0 0 40 40" className="lens-btn__ring size-[calc(100%+2px)]">
          <circle cx="20" cy="20" r="19.4" pathLength={1} />
        </svg>
        {icon ?? <Play className="ml-0.5 size-3.5 fill-current" />}
      </span>
      <span className="lens-btn__label">{children}</span>
      {note && <span className="tabular text-fg-3">{note}</span>}
    </Action>
  );
}
