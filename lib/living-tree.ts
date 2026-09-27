import { createRandom } from "./random";

/**
 * Procedural bonsai for the brand's signature tree.
 *
 * Grown with the space-colonisation algorithm (Runions et al.): branches grow
 * toward "attractor" points scattered inside foliage pads, which gives the
 * irregular, organic branching of a real tree instead of a drawn illustration.
 * Branch thickness follows the pipe model (da Vinci's rule).
 *
 * Output is a flat, typed-array model that the canvas renderer animates
 * (growth + wind) every frame. Same seed → same tree on every device.
 */

export type LivingTreeModel = {
  count: number;
  /** nodes [0, trunkCount) form the trunk — rendered as one shaded shape */
  trunkCount: number;
  parent: Int32Array;
  /** rest position */
  x: Float32Array;
  y: Float32Array;
  /** rest offset from parent (for hierarchical sway) */
  dx: Float32Array;
  dy: Float32Array;
  radius: Float32Array;
  /** 0..1 — when this node appears as the tree grows */
  born: Float32Array;
  /** how much wind bends this segment */
  flex: Float32Array;
  phase: Float32Array;
  leaves: {
    count: number;
    node: Int32Array;
    ox: Float32Array;
    oy: Float32Array;
    r: Float32Array;
    /** 0 (shadow) … 1 (lit) */
    shade: Float32Array;
    /** needle orientation (radians) */
    angle: Float32Array;
    born: Float32Array;
  };
  /** The stone mound the tree grows from, and the light veins running through it. */
  ground: {
    stones: { x: Float32Array; y: Float32Array; rx: Float32Array; ry: Float32Array; rot: Float32Array; glow: Float32Array };
    veins: { x0: Float32Array; y0: Float32Array; x1: Float32Array; y1: Float32Array; w: Float32Array; d: Float32Array; maxD: number };
  };
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

/** Ground line (top of the pedestal) and the stone mound, in tree space. */
export const FLOOR = 178;
export const MOUND_R = 310;
export const MOUND_H = 190;
export const moundTop = (x: number) => FLOOR - MOUND_H * Math.max(0, 1 - (x / MOUND_R) ** 2) ** 0.7;

type Pad = { cx: number; cy: number; rx: number; ry: number; n: number };

// Informal-upright bonsai: a domed crown and two wide side pads, each built
// from overlapping lobes so the foliage reads as clouds, not ellipses.
// Units: tree space, trunk base at (0, 0), up is negative y.
const PADS: Pad[] = [
  // crown
  { cx: -4, cy: -426, rx: 74, ry: 34, n: 125 },
  { cx: -78, cy: -404, rx: 62, ry: 28, n: 88 },
  { cx: 70, cy: -406, rx: 64, ry: 28, n: 90 },
  { cx: -132, cy: -382, rx: 42, ry: 20, n: 42 },
  { cx: 128, cy: -384, rx: 46, ry: 20, n: 46 },
  // left pad
  { cx: -186, cy: -302, rx: 72, ry: 30, n: 108 },
  { cx: -252, cy: -284, rx: 54, ry: 22, n: 60 },
  { cx: -124, cy: -290, rx: 50, ry: 22, n: 55 },
  // right pad
  { cx: 196, cy: -270, rx: 74, ry: 30, n: 110 },
  { cx: 262, cy: -252, rx: 50, ry: 21, n: 52 },
  { cx: 134, cy: -262, rx: 48, ry: 20, n: 50 },
];

/** Lobes are drawn a little fuller than their centres are spaced, so they merge into clouds. */
const PAD_SCALE = 1.16;

const TRUNK = { p0: [0, 0], p1: [74, -96], p2: [-118, -214], p3: [2, -362] } as const;

export function buildLivingTree({ seed = 7, detail = 1 }: { seed?: number; detail?: number } = {}): LivingTreeModel {
  const rand = createRandom(seed);
  const STEP = 4;
  const INFLUENCE = 230;
  const KILL = 8;
  const CELL = 115;

  // ---- nodes (growable arrays) ----
  const nx: number[] = [];
  const ny: number[] = [];
  const np: number[] = [];
  const ndx: number[] = []; // last growth direction
  const ndy: number[] = [];
  const grid = new Map<number, number[]>();
  const key = (cx: number, cy: number) => (cx + 64) * 4096 + (cy + 64);
  const addNode = (x: number, y: number, parent: number, dx: number, dy: number) => {
    const i = nx.length;
    nx.push(x);
    ny.push(y);
    np.push(parent);
    ndx.push(dx);
    ndy.push(dy);
    const k = key(Math.floor(x / CELL), Math.floor(y / CELL));
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
    return i;
  };

  // ---- trunk: an S-curve with character, sampled every STEP ----
  const bez = (t: number, a: number, b: number, c: number, d: number) =>
    (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
  let prev = addNode(0, 0, -1, 0, -1);
  const samples = 80;
  let lastX = 0;
  let lastY = 0;
  for (let s = 1; s <= samples; s++) {
    const t = s / samples;
    const x = bez(t, TRUNK.p0[0], TRUNK.p1[0], TRUNK.p2[0], TRUNK.p3[0]);
    const y = bez(t, TRUNK.p0[1], TRUNK.p1[1], TRUNK.p2[1], TRUNK.p3[1]);
    if (Math.hypot(x - lastX, y - lastY) < STEP && s < samples) continue;
    const len = Math.hypot(x - lastX, y - lastY) || 1;
    prev = addNode(x, y, prev, (x - lastX) / len, (y - lastY) / len);
    lastX = x;
    lastY = y;
  }
  const trunkCount = nx.length;

  // ---- attractors, dome-weighted inside each pad ----
  const ax: number[] = [];
  const ay: number[] = [];
  for (const pad of PADS) {
    const n = Math.round(pad.n * detail);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      const u = Math.cos(a) * r;
      let v = Math.sin(a) * r;
      if (v > 0) v *= 0.55; // flatter underside, domed top
      ax.push(pad.cx + u * pad.rx * PAD_SCALE);
      ay.push(pad.cy + v * pad.ry * PAD_SCALE);
    }
  }
  const alive = new Uint8Array(ax.length).fill(1);

  // ---- space colonisation ----
  const reach = Math.ceil(INFLUENCE / CELL);
  const lowTrunk = Math.floor(trunkCount * 0.34);
  for (let iter = 0; iter < 260; iter++) {
    const accX = new Map<number, number>();
    const accY = new Map<number, number>();
    const accN = new Map<number, number>();
    let active = 0;
    for (let a = 0; a < ax.length; a++) {
      if (!alive[a]) continue;
      const cx = Math.floor(ax[a] / CELL);
      const cy = Math.floor(ay[a] / CELL);
      let best = -1;
      let bestD = INFLUENCE;
      // search the 3×3 neighbourhood first; widen only if nothing is close
      for (let ring = 1; ring <= reach; ring++) {
        for (let gx = cx - ring; gx <= cx + ring; gx++) {
          for (let gy = cy - ring; gy <= cy + ring; gy++) {
            if (ring > 1 && Math.abs(gx - cx) < ring && Math.abs(gy - cy) < ring) continue;
            const bucket = grid.get(key(gx, gy));
            if (!bucket) continue;
            for (const j of bucket) {
              // the lower trunk never sprouts — keeps a clean, readable base
              // …and limbs leave the trunk only at a few points, like a real tree
              if (j < lowTrunk || (j < trunkCount && (j - lowTrunk) % 8 !== 0)) continue;
              const d = Math.hypot(ax[a] - nx[j], ay[a] - ny[j]);
              if (d < bestD) {
                bestD = d;
                best = j;
              }
            }
          }
        }
        if (bestD < CELL * ring) break;
      }
      if (best < 0) continue;
      if (bestD < KILL) {
        alive[a] = 0;
        continue;
      }
      active++;
      accX.set(best, (accX.get(best) ?? 0) + (ax[a] - nx[best]) / bestD);
      accY.set(best, (accY.get(best) ?? 0) + (ay[a] - ny[best]) / bestD);
      accN.set(best, (accN.get(best) ?? 0) + 1);
    }
    if (!active) break;
    for (const [j, sx] of accX) {
      const c = accN.get(j)!;
      // momentum + a slowly drifting bend per branch → gentle, natural curves
      const bend = Math.sin(nx[j] * 0.045 + ny[j] * 0.03 + seed) * 0.28;
      let dx = sx / c + ndx[j] * 0.55 + (rand() - 0.5) * 0.3 - ndy[j] * bend;
      let dy = accY.get(j)! / c + ndy[j] * 0.55 - 0.05 + (rand() - 0.5) * 0.3 + ndx[j] * bend;
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      addNode(nx[j] + dx * STEP, ny[j] + dy * STEP, j, dx, dy);
    }
  }

  const count0 = nx.length;

  // ---- light smoothing (keeps growth organic, removes zig-zag) ----
  const kids: number[][] = Array.from({ length: count0 }, () => []);
  for (let i = 1; i < count0; i++) kids[np[i]].push(i);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = trunkCount; i < count0; i++) {
      const p = np[i];
      const k = kids[i];
      if (!k.length) continue;
      let cx = 0;
      let cy = 0;
      for (const c of k) {
        cx += nx[c];
        cy += ny[c];
      }
      nx[i] = nx[i] * 0.5 + nx[p] * 0.25 + (cx / k.length) * 0.25;
      ny[i] = ny[i] * 0.5 + ny[p] * 0.25 + (cy / k.length) * 0.25;
    }
  }

  // ---- pipe-model radii (children always created after parents) ----
  const radius = new Float32Array(count0);
  const GAMMA = 2.1;
  const TIP = 0.38;
  for (let i = count0 - 1; i >= 0; i--) {
    if (!kids[i].length) {
      radius[i] = TIP;
      continue;
    }
    let s = 0;
    for (const c of kids[i]) s += radius[c] ** GAMMA;
    radius[i] = Math.max(TIP, s ** (1 / GAMMA));
  }
  // An old bonsai trunk is far thicker than the pipe model alone suggests:
  // give it an aged taper from a flared base to the crown.
  const crownY = -TRUNK.p3[1];
  for (let i = 0; i < trunkCount; i++) {
    const h = Math.min(1, -ny[i] / crownY);
    const aged = 34 - h * 23 + (h < 0.12 ? (0.12 - h) * 150 : 0);
    radius[i] = Math.max(radius[i], aged);
  }
  // primary limbs thicken where they leave the trunk
  for (let i = trunkCount; i < count0; i++) if (radius[i] > 1.2) radius[i] *= 1.35;

  // ---- surface roots (nebari): crawl down over the stone mound ----
  const rootStart = count0;
  for (let r = 0; r < 10; r++) {
    const side = r % 2 === 0 ? -1 : 1;
    const dip = 0.25 + rand() * 0.75; // radians below horizontal
    let ang = side < 0 ? Math.PI - dip : dip;
    let x = side * (4 + rand() * 9);
    let y = -2;
    let parent = 0;
    const steps = Math.round((70 + rand() * 170) / STEP);
    for (let s = 0; s < steps; s++) {
      ang += (rand() - 0.5) * 0.3;
      x += Math.cos(ang) * STEP;
      y += Math.sin(ang) * STEP * 0.8;
      y = Math.min(FLOOR - 6, Math.max(moundTop(x) + 2, y));
      if (Math.abs(x) > MOUND_R * 0.9) break;
      const idx = nx.length;
      nx.push(x);
      ny.push(y);
      np.push(parent);
      ndx.push(0);
      ndy.push(0);
      parent = idx;
    }
  }
  const count = nx.length;

  // ---- finalise arrays ----
  const parent = new Int32Array(count);
  const X = new Float32Array(count);
  const Y = new Float32Array(count);
  const DX = new Float32Array(count);
  const DY = new Float32Array(count);
  const R = new Float32Array(count);
  const born = new Float32Array(count);
  const flex = new Float32Array(count);
  const phase = new Float32Array(count);

  const pathLen = new Float32Array(count);
  let maxLen = 1;
  for (let i = 0; i < count; i++) {
    parent[i] = np[i];
    X[i] = nx[i];
    Y[i] = ny[i];
    if (i > 0) {
      DX[i] = nx[i] - nx[np[i]];
      DY[i] = ny[i] - ny[np[i]];
      pathLen[i] = pathLen[np[i]] + Math.hypot(DX[i], DY[i]);
    }
    if (i < rootStart) maxLen = Math.max(maxLen, pathLen[i]);
  }
  for (let i = 0; i < count; i++) {
    if (i < rootStart) {
      R[i] = radius[i];
      // eased so a young tree already carries foliage; the crown fills in last
      born[i] = (pathLen[i] / maxLen) ** 1.3 * 0.9;
      // thin twigs bend, the trunk barely moves
      flex[i] = i < trunkCount ? 0.0006 : 0.0055 / (R[i] + 0.9);
    } else {
      // roots taper from the trunk base outward and appear first
      let steps = 0;
      let p = i;
      while (p >= rootStart) {
        steps++;
        p = parent[p];
      }
      R[i] = Math.max(0.8, 14 * Math.exp(-steps * 0.06));
      born[i] = Math.min(0.12, steps * 0.006);
      flex[i] = 0;
    }
    phase[i] = X[i] * 0.012 + rand() * 0.6;
  }

  // ---- foliage: small leaf clusters on the fine twigs ----
  const lNode: number[] = [];
  const lOx: number[] = [];
  const lOy: number[] = [];
  const lR: number[] = [];
  const lShade: number[] = [];
  const lBorn: number[] = [];
  const lAngle: number[] = [];
  // Fill each pad volume with leaves, each hung on its nearest fine branch —
  // dense, cloud-like pads that still move with the wood underneath.
  for (const pad of PADS) {
    const n = Math.round(pad.n * 12 * detail);
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 1.08;
      const u = Math.cos(a) * r;
      let v = Math.sin(a) * r;
      if (v > 0) v *= 0.5;
      const lx = pad.cx + u * pad.rx * PAD_SCALE;
      const ly = pad.cy + v * pad.ry * PAD_SCALE - 4;
      // nearest non-trunk node
      const cx = Math.floor(lx / CELL);
      const cy = Math.floor(ly / CELL);
      let best = -1;
      let bd = 26;
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(key(gx, gy));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j < trunkCount || R[j] > 2.2) continue;
            const d = Math.hypot(lx - X[j], ly - Y[j]);
            if (d < bd) {
              bd = d;
              best = j;
            }
          }
        }
      }
      if (best < 0) continue;
      // lit from the panel above: bright domes, dark undersides
      const sh = 0.52 - v * 0.62 - u * 0.05 + (rand() - 0.5) * 0.34;
      lNode.push(best);
      lOx.push(lx - X[best]);
      lOy.push(ly - Y[best]);
      lR.push(0.8 + rand() * 1.15);
      lShade.push(Math.min(0.999, Math.max(0, sh)));
      lBorn.push(Math.min(1, born[best] + 0.03 + rand() * 0.07));
      // needles fan outward and slightly upward from their twig
      lAngle.push(Math.atan2(ly - Y[best], lx - X[best]) * 0.5 - 0.6 + (rand() - 0.5) * 1.6);
    }
  }

  // ---- light veins: jagged, branching cracks from the trunk into the mound ----
  const vx0: number[] = [];
  const vy0: number[] = [];
  const vx1: number[] = [];
  const vy1: number[] = [];
  const vw: number[] = [];
  const vd: number[] = [];
  let maxD = 1;
  const VSTEP = 5;
  const walk = (x: number, y: number, ang: number, w: number, d: number, depth: number) => {
    for (let s = 0; s < 110; s++) {
      ang += (rand() - 0.5) * 0.95;
      // gravity: cracks drift downhill
      let dx = Math.cos(ang);
      let dy = Math.sin(ang) + 0.12;
      const l = Math.hypot(dx, dy);
      dx /= l;
      dy /= l;
      ang = Math.atan2(dy, dx);
      const x2 = x + dx * VSTEP;
      const y2 = Math.max(moundTop(x2) + 3, y + dy * VSTEP);
      if (Math.abs(x2) > MOUND_R * 0.95 || y2 > FLOOR - 2) break;
      vx0.push(x);
      vy0.push(y);
      vx1.push(x2);
      vy1.push(y2);
      vw.push(w);
      vd.push(d);
      d += VSTEP;
      maxD = Math.max(maxD, d);
      w = Math.max(0.35, w * 0.982);
      if (depth < 2 && rand() < 0.05) walk(x2, y2, ang + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), w * 0.62, d, depth + 1);
      x = x2;
      y = y2;
    }
  };
  for (let v = 0; v < 9; v++) {
    const side = v % 2 === 0 ? -1 : 1;
    walk(side * rand() * 18, 2 + rand() * 6, Math.PI / 2 - side * (0.55 + rand() * 0.95), 2 + rand() * 0.8, 0, 0);
  }

  // ---- stones: a packed mound, bigger toward the floor ----
  const stones: { x: number; y: number; rx: number; ry: number; rot: number; glow: number }[] = [];
  const stoneN = Math.round(560 * detail);
  for (let k = 0; k < stoneN * 2 && stones.length < stoneN; k++) {
    const x = (rand() * 2 - 1) * MOUND_R * 0.99;
    const top = moundTop(x);
    if (top >= FLOOR - 3) continue;
    const t = rand() ** 0.85;
    const y = top + 2 + t * (FLOOR - top - 2);
    const r = 5 + rand() * 6 + t * 7;
    // stones beside a vein catch its light
    let best = 1e9;
    for (let j = 0; j < vx0.length; j++) {
      const d = Math.hypot(x - (vx0[j] + vx1[j]) / 2, y - (vy0[j] + vy1[j]) / 2);
      if (d < best) best = d;
    }
    stones.push({ x, y, rx: r, ry: r * (0.62 + rand() * 0.25), rot: (rand() - 0.5) * 0.8, glow: Math.exp(-best / 12) });
  }
  stones.sort((a, b) => a.y - b.y);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    minX = Math.min(minX, X[i]);
    maxX = Math.max(maxX, X[i]);
    minY = Math.min(minY, Y[i]);
    maxY = Math.max(maxY, Y[i]);
  }

  return {
    count,
    trunkCount,
    parent,
    x: X,
    y: Y,
    dx: DX,
    dy: DY,
    radius: R,
    born,
    flex,
    phase,
    leaves: {
      count: lNode.length,
      node: Int32Array.from(lNode),
      ox: Float32Array.from(lOx),
      oy: Float32Array.from(lOy),
      r: Float32Array.from(lR),
      shade: Float32Array.from(lShade),
      born: Float32Array.from(lBorn),
      angle: Float32Array.from(lAngle),
    },
    ground: {
      stones: {
        x: Float32Array.from(stones, (st) => st.x),
        y: Float32Array.from(stones, (st) => st.y),
        rx: Float32Array.from(stones, (st) => st.rx),
        ry: Float32Array.from(stones, (st) => st.ry),
        rot: Float32Array.from(stones, (st) => st.rot),
        glow: Float32Array.from(stones, (st) => st.glow),
      },
      veins: {
        x0: Float32Array.from(vx0),
        y0: Float32Array.from(vy0),
        x1: Float32Array.from(vx1),
        y1: Float32Array.from(vy1),
        w: Float32Array.from(vw),
        d: Float32Array.from(vd),
        maxD,
      },
    },
    bounds: { minX: minX - 10, maxX: maxX + 10, minY: minY - 10, maxY: maxY + 10 },
  };
}
