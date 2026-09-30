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

/** Orbit angle the product screen is set up to be seen from (matches SCREEN_AZ in core-scene.ts). */
const SCREEN_AZ = 1.75;

/**
 * The story's choreography: one journey around the same Core, never leaving
 * it — a timeline from 0 to 100 scrubbed by the scroll (positions match
 * STORY_CHAPTERS in chapters.ts):
 *
 *    0  core          the Core floats in the dark, awake; the promise beside it
 *    7  one core      it turns to show its three zones: signals flow in · the heart understands · action flows out
 *   34  modules       it opens like a flower; six branches grow from its nucleus — explore them
 *   63  workspace     the branches draw back in as the product screen rises out of it
 *   77  integrations  the camera pulls back into space; the tools are wired to it; its vitrine rises around it
 *   90  pricing       the Core at rest in its vitrine, one calm offer in front of it
 */
export function buildStory({ tl, q, state, desktop, wide, short }: Options) {
  // screen offsets: the first value when the Core sits beside the words, the second on small screens (Core above)
  const X = (d: number, m = 0) => (desktop ? d * wide : m);

  // 0 — The Core
  Object.assign(state, {
    az: -0.22,
    el: 0.1,
    dist: 10,
    tx: 0,
    ty: -0.2,
    tz: 0,
    shiftX: X(0.2),
    shiftY: X(0, 0.17),
    awaken: 0.42,
    open: 0,
    embers: 0.35,
    dust: 0.45,
    stars: 0.35,
    floor: 0.55,
    plinth: 0,
    vitrine: 0,
    face: 0,
    turn: 0,
    connect: 0,
    understand: 0,
    act: 0,
    branches: 0,
    screen: 0,
    live: 0,
    network: 0,
    wordmark: 1,
    spin: 0,
    scale: 1,
  } satisfies Partial<CoreState>);

  const cam = (at: number, duration: number, vars: gsap.TweenVars) => tl.to(state, { ease: "sine.inOut", ...vars, duration }, at);

  /** A chapter's words come in: lines rise out of their masks, the rest fades up. */
  const show = (name: string, at: number) => {
    const layer = `[data-layer="${name}"]`;
    tl.set(q(layer), { autoAlpha: 1 }, at);
    const lines = q(`${layer} [data-r] .split-line`);
    if (lines.length) tl.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.6, stagger: 0.14, ease: motion.reveal.ease }, at);
    const blocks = q(`${layer} [data-r]:not([data-split])`);
    if (blocks.length) tl.fromTo(blocks, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.16, ease: motion.reveal.ease }, at + 0.5);
  };
  /** …and leave: lines slip up out of their masks. */
  const hide = (name: string, at: number, duration = 1.1) => {
    const layer = `[data-layer="${name}"]`;
    const lines = q(`${layer} [data-r] .split-line`);
    if (lines.length) tl.to(lines, { yPercent: -115, duration, stagger: 0.05, ease: "power2.in" }, at);
    const blocks = q(`${layer} [data-r]:not([data-split])`);
    if (blocks.length) tl.to(blocks, { autoAlpha: 0, y: -16, duration, stagger: 0.04, ease: "power1.in" }, at);
    tl.set(q(layer), { autoAlpha: 0 }, at + duration + 0.3);
  };

  // 7 — One core: the Core turns to show its three zones, one after another
  tl.to(q('[data-layer="hint"]'), { autoAlpha: 0, duration: 1.5 }, 1);
  hide("hero", 5);
  cam(4, 7, { az: 0.35, el: 0.12, dist: 8.6, ty: -0.05, shiftX: X(0.16), shiftY: X(0, 0.2), wordmark: 0, face: 1, turn: 0.6, awaken: 0.24, stars: 0.3 });
  show("one-core", 8.5);
  const zones = ["connect", "understand", "act"] as const;
  const turns = [0.6, 0, -0.6];
  q("[data-step]").forEach((step, i) => {
    const at = 11 + i * 7.3;
    tl.to(state, { [zones[i]]: 1, duration: 3.2, ease: "power1.inOut" }, at);
    if (i > 0) tl.to(state, { [zones[i - 1]]: 0.12, duration: 2.6, ease: "power1.inOut" }, at);
    if (i > 0) cam(at - 0.6, 4, { turn: turns[i], az: 0.35 + i * 0.25 });
    tl.to(step, { opacity: 1, duration: 0.8 }, at);
    if (i > 0) tl.to(q("[data-step]")[i - 1], { opacity: 0.4, duration: 0.8 }, at);
    tl.fromTo(step.querySelector("[data-step-line]"), { scaleX: 0 }, { scaleX: 1, duration: 6, ease: "none" }, at);
  });
  hide("one-core", 32);

  // 34 — Modules: every zone feeds the heart; the Core opens towards the viewer and grows its six branches
  tl.to(state, { connect: 0, understand: 0, act: 0, duration: 2.5 }, 32);
  cam(32.5, 6, { az: 1.1, el: 0.16, dist: short && desktop ? 12.4 : 10.4, ty: 0.1, shiftX: X(0.19), shiftY: X(0, 0.2), turn: 0, awaken: 0.5, ease: "power2.inOut" });
  tl.to(state, { open: 1, duration: 6, ease: motion.core.ease }, 35);
  tl.to(state, { branches: 1, duration: 9 }, 38);
  show("modules", 38.5);
  hide("modules", 60);
  tl.to(state, { branches: 0, duration: 3.5, ease: "power1.in" }, 60.5);
  tl.to(state, { open: 0.12, duration: 4 }, 61.5);

  // 63 — Workspace: the product screen rises out of the Core and stands beside it
  cam(61.5, 5, { az: SCREEN_AZ, el: 0.1, dist: 10.2, ty: 0.12, shiftX: X(0.1), shiftY: X(0, 0.3), face: 0, spin: 1.6, awaken: 0.6 });
  tl.to(state, { screen: 1, duration: 4.5, ease: "power2.out" }, 63);
  show("workspace", 64.5);
  tl.to(state, { live: 1, duration: 8, ease: "none" }, 65.5);
  q("[data-wstep]").forEach((step, i) => tl.fromTo(step, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 1, ease: motion.reveal.ease }, 67 + i * 1.6));
  cam(66, 8, { az: SCREEN_AZ + 0.12, spin: 2 });
  hide("workspace", 74);
  tl.to(state, { screen: 0, duration: 3.2, ease: "power2.in" }, 74.5);

  // 77 — Integrations: the camera draws back into space; roots leave the Core towards each tool
  cam(75.5, 6, { az: 2.55, el: 0.08, dist: 13.5, ty: 0.1, shiftX: X(0.18), shiftY: X(0, 0.22), stars: 1, dust: 0.3, floor: 0.3, open: 0, awaken: 0.58, spin: 2.4 });
  tl.to(state, { network: 1, duration: 6 }, 77);
  show("integrations", 78.5);
  // …and at the end of it, its vitrine rises around it
  tl.to(state, { plinth: 1, duration: 3.5, ease: "power2.out" }, 84);
  tl.to(state, { vitrine: 1, duration: 5, ease: "power1.inOut" }, 85);
  hide("integrations", 88.5);
  tl.to(state, { network: 0, duration: 3 }, 88.5);

  // 90 — Pricing: the Core at rest in its vitrine
  cam(89, 7, { az: 2.3, el: 0.13, dist: desktop ? 13.4 : 17, ty: 0.15, shiftX: X(0.22), shiftY: X(0, 0.34), stars: 0.55, floor: 0.9, embers: 0.6, awaken: 0.6, spin: 2.8 });
  show("pricing", 91);
  tl.to({}, { duration: 0 }, 100);
}
