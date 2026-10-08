/**
 * Motion system — the few durations and curves every animation on the site
 * uses, so the whole experience moves with one voice. CSS counterparts live in
 * globals.css (--dur-fast / --dur-base / --dur-slow, ease-out-soft …).
 *
 *   micro     hover, press, small state changes — fast and subtle
 *   reveal    words and cards entering — smooth, moderate
 *   core      the Core waking and opening — cinematic, deliberate
 *   nav       jumping between sections — quick enough to stay useful
 */
export const motion = {
  micro: { duration: 0.18, ease: "power2.out" },
  reveal: { duration: 0.7, ease: "power3.out" },
  core: { duration: 1.6, ease: "power2.inOut" },
  nav: { duration: 1.3 },
} as const;

/** easeInOutCubic, for programmatic smooth scrolling. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The onboarding's transition language — how a primary action hands over to the next moment.
 * CSS counterparts: --flow-* and --ease-awaken in globals.css ("FLOW"); keep the two in step.
 *
 *   commit   pressed → the next moment takes over: long enough to see the emerald start running
 *            through the button, short enough that nobody waits for it (never with reduced motion)
 *   arrive   the Core landing in its new place after travelling from the landing page
 */
export const flow = {
  commit: 240,
  arrive: 900,
} as const;

/** True when the visitor asked for reduced motion (client only; false on the server) */
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
