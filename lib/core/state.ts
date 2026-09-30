/**
 * The Core's scene state — one flat object of numbers that the story scrubs
 * with GSAP (and the page's pointer/hover handlers nudge) and the WebGL scene
 * reads every frame. Kept free of three.js so pages can import it without
 * pulling the renderer into their first bundle.
 */
export type CoreState = {
  /** camera orbit around the target (radians / world units) */
  az: number;
  el: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  /** screen-space offset of the whole scene, fraction of the viewport (y: + is up) */
  shiftX: number;
  shiftY: number;
  /** 0 dormant → 1 fully awake (fissure width + heat) */
  awaken: number;
  /** 0 closed → 1 the Core parts along its six seams, like a flower, around its lit nucleus */
  open: number;
  /** preloader intro, multiplies everything but the rock (0 → 1) */
  intro: number;
  /** the opening sequence: 1 = the Core’s shards float apart, 0 = assembled into the Core */
  scatter: number;
  /** how many of the scattered shards have appeared (0..1, one after another) */
  tease: number;
  embers: number;
  /** motes of dust close to the Core */
  dust: number;
  /** the distant starfield the Core floats in */
  stars: number;
  floor: number;
  plinth: number;
  vitrine: number;
  /**
   * How the Core turns: 0 it drifts on its own (`spin`), 1 it faces the camera
   * (then `turn` rotates it on purpose, e.g. to present one of its zones).
   */
  face: number;
  turn: number;
  /** the three zones of the brain, lit one after another: signals in · the heart · action out (0..1 each) */
  connect: number;
  understand: number;
  act: number;
  /** how far the six module branches have grown out of the Core (0..1, staggered per branch) */
  branches: number;
  /** branch the visitor is exploring (hover / focus / tap / scroll), -1 none — the scene eases towards it */
  focus: number;
  /** the product screen: 0 inside the Core → 1 standing beside it */
  screen: number;
  /** what the product screen shows (0..1: cards, numbers and chart build up) */
  live: number;
  /** the tools wired to the Core */
  network: number;
  wordmark: number;
  /** extra rotation of the Core (radians) */
  spin: number;
  scale: number;
};

export const DEFAULT_STATE: CoreState = {
  az: 0,
  el: 0.12,
  dist: 11,
  tx: 0,
  ty: -0.25,
  tz: 0,
  shiftX: 0,
  shiftY: 0,
  awaken: 0.4,
  open: 0,
  intro: 1,
  scatter: 0,
  tease: 1,
  embers: 0.3,
  dust: 0.5,
  stars: 0.3,
  floor: 0.6,
  plinth: 0,
  vitrine: 0,
  face: 0,
  turn: 0,
  connect: 0,
  understand: 0,
  act: 0,
  branches: 0,
  focus: -1,
  screen: 0,
  live: 0,
  network: 0,
  wordmark: 0,
  spin: 0,
  scale: 1,
};

export const createCoreState = (overrides: Partial<CoreState> = {}): CoreState => ({ ...DEFAULT_STATE, ...overrides });

export type Anchor = { x: number; y: number; alpha: number };
export type CoreAnchors = {
  /** tip of each module branch */
  branches: Anchor[];
  /** tool nodes of the integration network */
  nodes: Anchor[];
  /** the three zones (connect · understand · act), on the Core's surface */
  zones: Anchor[];
  /** centre of the Core; `r` is its apparent radius in px */
  core: Anchor & { r: number };
};
