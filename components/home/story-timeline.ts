import type gsap from "gsap";
import { motion } from "@/lib/motion";
import type { CoreState } from "@/lib/core/state";

type Options = {
  tl: gsap.core.Timeline;
  q: (selector: string) => Element[];
  state: CoreState;
  /** side-by-side layout (the Core beside the words) */
  desktop: boolean;
  /** how much wider the words' column is relative to the screen (narrow desktops, landscape phones) */
  wide: number;
  /** a short screen (e.g. a phone turned sideways): the open Core steps back to leave its branches room */
  short: boolean;
};

/**
 * The story's choreography, one timeline from 0 to 100 scrubbed by the scroll
 * (positions match STORY_CHAPTERS in chapters.ts):
 *
 *    0  core          a dark graphite Core, dormant; the promise beside it
 *    6  one core      scrolling wakes it: fissures glow, the three steps light up
 *   24  modules       it splits along its seams and six branches grow out — explore them
 *   60  workspace     the product screen rises; real UI assembles around it
 *   77  integrations  tools wire themselves to the Core
 *   92  (rest)        the Core closes into its vitrine, and the page moves on to pricing
 */
export function buildStory({ tl, q, state, desktop, wide, short }: Options) {
  // screen offsets: the first value when the Core sits beside the words, the second on small screens (Core above)
  const X = (d: number, m = 0) => (desktop ? d * wide : m);

  // 0 — The dormant Core
  Object.assign(state, {
    az: -0.22,
    el: 0.1,
    dist: 11.5,
    tx: 0,
    ty: -0.3,
    tz: 0,
    shiftX: X(0.2),
    shiftY: X(0, 0.17),
    awaken: 0.06,
    open: 0,
    embers: 0,
    dust: 0.45,
    floor: 0.85,
    plinth: 1,
    vitrine: 0,
    branches: 0,
    network: 0,
    wordmark: 1,
    spin: 0,
    scale: 1,
  } satisfies Partial<CoreState>);

  const cam = (at: number, duration: number, vars: gsap.TweenVars) => tl.to(state, { ease: "sine.inOut", ...vars, duration }, at);
  const show = (name: string, at: number, duration = 1.4) => {
    tl.set(q(`[data-layer="${name}"]`), { autoAlpha: 1 }, at);
    tl.fromTo(q(`[data-layer="${name}"] [data-r]`), { autoAlpha: 0, y: 32, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration, stagger: 0.22, ease: motion.reveal.ease }, at);
  };
  const hide = (name: string, at: number, duration = 1.1) => {
    tl.to(q(`[data-layer="${name}"] [data-r]`), { autoAlpha: 0, y: -24, filter: "blur(4px)", duration, stagger: 0.08, ease: "power1.in" }, at);
    tl.set(q(`[data-layer="${name}"]`), { autoAlpha: 0 }, at + duration + 0.35);
  };

  // 6 — One core: scrolling wakes it, progressively
  tl.to(q('[data-layer="hint"]'), { autoAlpha: 0, duration: 1.5 }, 1);
  hide("hero", 4.5);
  cam(3, 10, { az: 0.35, el: 0.14, dist: 9.4, ty: -0.05, shiftX: X(0.18), shiftY: X(0, 0.16), wordmark: 0, spin: 0.6 });
  tl.to(state, { awaken: 0.55, dust: 0.55, duration: 16 }, 5);
  show("one-core", 7);
  q("[data-step]").forEach((step, i) => {
    const at = 10.5 + i * 3.2;
    tl.to(step, { opacity: 1, duration: 0.8 }, at);
    tl.fromTo(step.querySelector("[data-step-line]"), { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: "power1.inOut" }, at);
  });
  hide("one-core", 22.5);

  // 24 — Modules: the Core opens, the branches grow — then it holds, to be explored
  cam(23.5, 8, { az: 1.0, el: 0.2, dist: short && desktop ? 12.6 : 10.6, ty: 0.1, shiftX: X(0.19), shiftY: X(0, 0.2), spin: 1.4, ease: "power2.inOut" });
  tl.to(state, { open: 1, awaken: 0.75, duration: 7, ease: motion.core.ease }, 25);
  tl.to(state, { branches: 1, duration: 11 }, 29);
  show("modules", 30);
  hide("modules", 57);
  tl.to(state, { branches: 0, duration: 3, ease: "power1.in" }, 57.5);
  tl.to(state, { open: 0.15, awaken: 0.75, duration: 4 }, 58);

  // 60 — The workspace rises out of the Core
  // small screens: the Core rises behind the screen so its plinth does not peek out below it
  cam(60, 5, { dist: 9.8, az: 1.8, el: 0.1, ty: 0.1, shiftX: X(0.22), shiftY: X(0, 0.31), spin: 2 });
  tl.fromTo(
    q("[data-panel]"),
    { autoAlpha: 0, scale: 0.55, rotateX: 22, y: 60, filter: "blur(12px)" },
    { autoAlpha: 1, scale: 1, rotateX: 0, y: 0, filter: "blur(0px)", duration: 3.6, ease: "power3.out" },
    61,
  );
  show("workspace", 62);
  q("[data-wstep]").forEach((step, i) => tl.fromTo(step, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 1, ease: motion.reveal.ease }, 64.5 + i * 1.5));
  q("[data-float]").forEach((card, i) => tl.fromTo(card, { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: motion.reveal.ease }, 65.5 + i * 1.6));
  cam(66, 10, { az: 2.0, spin: 2.4 });
  hide("workspace", 75.5);
  tl.to(q("[data-float]"), { autoAlpha: 0, y: -16, duration: 1, ease: "power1.in" }, 75);
  tl.to(q("[data-panel]"), { autoAlpha: 0, scale: 1.05, y: -40, filter: "blur(8px)", duration: 1.6, ease: "power2.in" }, 75.5);

  // 77 — Integrations
  cam(77, 5, { az: 2.8, el: 0.08, dist: 12.5, ty: 0.1, shiftX: X(0.14), shiftY: X(0, 0.2), network: 1, awaken: 0.6, open: 0, floor: 0.5 });
  show("integrations", 79);
  cam(82, 10, { az: 2.95, spin: 3 });
  hide("integrations", 91.5);

  // 92 — Rest: the Core closes into its vitrine; pricing follows below
  cam(92.5, 7.5, { network: 0, az: 2.6, el: 0.13, dist: 14.2, ty: 0.15, shiftX: 0, shiftY: X(0, 0.04), plinth: 1, floor: 1, vitrine: 1, awaken: 0.45, spin: 3.3 });
  tl.to({}, { duration: 0 }, 100);
}
