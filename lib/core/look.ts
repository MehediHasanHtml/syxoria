/**
 * The Core's look — its light, and one choice the client is comparing, switchable live:
 *
 *   ground   "float": no lines under the Core during the journey (they return with the vitrine)
 *            "lines": the contour lines under it all along (the previous version)
 *
 * The URL can ask for a ground (?ground=lines) and a small compare panel (?compare). Nothing is
 * remembered between visits. Kept free of three.js.
 */
export type CoreGround = "float" | "lines";
export type CoreLook = { ground: CoreGround; compare: boolean };

export const DEFAULT_LOOK: CoreLook = { ground: "float", compare: false };

type RGB = [number, number, number];

/** Every colour of the Core's light (linear RGB, HDR where it glows). */
export type CoreLightColors = {
  /** heat ramp: deep → bright → hot → white-hot */
  heat: [RGB, RGB, RGB, RGB];
  rim: RGB;
  spill: RGB;
  haloWide: RGB;
  haloTight: RGB;
  /** the far veil of light in the air around the Core */
  haloVeil: RGB;
  line: RGB;
  edge: RGB;
  glass: RGB;
  node: RGB;
  nodeLit: RGB;
  ember: [RGB, RGB];
  pool: RGB;
  vitrine: RGB;
};

/**
 * The Core's light: a dark, deep emerald green, set low (the light is multiplied by its intensity,
 * so a brighter green turns neon in the hot fissures) and a touch towards blue: never lime or mint;
 * even its hottest point stays a dark jade.
 */
export const CORE_LIGHT: CoreLightColors = {
  heat: [
    [0.0, 0.045, 0.025],
    [0.0, 0.21, 0.105],
    [0.015, 0.36, 0.185],
    [0.14, 0.57, 0.35],
  ],
  rim: [0.03, 0.32, 0.17],
  spill: [0.0, 0.28, 0.14],
  haloWide: [0.0, 0.3, 0.16],
  haloTight: [0.02, 0.37, 0.19],
  haloVeil: [0.0, 0.2, 0.12],
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
    ground: url.get("ground") === "lines" ? "lines" : "float",
    compare: url.has("compare") || url.has("ground"),
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
