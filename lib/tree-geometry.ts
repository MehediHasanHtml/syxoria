import { createRandom, round } from "./random";

/**
 * Procedural growth-tree geometry (bonsai silhouette).
 * Deterministic: a fixed seed produces the same tree on every render, so the
 * SVG can be server-rendered and cached. All coordinates live in VIEWBOX.
 */

export const TREE_VIEWBOX = { w: 800, h: 800 };
/** Visible crop of the drawing space (trims empty margins). */
export const TREE_CROP = { x: 60, y: 20, w: 680, h: 760 };
export const TREE_BASE = { x: 400, y: 596 };

export type Segment = {
  d: string;
  width: number;
  depth: number;
  /** 0..1 — when this segment starts drawing in the intro */
  delay: number;
};

export type Tip = { x: number; y: number; order: number; side: "left" | "right" };
export type Dot = { x: number; y: number; r: number; o: number; warm: boolean; cluster: number };
export type ModuleAnchor = { x: number; y: number; side: "left" | "right"; label: string; t: number };

export type TreeGeometry = {
  trunk: Segment[];
  branches: Segment[];
  roots: Segment[];
  tips: Tip[];
  foliage: Dot[];
  flows: { d: string; reverse: boolean; delay: number }[];
  particles: { x: number; y: number; r: number; delay: number; duration: number }[];
  anchors: ModuleAnchor[];
};

type Vec = { x: number; y: number };
const deg = (d: number) => (d * Math.PI) / 180;

function curve(from: Vec, angle: number, len: number, bend: number): { d: string; end: Vec } {
  const end = { x: from.x + Math.cos(angle) * len, y: from.y + Math.sin(angle) * len };
  const mid = { x: (from.x + end.x) / 2, y: (from.y + end.y) / 2 };
  // perpendicular offset for an organic bend
  const px = -Math.sin(angle) * bend * len;
  const py = Math.cos(angle) * bend * len;
  const c = { x: mid.x + px, y: mid.y + py };
  return {
    d: `M${round(from.x)},${round(from.y)} Q${round(c.x)},${round(c.y)} ${round(end.x)},${round(end.y)}`,
    end,
  };
}

