"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { buildLivingTree, FLOOR, MOUND_R, moundTop, type LivingTreeModel } from "@/lib/living-tree";

/**
 * The brand's living tree — the signature element of the Syxoria universe.
 *
 * A bonsai kept in a glass vitrine: it grows out of a mound of dark stones
 * veined with light, under a single panel lamp, with a ring of light orbiting
 * the case. Canvas renderer for the procedural model in lib/living-tree.ts:
 * - grows: `growth` (0..1) is eased toward, so changes read as organic growth
 * - breathes: hierarchical wind sway — twigs move, the trunk barely does
 * - pulses: light travels up the veins into the trunk
 * - listens: the pointer adds a faint breeze
 * - rests: only animates while visible; static under prefers-reduced-motion
 */

type Props = {
  /** Target growth 0..1 (static). */
  growth?: number;
  /** Live target growth, read every frame (for scroll-driven growth). */
  growthRef?: { current: number };
  /** Grow in from nothing the first time the tree becomes visible. */
  intro?: boolean;
  /** The glass case, lamp and orbit around the tree. */
  vitrine?: boolean;
  className?: string;
  label?: string;
};

let cache: LivingTreeModel | null = null;
function getModel() {
  if (!cache) cache = buildLivingTree({ detail: window.innerWidth < 640 ? 0.7 : 1 });
  return cache;
}

// Light: warm amber glow and its near-white core
const WARM = "255,190,112";
const PALE = "255,236,205";
// Foliage, shadow → lit
const LEAF_TONES = ["#0f0c09", "#1f1811", "#35291b", "#524028", "#7a5f39", "#a5834f", "#cfae72", "#efd6a2"];

// Scene, in tree space (trunk base at the origin, up is -y)
const CUBE = { w: 336, d: 215, top: -560, bottom: FLOOR };
const PEDESTAL = [
  { w: 352, d: 234, y0: FLOOR, y1: FLOOR + 24 },
  { w: 404, d: 276, y0: FLOOR + 24, y1: FLOOR + 60 },
];
const LAMP = { w: 92, d: 66 };
const ORBIT = { r: 468, y: -300, roll: 0.13 };
const CAM = { yaw: 0.3, pitch: 0.2, f: 1750 };
const cyaw = Math.cos(CAM.yaw);
const syaw = Math.sin(CAM.yaw);
const cpit = Math.cos(CAM.pitch);
const spit = Math.sin(CAM.pitch);

/** Perspective projection (unit scale, origin at the trunk base) → [x, y, depth]. */
function project(X: number, Y: number, Z: number): [number, number, number] {
  const x1 = X * cyaw + Z * syaw;
  const z1 = -X * syaw + Z * cyaw;
  const y2 = Y * cpit - z1 * spit;
  const z2 = z1 * cpit + Y * spit;
  const s = CAM.f / (CAM.f + z2);
  return [x1 * s, y2 * s, z2];
}

const box = (w: number, d: number, y0: number, y1: number) => {
  const v: [number, number, number][] = [];
  for (const y of [y0, y1]) for (const z of [-d, d]) for (const x of [-w, w]) v.push([x, y, z]);
  // index = (y1?4:0) + (back?2:0) + (right?1:0)
  return v;
};

