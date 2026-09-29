/**
 * The Core's scene state — one flat object of numbers that the story scrubs
 * with GSAP and the WebGL scene reads every frame. Kept free of three.js so
 * pages can import it without pulling the renderer into their first bundle.
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
  /** preloader intro, multiplies everything (0 → 1) */
  intro: number;
  strands: number;
  embers: number;
  dust: number;
  floor: number;
  plinth: number;
  vitrine: number;
  orbs: number;
  /** which module orb is lit (float index, 0..5; -1 none) */
  activeOrb: number;
  network: number;
  warp: number;
  fade: number;
  wordmark: number;
  /** extra rotation of the Core (radians) */
  spin: number;
  scale: number;
  lift: number;
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
  awaken: 0.45,
  intro: 1,
  strands: 0.2,
  embers: 0.5,
  dust: 0.6,
  floor: 1,
  plinth: 1,
  vitrine: 0,
  orbs: 0,
  activeOrb: -1,
  network: 0,
  warp: 0,
  fade: 0,
  wordmark: 0,
  spin: 0,
  scale: 1,
  lift: 0,
};

export const createCoreState = (overrides: Partial<CoreState> = {}): CoreState => ({ ...DEFAULT_STATE, ...overrides });

export type Anchor = { x: number; y: number; alpha: number };
export type CoreAnchors = { orbs: Anchor[]; nodes: Anchor[] };
