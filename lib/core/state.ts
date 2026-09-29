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
  /** 0 dormant graphite → 1 fully awake (fissure width + heat) */
  awaken: number;
  /** 0 closed → 1 the Core splits along its seams and its light spills out */
  open: number;
  /** preloader intro, multiplies everything but the rock (0 → 1) */
  intro: number;
  /** the opening sequence: 1 = the Core’s shards float apart, 0 = assembled into the Core */
  scatter: number;
  /** how many of the scattered shards have appeared (0..1, one after another) */
  tease: number;
  embers: number;
  dust: number;
  floor: number;
  plinth: number;
  vitrine: number;
  /** how far the six module branches have grown out of the Core (0..1, staggered per branch) */
  branches: number;
  /** branch the visitor is exploring (hover / focus / tap), -1 none — the scene eases towards it */
  focus: number;
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
  awaken: 0.3,
  open: 0,
  intro: 1,
  scatter: 0,
  tease: 1,
  embers: 0,
  dust: 0.5,
  floor: 1,
  plinth: 1,
  vitrine: 0,
  branches: 0,
  focus: -1,
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
  /** centre of the Core; `r` is its apparent radius in px */
  core: Anchor & { r: number };
};
