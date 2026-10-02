/**
 * The Core's look — two choices the client is comparing, switchable live:
 *
 *   palette  the colour of the Core's inner light: the original gold, or a deep emerald
 *            (only the light changes — stone, materials, contrast and atmosphere stay the same)
 *   ground   "float": no lines under the Core during the journey (they return with the vitrine)
 *            "lines": the contour lines under it all along (the previous version)
 *
 * Read from the URL (?core=emerald&ground=lines), remembered in the browser,
 * and shown in a small compare panel with ?compare. Kept free of three.js.
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
  nucleus: RGB;
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
    nucleus: [1.0, 0.46, 0.12],
  },
  // a dark, deep emerald: never neon — the bright end stays a pale, cool jade
  emerald: {
    heat: [
      [0.0, 0.12, 0.05],
      [0.01, 0.42, 0.2],
      [0.08, 0.62, 0.36],
      [0.5, 0.9, 0.7],
    ],
    rim: [0.1, 0.62, 0.36],
    spill: [0.04, 0.55, 0.26],
    haloWide: [0.03, 0.4, 0.19],
    haloTight: [0.08, 0.52, 0.3],
    line: [0.06, 0.55, 0.28],
    edge: [0.55, 0.92, 0.74],
    glass: [0.6, 0.86, 0.74],
    node: [0.7, 0.98, 0.84],
    nodeLit: [0.3, 0.9, 0.58],
    ember: [
      [0.06, 0.6, 0.3],
      [0.5, 0.96, 0.74],
    ],
    pool: [0.04, 0.5, 0.24],
    vitrine: [0.42, 0.9, 0.66],
    nucleus: [0.06, 0.78, 0.38],
  },
};

/* ------------------------------------------------------------ the store */

const KEY = "syxoria-core-look";
let current: CoreLook = DEFAULT_LOOK;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  let saved: Partial<CoreLook> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {}
  const url = new URLSearchParams(window.location.search);
  const palette = url.get("core") ?? saved.palette;
  const ground = url.get("ground") ?? saved.ground;
  current = {
    palette: palette === "emerald" ? "emerald" : "gold",
    ground: ground === "lines" ? "lines" : "float",
    compare: url.has("compare") || url.has("core") || url.has("ground") || !!saved.compare,
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
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {}
    listeners.forEach((fn) => fn());
  },
};
