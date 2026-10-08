"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

/** A stand-in of the same kind while a character is still being read (letters stay letters, digits digits) */
const noiseFor = (c: string) => {
  const set = /\d/.test(c) ? DIGITS : /[A-Z]/.test(c) ? UPPER : /[a-zà-ÿ]/i.test(c) ? LOWER : null;
  return set ? set[Math.floor(Math.random() * set.length)] : c;
};
const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** How long the decoding takes: about 30 ms a character, never under 220 ms nor over 700 ms */
const spanFor = (n: number) => Math.min(700, Math.max(220, n * 30));
/** How long a character flickers before it settles */
const LEAD = 150;
/** The flicker's pace (it doesn't need every frame) */
const TICK = 45;

type Props = {
  text: string;
  /** Not read yet: nothing shown, a faint line holds its place */
  pending?: boolean;
  /** Wait before reading (ms) — to stagger words read together */
  delay?: number;
  className?: string;
};

/**
 * Words that arrive the way Syxoria reads them: decoded letter by letter, left to right, each
 * flickering through a few characters of its kind (in the Core's emerald) before it settles. Quick
 * — a word takes a quarter to two thirds of a second. When the text changes (a count rising), only
 * what changed is read again; what stayed the same stays still.
 *
 * Layout never moves: an invisible copy of the final text holds the space, the decoding is drawn
 * over it. Screen readers get the final text at once; with reduced motion it simply appears.
 * The animation writes to the DOM directly — no re-render per frame — and stops when it is done.
 * Styles: "DECODE" in globals.css.
 */
export function DecodeText({ text, pending, delay = 0, className }: Props) {
  const layer = useRef<HTMLSpanElement>(null);
  /** what has been fully read and is on screen */
  const read = useRef("");

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    if (pending) {
      el.textContent = "";
      read.current = "";
      return;
    }
    const from = read.current;
    if (from === text || prefersReducedMotion()) {
      el.textContent = text;
      read.current = text;
      return;
    }
    // what both share at the start stays as it is; the rest is read again
    let keep = 0;
    while (keep < from.length && keep < text.length && from[keep] === text[keep]) keep++;
    const rest = text.length - keep;
    const span = spanFor(rest);
    let start = 0;
    let last = -Infinity;
    let raf = 0;

    const frame = (now: number) => {
      if (!start) start = now + delay;
      const t = now - start;
      if (t >= span) {
        el.textContent = text;
        read.current = text;
        return;
      }
      if (now - last >= TICK) {
        last = now;
        let settled = text.slice(0, keep);
        let noise = "";
        for (let i = keep; i < text.length; i++) {
          const at = ((i - keep + 1) / rest) * span;
          if (t >= at && !noise) settled += text[i];
          else if (t >= at - LEAD) noise += noiseFor(text[i]);
          else break;
        }
        el.innerHTML = escape(settled) + (noise ? `<span class="decode__noise">${escape(noise)}</span>` : "");
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // interrupted (a newer text, or unmounted): the next run reads on from what was fully read
    return () => cancelAnimationFrame(raf);
  }, [text, pending, delay]);

  return (
    <span className={cn("decode", className)} data-pending={pending || undefined}>
      <span aria-hidden="true" className="decode__sizer">
        {text}
      </span>
      <span ref={layer} aria-hidden="true" className="decode__layer" />
      {!pending && <span className="sr-only">{text}</span>}
    </span>
  );
}