const PARTICLES = 150;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function LivingTree({ growth = 1, growthRef, intro = true, vitrine = true, className, label }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef(growth);
  useEffect(() => {
    target.current = growth;
  }, [growth]);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let model: LivingTreeModel | null = null;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let g = intro && !reduced ? 0 : (growthRef?.current ?? target.current);
    let age = intro && !reduced ? 0 : 99;
    let visible = false;
    let raf = 0;
    let last = 0;
    let time = 0;
    let breeze = 0;
    let breezeTarget = 0;
    let lastDrawnG = -1;
    let px: Float32Array;
    let py: Float32Array;
    let ang: Float32Array;
    let sparkle: Int32Array;
    // static layers, rebuilt on resize
    const groundCv = document.createElement("canvas");
    const veinCv = document.createElement("canvas");

    // dust motes drifting up through the lamp light (tree space)
    const mx = new Float32Array(PARTICLES);
    const my = new Float32Array(PARTICLES);
    const mv = new Float32Array(PARTICLES);
    const mph = new Float32Array(PARTICLES);
    const ms = new Float32Array(PARTICLES);
    const spawn = (i: number, anywhere: boolean) => {
      const u = Math.random() * 2 - 1;
      mx[i] = u * Math.abs(u) ** 0.4 * CUBE.w * 0.92;
      my[i] = anywhere ? CUBE.top + 30 + Math.random() * (FLOOR - CUBE.top - 40) : moundTop(mx[i]) - Math.random() * 30;
      mv[i] = 6 + Math.random() * 16;
      mph[i] = Math.random() * 100;
      ms[i] = 0.5 + Math.random() ** 3 * 1.6;
    };
    for (let i = 0; i < PARTICLES; i++) spawn(i, true);

    const sx = (X: number, Y: number, Z: number) => {
      const p = project(X, Y, Z);
      return [ox + p[0] * scale, oy + p[1] * scale, p[2]] as const;
    };

    const fit = () => {
      const r = el.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      // frame the whole scene: pedestal, case and orbit
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const add = (X: number, Y: number, Z: number) => {
        const [x, y] = project(X, Y, Z);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      };
      const p = PEDESTAL[1];
      for (const v of box(p.w, p.d, p.y0, p.y1)) add(...v);
      for (const v of box(CUBE.w, CUBE.d, CUBE.top, CUBE.bottom)) add(...v);
      if (vitrine) for (let k = 0; k < 64; k++) orbitPoint((k / 64) * Math.PI * 2, add);
      scale = Math.min((W * 0.96) / (maxX - minX), (H * 0.95) / (maxY - minY));
      ox = W / 2 - ((minX + maxX) / 2) * scale;
      oy = H / 2 - ((minY + maxY) / 2) * scale;
      if (model) buildStatic();
      lastDrawnG = -1;
    };

    function orbitPoint(t: number, out: (x: number, y: number, z: number) => void) {
      const X = Math.cos(t) * ORBIT.r;
      const Z = Math.sin(t) * ORBIT.r * 0.82;
      out(X, ORBIT.y - X * Math.tan(ORBIT.roll) - Z * 0.2, Z);
    }

    /** Pedestal, stone mound and the resting glow of the veins — drawn once per size. */
    const buildStatic = () => {
      const m = model!;
      for (const c of [groundCv, veinCv]) {
        c.width = cv.width;
        c.height = cv.height;
      }
      const gx = groundCv.getContext("2d")!;
      gx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const T = (x: number, y: number) => [ox + x * scale, oy + y * scale] as const;

      // warm pool of light on the floor
      const [fx, fy] = sx(0, PEDESTAL[1].y1, 0);
      gx.save();
      gx.translate(fx, fy);
      gx.scale(1, 0.22);
      const pool = gx.createRadialGradient(0, 0, 0, 0, 0, 560 * scale);
      pool.addColorStop(0, `rgba(${WARM},0.16)`);
      pool.addColorStop(1, `rgba(${WARM},0)`);
      gx.fillStyle = pool;
      gx.fillRect(-600 * scale, -600 * scale, 1200 * scale, 1200 * scale);
      gx.restore();

      // pedestal: two dark slabs with lit edges
      for (let s = PEDESTAL.length - 1; s >= 0; s--) {
        const p = PEDESTAL[s];
        const v = box(p.w, p.d, p.y0, p.y1).map((q) => sx(...q));
        const face = (idx: number[], fill: string | CanvasGradient) => {
          gx.beginPath();
          idx.forEach((k, i) => (i ? gx.lineTo(v[k][0], v[k][1]) : gx.moveTo(v[k][0], v[k][1])));
          gx.closePath();
          gx.fillStyle = fill;
          gx.fill();
        };
        const top = gx.createLinearGradient(0, v[2][1], 0, v[0][1]);
        top.addColorStop(0, "#0b0a09");
        top.addColorStop(1, "#1b1713");
        face([0, 1, 3, 2], top);
        face([0, 1, 5, 4], "#0d0b0a");
        face([1, 3, 7, 5], "#070606");
        gx.globalCompositeOperation = "lighter";
        for (const [a, b, al] of [
          [0, 1, 0.55],
          [1, 3, 0.35],
          [4, 5, 0.12],
        ] as const) {
          gx.beginPath();
          gx.moveTo(v[a][0], v[a][1]);
          gx.lineTo(v[b][0], v[b][1]);
          gx.lineWidth = 3;
          gx.strokeStyle = `rgba(${WARM},${al * 0.25})`;
          gx.stroke();
          gx.lineWidth = 1;
          gx.strokeStyle = `rgba(${PALE},${al})`;
          gx.stroke();
        }
        gx.globalCompositeOperation = "source-over";
      }

      // mound silhouette, then the stones on it
      gx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const x = -MOUND_R + (k / 60) * MOUND_R * 2;
        const [a, b] = T(x, moundTop(x));
        if (k) gx.lineTo(a, b);
        else gx.moveTo(a, b);
      }
      gx.closePath();
      gx.fillStyle = "#050404";
      gx.fill();
      const S = m.ground.stones;
      for (let i = 0; i < S.x.length; i++) {
        const [cx, cy] = T(S.x[i], S.y[i]);
        const rx = S.rx[i] * scale;
        const ry = S.ry[i] * scale;
        gx.save();
        gx.translate(cx, cy);
        gx.rotate(S.rot[i]);
        const grad = gx.createRadialGradient(-rx * 0.3, -ry * 0.45, 0, 0, 0, rx * 1.1);
        grad.addColorStop(0, "#3b3026");
        grad.addColorStop(0.4, "#18130f");
        grad.addColorStop(1, "#050404");
        gx.beginPath();
        gx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        gx.fillStyle = grad;
        gx.fill();
        // rim light from the lamp above, warmer where a vein runs close by
        const glow = S.glow[i];
        gx.lineWidth = Math.max(0.6, scale * 0.9);
        gx.strokeStyle = `rgba(${WARM},${0.1 + glow * 0.55})`;
        gx.beginPath();
        gx.ellipse(0, 0, rx * 0.94, ry * 0.9, 0, Math.PI * 1.1, Math.PI * 1.85);
        gx.stroke();
        if (glow > 0.2) {
          gx.strokeStyle = `rgba(${WARM},${glow * 0.5})`;
          gx.beginPath();
          gx.ellipse(0, 0, rx * 0.94, ry * 0.9, 0, Math.PI * 0.15, Math.PI * 0.85);
          gx.stroke();
        }
        gx.restore();
      }

      // veins: a dark crevice under a soft glow and a bright core
      const V = m.ground.veins;
      const vx = veinCv.getContext("2d")!;
      vx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vx.lineCap = "round";
      vx.lineJoin = "round";
      for (const [mult, style] of [
        [6, `rgba(${WARM},0.045)`],
        [2.6, `rgba(${WARM},0.2)`],
        [0.9, "rgba(255,214,150,0.9)"],
      ] as const) {
        const buckets = new Map<number, Path2D>();
        for (let i = 0; i < V.x0.length; i++) {
          const k = Math.round(V.w[i] * 4);
          let path = buckets.get(k);
          if (!path) buckets.set(k, (path = new Path2D()));
          path.moveTo(...T(V.x0[i], V.y0[i]));
          path.lineTo(...T(V.x1[i], V.y1[i]));
        }
        vx.globalCompositeOperation = mult === 6 ? "source-over" : "lighter";
        vx.strokeStyle = style;
        for (const [k, path] of buckets) {
          vx.lineWidth = Math.max(0.5, (k / 4) * scale * mult);
          vx.stroke(path);
        }
      }
    };

    /** Soft glow stroke: wide haze, halo, bright core. */
    const glowStroke = (path: Path2D, core: number, alpha: number) => {
      if (alpha <= 0.002) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = core * 10;
      ctx.strokeStyle = `rgba(${WARM},${0.035 * alpha})`;
      ctx.stroke(path);
      ctx.lineWidth = core * 3.4;
      ctx.strokeStyle = `rgba(${WARM},${0.16 * alpha})`;
      ctx.stroke(path);
      ctx.lineWidth = core;
      ctx.strokeStyle = `rgba(${PALE},${0.92 * alpha})`;
      ctx.stroke(path);
      ctx.globalCompositeOperation = "source-over";
    };

    const flare = (x: number, y: number, r: number, alpha: number) => {
      if (alpha <= 0.002) return;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${PALE},${alpha})`);
      grad.addColorStop(0.25, `rgba(${WARM},${alpha * 0.35})`);
      grad.addColorStop(1, `rgba(${WARM},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    // The glass case: edges draw in, verticals first. Split by depth so the
    // back edges sit behind the tree and the front ones in front of it.
    const CV = box(CUBE.w, CUBE.d, CUBE.top, CUBE.bottom);
    // [from, to, kind] — kind 0: bottom, 1: vertical (drawn upward), 2: top
    const EDGES: [number, number, number][] = [
      [4, 5, 0], [5, 7, 0], [7, 6, 0], [6, 4, 0],
      [4, 0, 1], [5, 1, 1], [6, 2, 1], [7, 3, 1],
      [0, 1, 2], [1, 3, 2], [3, 2, 2], [2, 0, 2],
    ];
    const drawCase = (front: boolean, drawIn: number, t: number) => {
      const v = CV.map((q) => sx(...q));
      const path = new Path2D();
      for (const [a, b, kind] of EDGES) {
        const back = v[a][2] + v[b][2] > 0;
        if (back === front) continue;
        const f = clamp01(kind === 0 ? drawIn * 2.4 : kind === 1 ? (drawIn - 0.15) * 1.8 : (drawIn - 0.65) * 2.9);
        if (f <= 0) continue;
        path.moveTo(v[a][0], v[a][1]);
        path.lineTo(v[a][0] + (v[b][0] - v[a][0]) * f, v[a][1] + (v[b][1] - v[a][1]) * f);
      }
      const core = Math.max(0.8, scale * 1.5);
      glowStroke(path, core, front ? 0.85 : 0.32);
      if (!front || drawIn < 0.95) return;
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 8; k++) {
        if (v[k][2] > 0 && k !== 3) continue;
        flare(v[k][0], v[k][1], 16 * scale, (0.45 + Math.sin(t * 1.3 + k * 1.7) * 0.15) * clamp01((drawIn - 0.95) * 20));
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawGlass = (a: number) => {
      if (a <= 0) return;
      const v = CV.map((q) => sx(...q));
      // front pane: a faint sheen with one diagonal reflection
      const grad = ctx.createLinearGradient(v[0][0], v[0][1], v[5][0], v[5][1]);
      grad.addColorStop(0, `rgba(255,248,235,${0.035 * a})`);
      grad.addColorStop(0.42, "rgba(255,248,235,0)");
      grad.addColorStop(0.62, `rgba(255,248,235,${0.03 * a})`);
      grad.addColorStop(0.68, "rgba(255,248,235,0)");
      grad.addColorStop(1, `rgba(255,248,235,${0.02 * a})`);
      ctx.beginPath();
      ctx.moveTo(v[0][0], v[0][1]);
      ctx.lineTo(v[1][0], v[1][1]);
      ctx.lineTo(v[5][0], v[5][1]);
      ctx.lineTo(v[4][0], v[4][1]);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const drawLamp = (a: number, below: boolean) => {
      if (a <= 0) return;
      const q = [
        sx(-LAMP.w, CUBE.top, -LAMP.d),
        sx(LAMP.w, CUBE.top, -LAMP.d),
        sx(LAMP.w, CUBE.top, LAMP.d),
        sx(-LAMP.w, CUBE.top, LAMP.d),
      ];
      const [cx, cy] = sx(0, CUBE.top, 0);
      ctx.globalCompositeOperation = "lighter";
      if (below) {
        // the beam: a soft cone falling onto the crown
        const floorY = oy - 250 * scale;
        const beam = ctx.createLinearGradient(0, cy, 0, floorY);
        beam.addColorStop(0, `rgba(${WARM},${0.13 * a})`);
        beam.addColorStop(1, `rgba(${WARM},0)`);
        ctx.beginPath();
        ctx.moveTo(q[0][0], q[0][1]);
        ctx.lineTo(q[1][0], q[1][1]);
        ctx.lineTo(ox + 300 * scale, floorY);
        ctx.lineTo(ox - 300 * scale, floorY);
        ctx.closePath();
        ctx.fillStyle = beam;
        ctx.fill();
      } else {
        flare(cx, cy, 190 * scale, 0.32 * a);
        ctx.beginPath();
        q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = `rgba(${PALE},${0.95 * a})`;
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawOrbit = (front: boolean, a: number, t: number) => {
      if (a <= 0) return;
      const N = 140;
      const path = new Path2D();
      let pen = false;
      const pts: [number, number, number][] = [];
      for (let k = 0; k <= N; k++) orbitPoint((k / N) * Math.PI * 2, (X, Y, Z) => pts.push(sx(X, Y, Z) as [number, number, number]));
      for (let k = 0; k <= N; k++) {
        const isFront = Math.sin((k / N) * Math.PI * 2) <= 0;
        if (isFront !== front) {
          pen = false;
          continue;
        }
        if (pen) path.lineTo(pts[k][0], pts[k][1]);
        else path.moveTo(pts[k][0], pts[k][1]);
        pen = true;
      }
      glowStroke(path, Math.max(0.7, scale * 1.1), (front ? 0.55 : 0.2) * a);
      // beads riding the ring, and one bright comet
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < 14; b++) {
        const th = b * 0.449 + t * (0.07 + (b % 3) * 0.015);
        const isFront = Math.sin(th) <= 0;
        if (isFront !== front) continue;
        orbitPoint(th, (X, Y, Z) => {
          const [x, y] = sx(X, Y, Z);
          flare(x, y, (5 + (b % 4) * 2.5) * scale, (front ? 0.9 : 0.35) * a);
        });
      }
      const head = Math.PI + t * 0.16;
      for (let k = 0; k < 28; k++) {
        const th = head - k * 0.022;
        if (Math.sin(th) <= 0 !== front) continue;
        orbitPoint(th, (X, Y, Z) => {
          const [x, y] = sx(X, Y, Z);
          flare(x, y, (k ? 9 : 22) * scale, (1 - k / 28) * (k ? 0.5 : 1) * a);
        });
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawMotes = (front: boolean, a: number, t: number) => {
      if (a <= 0) return;
      ctx.globalCompositeOperation = "lighter";
      const buckets = [new Path2D(), new Path2D(), new Path2D()];
      for (let i = front ? 0 : 1; i < PARTICLES; i += 2) {
        const x = ox + (mx[i] + Math.sin(t * 0.4 + mph[i]) * 7) * scale;
        const y = oy + my[i] * scale;
        const tw = Math.sin(t * (1.2 + (i % 5) * 0.3) + mph[i]) ** 2;
        const k = Math.min(2, Math.floor(tw * 3));
        const r = ms[i] * Math.max(0.6, scale * 1.3);
        buckets[k].moveTo(x + r, y);
        buckets[k].arc(x, y, r, 0, Math.PI * 2);
      }
      buckets.forEach((b, k) => {
        ctx.fillStyle = `rgba(${PALE},${(0.18 + k * 0.32) * a})`;
        ctx.fill(b);
      });
      ctx.globalCompositeOperation = "source-over";
    };

    const drawVeinPulses = (a: number, t: number) => {
      const V = model!.ground.veins;
      if (a <= 0) return;
      const span = V.maxD + 120;
      const heads = [0, 0.37, 0.71].map((o) => V.maxD - (((t * 42) / span + o) % 1) * span);
      const hot = new Path2D();
      const warm = new Path2D();
      for (let i = 0; i < V.x0.length; i++) {
        let near = 1e9;
        for (const h of heads) near = Math.min(near, Math.abs(V.d[i] - h));
        if (near > 26) continue;
        const p = near < 10 ? hot : warm;
        p.moveTo(ox + V.x0[i] * scale, oy + V.y0[i] * scale);
        p.lineTo(ox + V.x1[i] * scale, oy + V.y1[i] * scale);
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.4, scale * 4);
      ctx.strokeStyle = `rgba(${WARM},${0.35 * a})`;
      ctx.stroke(warm);
      ctx.stroke(hot);
      ctx.lineWidth = Math.max(0.8, scale * 1.6);
      ctx.strokeStyle = `rgba(${PALE},${0.9 * a})`;
      ctx.stroke(hot);
      ctx.globalCompositeOperation = "source-over";
    };

    const draw = () => {
      // nothing to paint until the element has been laid out
      if (!model || !groundCv.width || !groundCv.height) return;
      const m = model;
      const n = m.count;
      const t = time;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const eased = g * g * (3 - 2 * g);
      const thick = 0.28 + 0.72 * eased;
      const phase = (a: number, b: number) => clamp01((age - a) / (b - a));
      const caseIn = vitrine ? phase(0.15, 1.9) : 0;
      const groundIn = phase(0, 0.9);
      const lampIn = vitrine ? phase(1.3, 1.9) * (age < 2.1 ? (Math.sin(age * 55) > -0.2 ? 1 : 0.35) : 1) : 0;
      const veinIn = phase(0.6, 2.2) * (0.82 + Math.sin(t * 1.1) * 0.18);
      const orbitIn = vitrine ? phase(1.5, 2.8) : 0;
      const motesIn = phase(1, 2.6);

      // Behind the tree
      if (lampIn > 0) {
        ctx.globalCompositeOperation = "lighter";
        flare(ox, oy - 360 * scale, 420 * scale, 0.07 * lampIn);
        ctx.globalCompositeOperation = "source-over";
      }
      drawOrbit(false, orbitIn, t);
      drawCase(false, caseIn, t);
      drawLamp(lampIn, true);
      ctx.globalAlpha = groundIn;
      ctx.drawImage(groundCv, 0, 0, W, H);
      ctx.globalAlpha = 1;
      if (veinIn > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = veinIn;
        ctx.drawImage(veinCv, 0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        drawVeinPulses(phase(1.6, 2.6), t);
      }
      drawMotes(false, motesIn, t);

      // Positions with hierarchical wind
      px[0] = ox;
      py[0] = oy;
      ang[0] = 0;
      const gust = Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.13 + 1.3) * 0.5;
      for (let i = 1; i < n; i++) {
        const p = m.parent[i];
        const f = m.flex[i];
        const ph = m.phase[i];
        const a =
          ang[p] +
          (f === 0 ? 0 : f * (Math.sin(t * 1.15 + ph) * (0.55 + gust * 0.25) + Math.sin(t * 2.4 + ph * 1.9) * 0.18 + breeze * 1.1));
        ang[i] = a;
        const c = Math.cos(a);
        const s = Math.sin(a);
        px[i] = px[p] + (m.dx[i] * c - m.dy[i] * s) * scale;
        py[i] = py[p] + (m.dx[i] * s + m.dy[i] * c) * scale;
      }

      // Branches: bucket by width → a handful of strokes per frame
      const base = new Map<number, Path2D>();
      const light = new Map<number, Path2D>();
      for (let i = m.trunkCount; i < n; i++) {
        const born = m.born[i];
        if (born > g) continue;
        const p = m.parent[i];
        const ex = px[i];
        const ey = py[i];
        const w = m.radius[i] * scale * thick * 2;
        const k = Math.max(1, Math.min(160, Math.round(w * 2)));
        let path = base.get(k);
        if (!path) base.set(k, (path = new Path2D()));
        path.moveTo(px[p], py[p]);
        path.lineTo(ex, ey);
        if (w > 1.6) {
          let hl = light.get(k);
          if (!hl) light.set(k, (hl = new Path2D()));
          // lit from the lamp above
          const offx = -w * 0.1;
          const offy = -w * 0.26;
          hl.moveTo(px[p] + offx, py[p] + offy);
          hl.lineTo(ex + offx, ey + offy);
        }
      }
      // growing tips: partial segments toward the next node
      for (let i = 1; i < n; i++) {
        const born = m.born[i];
        if (born <= g) continue;
        const p = m.parent[i];
        const pb = m.born[p];
        if (pb > g) continue;
        const f = (g - pb) / Math.max(1e-4, born - pb);
        const w = m.radius[i] * scale * thick * 2;
        const k = Math.max(1, Math.min(160, Math.round(w * 2)));
        let path = base.get(k);
        if (!path) base.set(k, (path = new Path2D()));
        path.moveTo(px[p], py[p]);
        path.lineTo(px[p] + (px[i] - px[p]) * f, py[p] + (py[i] - py[p]) * f);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const [k, path] of base) {
        const w = k / 2;
        ctx.lineWidth = w;
        ctx.strokeStyle = w < 1.6 ? "#3a2d1f" : w < 4 ? "#241c14" : "#15110d";
        ctx.stroke(path);
      }
      // opaque highlight: overlapping round caps never bead
      ctx.strokeStyle = "#8c6636";
      for (const [k, path] of light) {
        ctx.lineWidth = (k / 2) * 0.26;
        ctx.stroke(path);
      }

      // Trunk: one tapered, shaded shape (covers branch joints cleanly)
      drawTrunk(thick, t);

      // Foliage: small clustered tufts, bucketed by tone, budding in as growth passes
      const L = m.leaves;
      const tones: Path2D[] = LEAF_TONES.map(() => new Path2D());
      for (let j = 0; j < L.count; j++) {
        const lb = L.born[j];
        if (lb > g) continue;
        const bud = Math.min(1, (g - lb) / 0.06);
        const node = L.node[j];
        const len = L.r[j] * scale * 1.4 * bud * (0.6 + 0.4 * eased);
        const a = L.angle[j] + ang[node];
        const hx = Math.cos(a) * len * 0.5;
        const hy = Math.sin(a) * len * 0.5;
        const x = px[node] + L.ox[j] * scale;
        const y = py[node] + L.oy[j] * scale;
        const tone = Math.min(LEAF_TONES.length - 1, Math.floor(L.shade[j] * LEAF_TONES.length));
        const path = tones[tone];
        path.moveTo(x - hx, y - hy);
        path.lineTo(x + hx, y + hy);
      }
      ctx.lineWidth = Math.max(1, scale * 1.35);
      for (let k = 0; k < tones.length; k++) {
        ctx.strokeStyle = LEAF_TONES[k];
        ctx.stroke(tones[k]);
      }
      // glints where the lamp catches the top of the canopy
      if (lampIn > 0) {
        ctx.globalCompositeOperation = "lighter";
        const glint = new Path2D();
        const r = Math.max(0.6, scale * 0.9);
        for (let q = 0; q < sparkle.length; q++) {
          const j = sparkle[q];
          if (L.born[j] > g || Math.sin(t * 1.7 + q * 2.3) < 0.55) continue;
          const node = L.node[j];
          const x = px[node] + L.ox[j] * scale;
          const y = py[node] + L.oy[j] * scale;
          glint.moveTo(x + r, y);
          glint.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(${PALE},${0.8 * lampIn})`;
        ctx.fill(glint);
        ctx.globalCompositeOperation = "source-over";
      }

      // In front of the tree
      drawMotes(true, motesIn, t);
      drawGlass(caseIn);
      drawLamp(lampIn, false);
      drawCase(true, caseIn, t);
      drawOrbit(true, orbitIn, t);
      lastDrawnG = g;
    };

    const drawTrunk = (thick: number, t: number) => {
      const m = model!;
      const T = m.trunkCount;
      let visibleT = 0;
      while (visibleT < T && m.born[visibleT] <= g) visibleT++;
      if (visibleT < 2) return;
      const L: number[] = [];
      const R: number[] = [];
      for (let i = 0; i < visibleT; i++) {
        const a = Math.max(0, i - 1);
        const b = Math.min(visibleT - 1, i + 1);
        let tx = px[b] - px[a];
        let ty = py[b] - py[a];
        const l = Math.hypot(tx, ty) || 1;
        tx /= l;
        ty /= l;
        // normal pointing to the lit (left) side
        const nx = ty;
        const ny = -tx;
        const w = m.radius[i] * scale * thick;
        L.push(px[i] + nx * w, py[i] + ny * w);
        R.push(px[i] - nx * w, py[i] - ny * w);
      }
      // Cylindrical shading: dark wood with a warm rim on the lit edge
      for (let i = 0; i < visibleT - 1; i++) {
        // overlap into the next slice so no seam shows between them
        const j = Math.min(visibleT - 1, i + 2);
        const grad = ctx.createLinearGradient(L[i * 2], L[i * 2 + 1], R[i * 2], R[i * 2 + 1]);
        grad.addColorStop(0, "#0d0a08");
        grad.addColorStop(0.08, "#6b4d2a");
        grad.addColorStop(0.2, "#9c753f");
        grad.addColorStop(0.34, "#3a2b1c");
        grad.addColorStop(0.64, "#17120d");
        grad.addColorStop(0.9, "#2a1f15");
        grad.addColorStop(1, "#070605");
        ctx.beginPath();
        ctx.moveTo(L[i * 2], L[i * 2 + 1]);
        ctx.lineTo(L[j * 2], L[j * 2 + 1]);
        ctx.lineTo(R[j * 2], R[j * 2 + 1]);
        ctx.lineTo(R[i * 2], R[i * 2 + 1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      // Bark: twisting ridges — dark fissures beside lit crests
      ctx.lineWidth = Math.max(0.7, scale * 0.8);
      for (const [lane, style] of [
        [-0.72, "rgba(0,0,0,0.55)"],
        [-0.5, "rgba(214,160,92,0.35)"],
        [-0.2, "rgba(0,0,0,0.55)"],
        [0.05, "rgba(214,160,92,0.22)"],
        [0.32, "rgba(0,0,0,0.5)"],
        [0.6, "rgba(214,160,92,0.14)"],
        [0.82, "rgba(0,0,0,0.5)"],
      ] as const) {
        ctx.strokeStyle = style;
        ctx.beginPath();
        for (let i = 0; i < visibleT; i++) {
          const twist = Math.sin(i * 0.09 + lane * 6) * 0.2 + Math.sin(i * 0.5 + lane * 9) * 0.05;
          const tt = (1 - Math.max(-0.95, Math.min(0.95, lane + twist))) / 2;
          const x = L[i * 2] + (R[i * 2] - L[i * 2]) * tt;
          const y = L[i * 2 + 1] + (R[i * 2 + 1] - L[i * 2 + 1]) * tt;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // the light from the veins climbs into the base of the trunk
      const rise = Math.min(visibleT, Math.round(visibleT * 0.28));
      if (rise > 2) {
        const [bx, by] = [px[0], py[0]];
        const [tx2, ty2] = [px[rise], py[rise]];
        const grad = ctx.createLinearGradient(bx, by, tx2, ty2);
        const pulse = 0.55 + Math.sin(t * 1.1) * 0.2;
        grad.addColorStop(0, `rgba(${WARM},${0.5 * pulse})`);
        grad.addColorStop(1, `rgba(${WARM},0)`);
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(0.8, scale * 1.2);
        ctx.beginPath();
        for (let i = 0; i < rise; i++) {
          const tt = 0.5 + Math.sin(i * 0.35) * 0.18;
          const x = L[i * 2] + (R[i * 2] - L[i * 2]) * tt;
          const y = L[i * 2 + 1] + (R[i * 2 + 1] - L[i * 2 + 1]) * tt;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // generous cap: growth keeps pace even if frames are dropped
      const dt = Math.min(0.25, last ? (now - last) / 1000 : 0.016);
      last = now;
      const goal = growthRef?.current ?? target.current;
      if (reduced) {
        g = goal;
        if (Math.abs(lastDrawnG - g) > 1e-4) draw();
        return;
      }
      g += (goal - g) * (1 - Math.exp(-dt * 1.7));
      if (Math.abs(goal - g) < 1e-4) g = goal;
      time += dt;
      age += dt;
      breeze += (breezeTarget - breeze) * (1 - Math.exp(-dt * 1.2));
      for (let i = 0; i < PARTICLES; i++) {
        my[i] -= mv[i] * dt;
        if (my[i] < CUBE.top + 20) spawn(i, false);
      }
      draw();
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (e: PointerEvent) => {
      breezeTarget = (e.clientX / window.innerWidth - 0.5) * -0.9;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    // Build the model off the critical path, then fade the canvas in.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = (cb: () => void) => (hasIdle ? window.requestIdleCallback(cb, { timeout: 600 }) : setTimeout(cb, 60));
    const handle = idle(() => {
      model = getModel();
      px = new Float32Array(model.count);
      py = new Float32Array(model.count);
      ang = new Float32Array(model.count);
      const glints: number[] = [];
      for (let j = 0; j < model.leaves.count; j += 5) if (model.leaves.shade[j] > 0.9) glints.push(j);
      sparkle = Int32Array.from(glints);
      fit();
      cv.dataset.ready = "";
      start();
    });

    const ro = new ResizeObserver(() => {
      fit();
      if (!raf) draw();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      if (hasIdle) window.cancelIdleCallback(handle as number);
      else clearTimeout(handle);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // The model, canvas and loop are set up once; growth is read live via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={label ?? "A bonsai growing in a glowing glass case, rooted in stones veined with light."}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-ready:opacity-100"
      />
    </div>
  );
}