export function buildTree(seed = 20260924): TreeGeometry {
  const rand = createRandom(seed);
  const jitter = (amount: number) => (rand() - 0.5) * 2 * amount;

  /* ---------------- Trunk: hand-shaped S-curve (bonsai) ---------------- */
  const trunkPts: Vec[] = [TREE_BASE, { x: 382, y: 506 }, { x: 420, y: 418 }, { x: 398, y: 344 }];
  const trunkCtrl: Vec[][] = [
    [{ x: 394, y: 560 }, { x: 368, y: 540 }],
    [{ x: 392, y: 470 }, { x: 432, y: 458 }],
    [{ x: 410, y: 384 }, { x: 386, y: 372 }],
  ];
  const trunkWidths = [22, 16, 11];
  const trunk: Segment[] = trunkPts.slice(0, -1).map((p, i) => {
    const q = trunkPts[i + 1];
    const [c1, c2] = trunkCtrl[i];
    return {
      d: `M${p.x},${p.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${q.x},${q.y}`,
      width: trunkWidths[i],
      depth: 0,
      delay: i * 0.08,
    };
  });

  /* ---------------- Branches: recursive growth ---------------- */
  const branches: Segment[] = [];
  const tips: Tip[] = [];
  const flows: TreeGeometry["flows"] = trunk.map((t, i) => ({ d: t.d, reverse: false, delay: 0.3 + i * 0.12 }));

  const MIN_ANGLE = deg(-174);
  const MAX_ANGLE = deg(-6);

  function grow(from: Vec, angle: number, len: number, width: number, depth: number, maxDepth: number, startDelay: number) {
    const a = Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, angle));
    const { d, end } = curve(from, a, len, jitter(0.22));
    const delay = startDelay + 0.12;
    branches.push({ d, width, depth, delay });
    if (depth <= 1) flows.push({ d, reverse: false, delay: 0.66 + depth * 0.2 + rand() * 0.4 });

    if (depth >= maxDepth) {
      tips.push({ x: round(end.x), y: round(end.y), order: 0, side: end.x < TREE_BASE.x ? "left" : "right" });
      return;
    }
    const n = depth === 0 ? (rand() < 0.5 ? 3 : 2) : rand() < 0.2 ? 3 : 2;
    const spread = deg(30 - depth * 3);
    for (let k = 0; k < n; k++) {
      const offset = (k - (n - 1) / 2) * spread + jitter(deg(10));
      // pull toward horizontal: bonsai pads spread wide and flat
      const flatten = (a < deg(-90) ? -1 : 1) * deg(6);
      grow(end, a + offset + flatten, len * (0.64 + rand() * 0.1), Math.max(0.8, width * 0.62), depth + 1, maxDepth, delay);
    }
  }

  // Major limbs: low-left (classic bonsai), mid-right, and crown.
  grow(trunkPts[1], deg(-170), 96, 8, 0, 3, 0.1);
  grow(trunkPts[2], deg(-12), 100, 7.5, 0, 3, 0.18);
  grow(trunkPts[3], deg(-140), 76, 7, 0, 3, 0.26);
  grow(trunkPts[3], deg(-90), 70, 7, 0, 3, 0.26);
  grow(trunkPts[3], deg(-40), 78, 7, 0, 3, 0.26);

  // Order tips outward from the crown so they "light up" progressively.
  const crown = trunkPts[3];
  tips
    .map((t, i) => ({ i, dist: Math.hypot(t.x - crown.x, t.y - crown.y) }))
    .sort((a, b) => a.dist - b.dist)
    .forEach((entry, rank) => (tips[entry.i].order = round(rank / tips.length, 3)));

  /* ---------------- Foliage: pointillist data canopy ---------------- */
  const foliage: Dot[] = [];
  tips.forEach((tip, cluster) => {
    const count = 11 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = Math.sqrt(rand());
      // flattened pad, fuller on top (light comes from above)
      const x = tip.x + Math.cos(ang) * rad * 30;
      const y = tip.y + Math.sin(ang) * rad * (Math.sin(ang) < 0 ? 13 : 7) - 5;
      foliage.push({
        x: round(x),
        y: round(y),
        r: round(0.9 + rand() * 1.9, 2),
        o: round(0.2 + rand() * 0.65, 2),
        warm: rand() < 0.26,
        cluster,
      });
    }
  });

  /* ---------------- Roots: spreading, glowing ---------------- */
  const roots: Segment[] = [];
  function root(from: Vec, angle: number, len: number, width: number, depth: number) {
    const a = Math.min(deg(176), Math.max(deg(4), angle));
    const { d, end } = curve(from, a, len, jitter(0.3));
    roots.push({ d, width, depth, delay: 0.05 + depth * 0.14 });
    if (depth <= 1) flows.push({ d, reverse: true, delay: rand() * 1.2 });
    if (depth >= 3) return;
    const n = rand() < 0.5 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      root(end, a + jitter(deg(28)), len * (0.62 + rand() * 0.12), Math.max(0.6, width * 0.55), depth + 1);
    }
  }
  [10, 26, 52, 78, 104, 130, 156, 170].forEach((angle, i) =>
    root({ x: TREE_BASE.x + (i - 3.5) * 3, y: TREE_BASE.y - 2 }, deg(angle), 70 + rand() * 50, 4.5, 0),
  );

  /* ---------------- Dust particles inside the prism ---------------- */
  const particles = Array.from({ length: 26 }, () => ({
    x: round(220 + rand() * 360),
    y: round(160 + rand() * 420),
    r: round(0.6 + rand() * 1.1, 2),
    delay: round(rand() * 9, 2),
    duration: round(9 + rand() * 8, 2),
  }));

  /* ---------------- Module anchors (outermost tips per side, spread vertically) ---------------- */
  const labels = ["Lume", "Nexo", "Volt", "Kairo", "Zento", "Orion"];
  const pick = (side: "left" | "right") =>
    tips
      .filter((t) => t.side === side)
      .sort((a, b) => (side === "left" ? a.x - b.x : b.x - a.x))
      .reduce<Tip[]>((acc, t) => (acc.every((p) => Math.abs(p.y - t.y) > 38) && acc.length < 3 ? [...acc, t] : acc), [])
      .sort((a, b) => a.y - b.y);
  const left = pick("left");
  const right = pick("right");
  const anchors: ModuleAnchor[] = [...left, ...right].map((t, i) => ({
    x: t.x,
    y: t.y,
    side: t.side,
    label: labels[i] ?? "",
    t: round(0.45 + i * 0.09, 2),
  }));

  return { trunk, branches, roots, tips, foliage, flows, particles, anchors };
}
