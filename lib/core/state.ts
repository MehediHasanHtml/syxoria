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
  /** 0 closed → 1 the Core parts into six fragments around its lit nucleus — each its own way */
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
  /** the six modules, one per fragment of the opened Core: 0 hidden → 1 named and explorable */
  modules: number;
  /** module the visitor is exploring (hover / focus / tap / scroll), -1 none — its fragment lifts and lights */
  focus: number;
  /** the product screen: 0 inside the Core → 1 standing beside it */
  screen: number;
  /** the product screen moving to centre stage: 0 beside the Core → 1 large, centred, facing the viewer */
  center: number;
  /** what the product screen shows (0..1: cards, numbers and chart build up) */
  live: number;
  /** the tools wired to the Core */
  network: number;
  /** tool the visitor points at, -1 none — a pulse runs down its wire */
  tool: number;
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
  modules: 0,
  focus: -1,
  screen: 0,
  center: 0,
  live: 0,
  network: 0,
  tool: -1,
  wordmark: 0,
  spin: 0,
  scale: 1,
};

export const createCoreState = (overrides: Partial<CoreState> = {}): CoreState => ({ ...DEFAULT_STATE, ...overrides });

export type Anchor = { x: number; y: number; alpha: number };
export type CoreAnchors = {
  /** each module, on its fragment of the Core */
  modules: Anchor[];
  /** the module whose fragment is under the cursor, -1 none */
  hoverModule: number;
  /** tool nodes of the integration network */
  nodes: Anchor[];
  /** the three zones (connect · understand · act), on the Core's surface */
  zones: Anchor[];
  /** centre of the Core; `r` is its apparent radius in px */
  core: Anchor & { r: number };
};
