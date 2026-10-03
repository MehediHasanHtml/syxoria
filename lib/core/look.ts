/**
 * The Core's look — two choices the client is comparing, switchable live:
 *
 *   palette  the colour of the Core's inner light: the original gold, or a deep emerald
 *            (only the light changes — stone, materials, contrast and atmosphere stay the same)
 *   ground   "float": no lines under the Core during the journey (they return with the vitrine)
 *            "lines": the contour lines under it all along (the previous version)
 *
 * The emerald test has its own page (/emerald, see CoreExperience's `palette`); on any page the
 * URL can also ask for a look (?core=emerald&ground=lines) and a small compare panel (?compare).
 * Nothing is remembered between visits, so the original — gold — is always what the homepage
 * shows. Kept free of three.js.
 */
export type CorePalette = "gold" | "emerald";
export type CoreGround = "float" | "lines";
export type CoreLook = { palette: CorePalette; ground: CoreGround; compare: boolean };

export const DEFAULT_LOOK: CoreLook = { palette: "gold", ground: "float", compare: false };

type RGB = [number, number, number];

/** Every colour of the Core's light, per palette (linear RGB, HDR where it glows). */
export type PaletteColors = {
  /** heat ramp: deep → bright → hot → white-hot */
  heat: [RGB, RGB, RGB, RGB];
  rim: RGB;
  spill: RGB;
  haloWide: RGB;
  haloTight: RGB;
  line: RGB;
  edge: RGB;
  glass: RGB;
  node: RGB;
  nodeLit: RGB;
  ember: [RGB, RGB];
  pool: RGB;
  vitrine: RGB;
};

export const PALETTES: Record<CorePalette, PaletteColors> = {
  gold: {
    heat: [
      [0.42, 0.07, 0.01],
      [1.0, 0.4, 0.09],
      [1.0, 0.72, 0.38],
      [1.0, 0.93, 0.8],
    ],
    rim: [1.0, 0.55, 0.22],
    spill: [1.0, 0.45, 0.12],
    haloWide: [1.0, 0.5, 0.18],
    haloTight: [1.0, 0.68, 0.36],
    line: [1.0, 0.5, 0.16],
    edge: [1.0, 0.8, 0.6],
    glass: [0.9, 0.78, 0.6],
    node: [1.0, 0.82, 0.62],
    nodeLit: [1.0, 0.7, 0.4],
    ember: [
      [1.0, 0.46, 0.12],
      [1.0, 0.82, 0.55],
    ],
    pool: [1.0, 0.5, 0.16],
    vitrine: [1.0, 0.72, 0.45],
  },
  // a dark, deep emerald green — the gold's exact role, set much lower (the light is multiplied by its
  // intensity, so a brighter green turns neon in the hot fissures) and a touch towards blue: never
  // lime or mint; even its hottest point stays a dark jade
  emerald: {
    heat: [
      [0.0, 0.045, 0.025],
      [0.0, 0.21, 0.105],
      [0.015, 0.36, 0.185],
      [0.14, 0.57, 0.35],
    ],
    rim: [0.03, 0.32, 0.17],
    spill: [0.0, 0.28, 0.14],
    haloWide: [0.0, 0.21, 0.105],
    haloTight: [0.015, 0.29, 0.145],
    line: [0.01, 0.31, 0.16],
    edge: [0.26, 0.56, 0.42],
    glass: [0.38, 0.6, 0.5],
    node: [0.4, 0.7, 0.56],
    nodeLit: [0.08, 0.46, 0.3],
    ember: [
      [0.0, 0.26, 0.14],
      [0.2, 0.56, 0.4],
    ],
    pool: [0.0, 0.2, 0.1],
    vitrine: [0.2, 0.52, 0.38],
  },
};

/* ------------------------------------------------------------ the store */

let current: CoreLook = DEFAULT_LOOK;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const url = new URLSearchParams(window.location.search);
  current = {
    palette: url.get("core") === "emerald" ? "emerald" : "gold",
    ground: url.get("ground") === "lines" ? "lines" : "float",
    compare: url.has("compare") || url.has("core") || url.has("ground"),
  };
}

export const lookStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get(): CoreLook {
    load();
    return current;
  },
  server: (): CoreLook => DEFAULT_LOOK,
  set(next: Partial<CoreLook>) {
    load();
    current = { ...current, ...next };
    listeners.forEach((fn) => fn());
  },
};
