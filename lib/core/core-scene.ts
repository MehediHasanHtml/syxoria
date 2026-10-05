import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { CORE_LIGHT } from "./look";
import { createNoise3D, fbm, mulberry32, smoothstep } from "./noise";
import * as S from "./shaders";
import { DEFAULT_STATE, type Anchor, type CoreAnchors, type CoreState } from "./state";

/**
 * The Core — Syxoria's signature object and the company's brain: a dense,
 * near-black mass with a living light in its fissures, floating in the dark.
 *
 * Everything is built once and driven by one flat numeric state (`CoreState`)
 * that GSAP scrubs with the scroll. Its parts belong to one body that turns
 * with it, so every function always lives in the same place:
 *
 *   · three zones on its surface — signals run in, the heart understands, action runs out
 *   · six fragments, one per module — real pieces of its stone that separate from it, each its own way
 *   · the tools, wired to it by roots that leave its surface
 *   · the product screen: a real monitor (live HTML) standing in the same 3D space
 *
 * The visitor adds on top: the cursor warms the stone under it, points at a
 * module's fragment (it lifts and lights) or at a tool (a pulse runs down its wire).
 */

export type { Anchor, CoreAnchors, CoreState };

export type CoreSceneOptions = {
  /** shared by reference: whoever holds it can drive the scene */
  state?: CoreState;
  quality?: "high" | "low";
  interactive?: boolean;
  reducedMotion?: boolean;
  nodeCount?: number;
  /** pre-built rock (see buildRockGeometry) so the caller can spread the work over several frames */
  rockGeometry?: THREE.BufferGeometry;
  /** an HTML element (the front of the product monitor) placed in the scene beside the Core */
  screen?: HTMLElement;
  onFrame?: (anchors: CoreAnchors) => void;
};

const TAU = Math.PI * 2;
const FLOOR_Y = -1.75;
const PLINTH_H = 0.72;
const PLINTH_W = 2.3;
const PLINTH_TOP = FLOOR_Y + PLINTH_H;
const CORE_Y = 0.12;
/** The Core stays compact: everything around it scales with it. */
const CORE_SIZE = 0.8;
/** How finely the rock is sculpted (icosphere subdivisions): fine enough to stay smooth in close-up. */
export const ROCK_DETAIL = { high: 48, low: 26 };

/**
 * The shards of the opening sequence (the loader): the whole Core cut into six
 * pieces around the axis that faces the viewer, each drifting in from its own side.
 */
const SHARDS = [
  { angle: 94, z: -0.18 },
  { angle: 33, z: -0.3 },
  { angle: -31, z: -0.12 },
  { angle: -86, z: -0.26 },
  { angle: -152, z: -0.2 },
  { angle: 148, z: -0.15 },
];

/**
 * The six fragments, one per module, in module order (clockwise from the top,
 * seen from the front): real pieces of the Core's stone, each cut from its own
 * precise area — the rest of the Core, its body, stays whole and still.
 * Deliberately uneven, so the Core reads as a complex, irregular nucleus and
 * never as something designed to come apart:
 *
 *   angle, tilt  where it sits: around the facing axis, and how far from it (deg)
 *   size         how large an area it takes (deg) · depth: how thick a piece of stone
 *   out          how far it travels · drift: off its own axis (deg) · when: its moment
 *   turn         how much it tilts away as it leaves (rad)
 */
const FRAGMENTS = [
  { angle: 98, tilt: 50, size: 29, depth: 0.36, out: 0.55, drift: 14, when: 0.0, turn: 0.42 },
  { angle: 36, tilt: 62, size: 22, depth: 0.27, out: 0.42, drift: -18, when: 0.16, turn: -0.55 },
  { angle: -22, tilt: 47, size: 33, depth: 0.4, out: 0.47, drift: 8, when: 0.06, turn: 0.3 },
  { angle: -94, tilt: 64, size: 24, depth: 0.3, out: 0.38, drift: -10, when: 0.24, turn: -0.4 },
  { angle: -150, tilt: 53, size: 31, depth: 0.37, out: 0.58, drift: 20, when: 0.1, turn: 0.48 },
  { angle: 152, tilt: 66, size: 20, depth: 0.25, out: 0.46, drift: -14, when: 0.03, turn: -0.36 },
];
/** How far a fragment has parted (each its own moment). */
const fragmentOpen = (when: number, open: number) => smoothstep(when, when + 0.64, open);
/** The brain's three zones (object space): where signals come in, the heart, where action leaves. */
export const ZONE_DIRS = [new THREE.Vector3(-0.8, 0.5, 0.42), new THREE.Vector3(0.12, -0.1, 1), new THREE.Vector3(0.78, -0.42, 0.5)].map((v) => v.normalize());

/**
 * The product laptop, in CSS px: its lid (front = display + bezel, see LiveScreen),
 * the lid's thickness, the base's depth and thickness, how far the lid leans back
 * when open, and how much the whole laptop tips towards the viewer so its keyboard reads.
 */
export const LAPTOP = { w: 1244, h: 808, lid: 16, deck: 680, base: 22, lean: 0.2, tip: 0.26 };
/** The lid's width in the scene (world units) at scale 1. */
const SCREEN_W = 2.9;
export const SCREEN_AZ = 1.75;

const GRAPHITE_LINE = new THREE.Color(0.2, 0.2, 0.21);
const ORIGIN_2D = new THREE.Vector2();
const KEY_DIR = new THREE.Vector3(-0.55, 0.8, 0.45).normalize();
const color = (rgb: readonly number[]) => new THREE.Color(rgb[0], rgb[1], rgb[2]);

type LineMat = THREE.ShaderMaterial & {
  uniforms: Record<"uTime" | "uGrow" | "uHi" | "uDim" | "uIntensity" | "uFlow" | "uPulse" | "uShot" | "uShotAmt", THREE.IUniform<number>> & {
    uCool: THREE.IUniform<THREE.Color>;
    uWarm: THREE.IUniform<THREE.Color>;
  };
};

function lineMaterial({ flow = -1, pulse = 0.8 } = {}): LineMat {
  return new THREE.ShaderMaterial({
    vertexShader: S.branchVert,
    fragmentShader: S.branchFrag,
    uniforms: {
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uHi: { value: 0 },
      uDim: { value: 0 },
      uIntensity: { value: 0 },
      uFlow: { value: flow },
      uPulse: { value: pulse },
      uShot: { value: 0 },
      uShotAmt: { value: 0 },
      uCool: { value: GRAPHITE_LINE.clone() },
      uWarm: { value: new THREE.Color() },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }) as LineMat;
}

/** A tube that thins from r0 at its start to r1 at its end — roots, not cables. */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, segments: number, r0: number, r1: number, radial = 6) {
  const g = new THREE.TubeGeometry(curve, segments, 1, radial, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, c);
    const r = r0 + (r1 - r0) * Math.pow(u, 0.7);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  return g;
}

function haloMesh(falloff: number) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.haloVert,
    fragmentShader: S.haloFrag,
    uniforms: { uIntensity: { value: 0 }, uColor: { value: new THREE.Color() }, uFalloff: { value: falloff } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.frustumCulled = false;
  return m;
}

/** Shortest signed difference between two angles. */
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** Yield to the browser so input and painting are not blocked between setup steps. */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Sculpt the Core: a lumpy, heart-like cluster with two glowing hollows, cut
 * into the six shards of the opening sequence around the axis that faces the
 * viewer — seams that wander and meet at its heart. (When it opens later, it
 * parts differently: see buildPieces.)
 */
export function buildRockGeometry(detail: number) {
  const n1 = createNoise3D(11);
  const n2 = createNoise3D(29);
  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo);

  const lumps = (
    [
      [0.45, 0.78, 0.3, 0.62, 0.15],
      [-0.48, 0.74, 0.22, 0.62, 0.15],
      [0.86, 0.12, 0.3, 0.55, 0.1],
      [-0.84, 0.02, 0.24, 0.55, 0.1],
      [0.32, -0.62, 0.52, 0.5, 0.08],
      [-0.25, -0.5, -0.62, 0.55, 0.1],
      [0.05, 0.32, -0.92, 0.6, 0.11],
      [0.62, 0.42, -0.6, 0.5, 0.09],
      [-0.62, 0.5, -0.42, 0.5, 0.09],
      [-0.4, -0.2, 0.85, 0.42, 0.07],
    ] as const
  ).map(([x, y, z, s, a]) => ({ c: new THREE.Vector3(x, y, z).normalize(), cos: Math.cos(s), a }));
  const hollows = [
    { c: ZONE_DIRS[1], depth: 0.3, lo: 0.8, hi: 0.975, w: 1 },
    { c: new THREE.Vector3(-0.7, 0.35, -0.6).normalize(), depth: 0.16, lo: 0.89, hi: 0.985, w: 0.65 },
  ];

  // Shards: one seed each around the facing axis; each drifts in from its own side
  const seeds = SHARDS.map((sh) => {
    const a = THREE.MathUtils.degToRad(sh.angle);
    return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  });
  const dirs = seeds.map((s, i) => new THREE.Vector3(s.x, s.y, SHARDS[i].z).normalize());
  // the order in which the pieces form during the opening sequence (alternating sides)
  const order = [0, 3, 1, 4, 2, 5].map((k) => k / 6);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const cavity = new Float32Array(pos.count);
  const shard = new Float32Array(pos.count * 3);
  // each vertex's direction on the sphere it was sculpted from (for cutting the fragments, see buildPieces)
  const sphere = new Float32Array(pos.count * 3);
  const shardId = new Float32Array(pos.count);
  const shardOrder = new Float32Array(pos.count);
  const seam = new Float32Array(pos.count);
  const p = new THREE.Vector3();
  const w = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).normalize();
    p.toArray(sphere, i * 3);
    let r = 1 + 0.15 * fbm(n1, p.x * 1.1, p.y * 1.1, p.z * 1.1, 3);
    for (const l of lumps) r += l.a * smoothstep(l.cos, 1, p.dot(l.c));
    const ridge = 1 - Math.abs(n2(p.x * 2.7, p.y * 2.7, p.z * 2.7));
    r += 0.045 * (ridge * ridge - 0.45);
    r += 0.012 * n1(p.x * 7, p.y * 7, p.z * 7);
    let c = 0;
    for (const h of hollows) {
      const d = p.dot(h.c);
      r -= h.depth * smoothstep(h.lo, h.hi, d) * h.w * (0.8 + 0.4 * n2(p.x * 5, p.y * 5, p.z * 5));
      c = Math.max(c, smoothstep(h.lo - 0.07, h.hi, d) * h.w);
    }
    cavity[i] = c;

    // the shard: nearest seed around the axis, on a noise-warped direction so the seams wander and break irregularly
    const wx = 0.2 * n1(p.x * 1.8, p.y * 1.8, p.z * 1.8) + 0.07 * n2(p.x * 5.5, p.y * 5.5, p.z * 5.5);
    const wy = 0.2 * n1(p.x * 1.8 + 5, p.y * 1.8, p.z * 1.8) + 0.07 * n2(p.x * 5.5 + 3, p.y * 5.5, p.z * 5.5);
    w.set(p.x + wx, p.y + wy, 0);
    if (w.lengthSq() < 1e-6) w.set(1, 0, 0);
    w.normalize();
    let best = -2;
    let second = -2;
    let idx = 0;
    seeds.forEach((sd, k) => {
      const d = w.dot(sd);
      if (d > best) {
        second = best;
        best = d;
        idx = k;
      } else if (d > second) second = d;
    });
    dirs[idx].toArray(shard, i * 3);
    shardId[i] = idx;
    shardOrder[i] = order[idx];
    // near the axis every direction is close: the seams narrow into the heart
    seam[i] = (best - second) * Math.hypot(p.x, p.y);

    let x = p.x * r;
    let y = p.y * r * 1.06;
    let z = p.z * r * 0.84;
    if (y < 0) {
      const t = 1 + y * 0.2;
      x *= t;
      z *= t;
    }
    if (p.y > 0) y -= 0.1 * Math.exp(-(p.x * p.x) / 0.03) * smoothstep(0.2, 0.8, p.y);
    pos.setXYZ(i, x * 0.95, y * 0.95, z * 0.95);
  }
  geo.setAttribute("aCavity", new THREE.BufferAttribute(cavity, 1));
  geo.setAttribute("aShard", new THREE.BufferAttribute(shard, 3));
  geo.setAttribute("aSeam", new THREE.BufferAttribute(seam, 1));
  geo.setAttribute("aShardId", new THREE.BufferAttribute(shardId, 1));
  geo.setAttribute("aOrder", new THREE.BufferAttribute(shardOrder, 1));
  geo.computeVertexNormals();
  geo.userData.sphere = sphere;
  return geo;
}

/** One fragment of the opened Core: its solid piece of stone, and how it leaves. */
type Piece = {
  geometry: THREE.BufferGeometry;
  /** its centre (it turns about it), the way it travels, the axis it tilts on */
  centre: THREE.Vector3;
  dir: THREE.Vector3;
  axis: THREE.Vector3;
  /** the highest point of its outer face, where its module is named */
  top: THREE.Vector3;
  /** a few points of its broken edge, where small chips come loose */
  rim: THREE.Vector3[];
};

/**
 * Cut the opened Core out of the closed one (same stone, vertex for vertex, so
 * the switch from one to the other never shows): six solid fragments — each a
 * piece of the Core's skin with a broken underside and walls, as thick as
 * FRAGMENTS says — and the body they come out of, left with a socket where
 * each one was. Outlines wander with noise; every fragment stays one piece
 * and the body always keeps a strip of stone between two of them.
 */
function buildPieces(base: THREE.BufferGeometry) {
  // a copy: the cut lines are smoothed below, the closed rock keeps its own
  const pos = (base.attributes.position as THREE.BufferAttribute).clone();
  const nrm = base.attributes.normal as THREE.BufferAttribute;
  const cav = base.attributes.aCavity as THREE.BufferAttribute;
  const sphere = base.userData.sphere as Float32Array;
  const index = base.index!.array;
  const n = pos.count;
  const tris = index.length / 3;
  const nA = createNoise3D(53);
  const nB = createNoise3D(71);
  const seeds = FRAGMENTS.map((f) => {
    const a = THREE.MathUtils.degToRad(f.angle);
    const t = THREE.MathUtils.degToRad(f.tilt);
    return new THREE.Vector3(Math.sin(t) * Math.cos(a), Math.sin(t) * Math.sin(a), Math.cos(t));
  });
  const reach = FRAGMENTS.map((f) => Math.cos(THREE.MathUtils.degToRad(f.size)));

  // Each vertex: which fragment's area it falls in (on a noise-warped direction, so outlines break irregularly) — or the body's
  const label = new Int8Array(n).fill(-1);
  const d = new THREE.Vector3();
  const w = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    d.fromArray(sphere, i * 3);
    w.set(
      d.x + 0.15 * nA(d.x * 2.3, d.y * 2.3, d.z * 2.3) + 0.03 * nB(d.x * 6, d.y * 6, d.z * 6),
      d.y + 0.15 * nA(d.x * 2.3 + 4.1, d.y * 2.3, d.z * 2.3) + 0.03 * nB(d.x * 6 + 2.3, d.y * 6, d.z * 6),
      d.z + 0.15 * nA(d.x * 2.3, d.y * 2.3 + 7.7, d.z * 2.3) + 0.03 * nB(d.x * 6, d.y * 6 + 5.1, d.z * 6),
    ).normalize();
    let best = -Infinity;
    let second = -Infinity;
    let k = -1;
    seeds.forEach((sd, j) => {
      const s = w.dot(sd) - reach[j];
      if (s > best) {
        second = best;
        best = s;
        k = j;
      } else if (s > second) second = s;
    });
    // inside an area, and clearly closer to it than to its neighbour: two fragments never touch
    if (best > 0 && best - second > 0.07) label[i] = k;
  }

  // Each triangle: the area most of its corners are in
  const tri = new Int8Array(tris);
  for (let t = 0; t < tris; t++) {
    const [a, b, c] = [label[index[t * 3]], label[index[t * 3 + 1]], label[index[t * 3 + 2]]];
    tri[t] = a === b || a === c ? a : b === c ? b : -1;
  }

  // Triangles sharing an edge
  const edges = new Map<number, number[]>();
  const edgeKey = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
  for (let t = 0; t < tris; t++)
    for (let e = 0; e < 3; e++) {
      const key = edgeKey(index[t * 3 + e], index[t * 3 + ((e + 1) % 3)]);
      const list = edges.get(key);
      if (list) list.push(t);
      else edges.set(key, [t]);
    }
  const neighbours = (t: number) => {
    const out: number[] = [];
    for (let e = 0; e < 3; e++) for (const o of edges.get(edgeKey(index[t * 3 + e], index[t * 3 + ((e + 1) % 3)]))!) if (o !== t) out.push(o);
    return out;
  };
  // Connected patches of one label
  const patches = (lab: number) => {
    const seen = new Uint8Array(tris);
    const out: number[][] = [];
    for (let t = 0; t < tris; t++) {
      if (tri[t] !== lab || seen[t]) continue;
      const patch = [t];
      seen[t] = 1;
      for (let q = 0; q < patch.length; q++)
        for (const o of neighbours(patch[q]))
          if (tri[o] === lab && !seen[o]) {
            seen[o] = 1;
            patch.push(o);
          }
      out.push(patch);
    }
    return out.sort((p, q) => q.length - p.length);
  };
  // every fragment is one piece (stray islands go back to the body)…
  FRAGMENTS.forEach((_, k) => patches(k).slice(1).forEach((p) => p.forEach((t) => (tri[t] = -1))));
  // …and has no holes (small islands of body inside it become part of it)
  for (const p of patches(-1).slice(1)) {
    const k = p.flatMap(neighbours).map((o) => tri[o]).find((l) => l >= 0);
    if (k !== undefined) p.forEach((t) => (tri[t] = k));
  }

  // The broken edges: between a fragment and the body
  const rimEdges: [number, number][][] = FRAGMENTS.map(() => []);
  for (let t = 0; t < tris; t++) {
    const k = tri[t];
    if (k < 0) continue;
    for (let e = 0; e < 3; e++) {
      const a = index[t * 3 + e];
      const b = index[t * 3 + ((e + 1) % 3)];
      if (edges.get(edgeKey(a, b))!.some((o) => tri[o] !== k)) rimEdges[k].push([a, b]);
    }
  }
  // The cut follows the mesh's triangles, a staircase: smooth each broken edge along itself (keeping it on
  // the surface), so a fragment's outline reads as a clean break, not a row of teeth. The body's socket and
  // the fragment share these vertices, so they still fit together exactly.
  const rimNext = new Map<number, number[]>();
  for (const list of rimEdges)
    for (const [a, b] of list) {
      (rimNext.get(a) ?? rimNext.set(a, []).get(a)!).push(b);
      (rimNext.get(b) ?? rimNext.set(b, []).get(b)!).push(a);
    }
  const rimIds = [...rimNext.keys()];
  const next = new Float32Array(n * 3);
  const avg = new THREE.Vector3();
  const nbp = new THREE.Vector3();
  for (let pass = 0; pass < 4; pass++) {
    for (const i of rimIds) {
      const nb = rimNext.get(i)!;
      avg.set(0, 0, 0);
      let len = 0;
      for (const j of nb) {
        nbp.fromBufferAttribute(pos, j);
        avg.add(nbp);
        len += nbp.length();
      }
      avg.divideScalar(nb.length);
      nbp.fromBufferAttribute(pos, i);
      const r = (nbp.length() + len / nb.length) / 2;
      nbp.lerp(avg, 0.5).setLength(r).toArray(next, i * 3);
    }
    for (const i of rimIds) pos.setXYZ(i, next[i * 3], next[i * 3 + 1], next[i * 3 + 2]);
  }

  // How far each vertex of the skin is from a broken edge (its outline glows) — rim points binned in a grid
  const CELL = 0.2;
  const grid = new Map<string, number[]>();
  const cellKey = (x: number, y: number, z: number) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
  for (const i of rimIds) {
    const key = cellKey(pos.getX(i), pos.getY(i), pos.getZ(i));
    (grid.get(key) ?? grid.set(key, []).get(key)!).push(pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  const seam = new Float32Array(n).fill(1);
  const near = Math.cos(THREE.MathUtils.degToRad(Math.max(...FRAGMENTS.map((f) => f.size)) + 18));
  for (let i = 0; i < n; i++) {
    d.fromArray(sphere, i * 3);
    if (!seeds.some((sd) => d.dot(sd) > near)) continue;
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    const cz = Math.floor(z / CELL);
    let m = 0.04;
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++)
        for (let oz = -1; oz <= 1; oz++) {
          const pts = grid.get(`${cx + ox},${cy + oy},${cz + oz}`);
          if (!pts) continue;
          for (let j = 0; j < pts.length; j += 3) {
            const dx = pts[j] - x;
            const dy = pts[j + 1] - y;
            const dz = pts[j + 2] - z;
            const dd = dx * dx + dy * dy + dz * dz;
            if (dd < m) m = dd;
          }
        }
    seam[i] = Math.sqrt(m);
  }

  // How deep each fragment's stone goes under a vertex: its own thickness, broken unevenly
  const inner = (i: number, k: number, out: THREE.Vector3) => {
    d.fromArray(sphere, i * 3);
    const f = 0.72 + 0.56 * (0.5 + 0.5 * nB(d.x * 3.2 + k, d.y * 3.2, d.z * 3.2));
    return out.fromBufferAttribute(pos, i).multiplyScalar(1 - FRAGMENTS[k].depth * f);
  };

  // Writing triangles: position, normal and what the shader needs to know about each corner
  const writer = () => {
    const v = { pos: [] as number[], nrm: [] as number[], cav: [] as number[], seam: [] as number[], id: [] as number[], broken: [] as number[], depth: [] as number[], socket: [] as number[] };
    const corner = (p: THREE.Vector3, nr: THREE.Vector3, c: number, s: number, id: number, broken: number, depth: number, socket: number) => {
      v.pos.push(p.x, p.y, p.z);
      v.nrm.push(nr.x, nr.y, nr.z);
      v.cav.push(c);
      v.seam.push(s);
      v.id.push(id);
      v.broken.push(broken);
      v.depth.push(depth);
      v.socket.push(socket);
    };
    const build = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(v.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(v.nrm, 3));
      g.setAttribute("aCavity", new THREE.Float32BufferAttribute(v.cav, 1));
      g.setAttribute("aSeam", new THREE.Float32BufferAttribute(v.seam, 1));
      g.setAttribute("aShardId", new THREE.Float32BufferAttribute(v.id, 1));
      g.setAttribute("aBroken", new THREE.Float32BufferAttribute(v.broken, 1));
      g.setAttribute("aDepth", new THREE.Float32BufferAttribute(v.depth, 1));
      g.setAttribute("aSocket", new THREE.Float32BufferAttribute(v.socket, 1));
      return g;
    };
    return { corner, build };
  };
  const P = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const N = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const flat = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => N.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
  /** the skin: the Core's own surface, as it is */
  const skin = (wr: ReturnType<typeof writer>, t: number, id: number) => {
    for (let e = 0; e < 3; e++) {
      const i = index[t * 3 + e];
      wr.corner(P[0].fromBufferAttribute(pos, i), N.fromBufferAttribute(nrm, i), cav.getX(i), seam[i], id, 0, 0, 0);
    }
  };
  /** the broken stone under a fragment's area: its underside / the socket's floor, and its walls */
  const broken = (wr: ReturnType<typeof writer>, k: number, socket: number) => {
    for (let t = 0; t < tris; t++) {
      if (tri[t] !== k) continue;
      const [a, b, c] = [index[t * 3], index[t * 3 + 1], index[t * 3 + 2]];
      inner(a, k, P[0]);
      inner(b, k, P[1]);
      inner(c, k, P[2]);
      flat(P[0], P[1], P[2]);
      for (const p of [P[0], P[1], P[2]]) wr.corner(p, N, 0, 1, k, 1, 1, socket);
    }
    for (const [a, b] of rimEdges[k]) {
      P[0].fromBufferAttribute(pos, a);
      P[1].fromBufferAttribute(pos, b);
      inner(b, k, P[2]);
      inner(a, k, P[3]);
      flat(P[0], P[1], P[2]);
      const quad: [THREE.Vector3, number][] = [[P[0], 0], [P[1], 0], [P[2], 1], [P[0], 0], [P[2], 1], [P[3], 1]];
      for (const [p, depth] of quad) wr.corner(p, N, 0, 1, k, 1, depth, socket);
    }
  };

  // The body: its skin, and a socket where each fragment was
  const bw = writer();
  for (let t = 0; t < tris; t++) if (tri[t] < 0) skin(bw, t, -1);
  FRAGMENTS.forEach((_, k) => broken(bw, k, 1));

  // The fragments
  const z = new THREE.Vector3(0, 0, 1);
  const pieces: Piece[] = FRAGMENTS.map((f, k) => {
    const fw = writer();
    const centre = new THREE.Vector3();
    const top = new THREE.Vector3();
    let count = 0;
    let high = -Infinity;
    for (let t = 0; t < tris; t++) {
      if (tri[t] !== k) continue;
      skin(fw, t, k);
      for (let e = 0; e < 3; e++) {
        P[0].fromBufferAttribute(pos, index[t * 3 + e]);
        centre.add(P[0]);
        count++;
        const h = P[0].dot(seeds[k]);
        if (h > high) {
          high = h;
          top.copy(P[0]);
        }
      }
    }
    broken(fw, k, 0);
    centre.divideScalar(Math.max(1, count));
    // it travels outwards, a little off its own axis; it tilts away as if pried loose
    const around = new THREE.Vector3().crossVectors(z, seeds[k]).normalize();
    const dir = seeds[k].clone().addScaledVector(around, Math.tan(THREE.MathUtils.degToRad(f.drift))).normalize();
    const axis = new THREE.Vector3().crossVectors(dir, z).normalize().addScaledVector(around, 0.5 * Math.sign(f.turn)).normalize();
    const rim = rimEdges[k].filter((_, j) => j % Math.max(1, Math.floor(rimEdges[k].length / 5)) === 0).map(([a]) => new THREE.Vector3().fromBufferAttribute(pos, a));
    return { geometry: fw.build(), centre, dir, axis, top: top.multiplyScalar(1.03), rim };
  });
  return { body: bw.build(), pieces };
}

/** Word "SYXORIA" as a texture, drawn in the page's display face. */
function wordmarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-sora").trim() || "sans-serif";
  const text = "SYXORIA";
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `200 280px ${family}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    const spacing = 60;
    const widths = [...text].map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    let x = (canvas.width - total) / 2;
    [...text].forEach((ch, i) => {
      ctx.fillText(ch, x, canvas.height / 2 + 10);
      x += widths[i] + spacing;
    });
    tex.needsUpdate = true;
  };
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  draw();
  document.fonts?.ready.then(draw).catch(() => {});
  return tex;
}

type Node = {
  dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  link: THREE.Mesh<THREE.BufferGeometry, LineMat>;
  /** eased "pointed at", 0..1 */
  hi: number;
};

type Chip = { base: THREE.Vector3; drift: number; size: number; axis: THREE.Vector3; spin: number; delay: number };

export class CoreScene {
  state: CoreState;
  readonly ready: Promise<void>;

  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private final: ShaderPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 160);
  private timer = new THREE.Timer();
  private raf = 0;
  private running = false;
  /** false until shaders finish compiling in the background — rendering earlier would compile them synchronously and freeze the page */
  private compiled = false;
  /** a blank frame (the Core not yet revealed) is already on screen */
  private blank = false;
  private time = 0;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private maxDpr: number;
  private frameTimes: number[] = [];
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private pointerActive = false;
  private raycaster = new THREE.Raycaster();
  private sphere = new THREE.Sphere();
  private probe = new THREE.Vector4(0, 0, 1, 0);
  private zones = ZONE_DIRS.map((d) => new THREE.Vector4(d.x, d.y, d.z, 0));
  /** how lit each fragment is (eased "explored", 0..1) — read by the shaders */
  private petalHi = FRAGMENTS.map(() => 0);
  private hoverPetal = -1;
  private hits: THREE.Intersection[] = [];
  private opts: Required<Omit<CoreSceneOptions, "state" | "onFrame" | "rockGeometry" | "screen">> & Pick<CoreSceneOptions, "onFrame">;
  private rockGeometry?: THREE.BufferGeometry;

  /** the Core's light, shared by reference by every material that uses it (see applyLight) */
  private light = {
    uHeat0: { value: new THREE.Color() },
    uHeat1: { value: new THREE.Color() },
    uHeat2: { value: new THREE.Color() },
    uHeat3: { value: new THREE.Color() },
    uRimColor: { value: new THREE.Color() },
    uSpill: { value: new THREE.Color() },
  };
  private colors = {
    edge: new THREE.Color(),
    vitrine: new THREE.Color(),
    node: new THREE.Color(),
    nodeLit: new THREE.Color(),
    line: new THREE.Color(),
  };

  /** the whole Core: closed, and the shards of the opening sequence */
  private rock!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  /** the opened Core: its body and six fragments (built in prepare, see buildPieces) */
  private parts = new THREE.Group();
  private pieceMat!: THREE.ShaderMaterial;
  private pieces: (Piece & { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> })[] = [];
  private coreGroup = new THREE.Group();
  /** everything that turns with the Core */
  private body = new THREE.Group();
  private halos: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private embers!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private chips!: THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private chipData: Chip[] = [];
  private dust!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private stars!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private floor!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private plinth!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private plinthLights: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
  private plate!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  private plinthGroup = new THREE.Group();
  private vitrine = new THREE.Group();
  private vitrineEdges: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  private vitrineTop: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  private panes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private zonePoints = ZONE_DIRS.map(() => new THREE.Object3D());
  private modulePoints = FRAGMENTS.map(() => new THREE.Object3D());
  private nodeGroup = new THREE.Group();
  private nodes: Node[] = [];
  /** the pulse sent down a tool's wire when it is pointed at */
  private shot = { node: -1, t: 1, last: -1 };
  /** a brief response of the Core when a pulse reaches it */
  private flash = 0;
  private wordmark!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  // the product monitor (HTML in 3D)
  private css?: CSS3DRenderer;
  private cssScene?: THREE.Scene;
  private monitor?: THREE.Group;
  private monitorFront?: HTMLElement;
  /** the lid, hinged on the base: closed (π/2) → open (-LAPTOP.lean) */
  private lid?: THREE.Group;
  /** the laptop's visual centre (lid top ↔ base front), in its own scaled-1 frame, when open */
  private laptopMid = new THREE.Vector3();
  /** its size on screen, in CSS px at scale 1: width and height */
  private laptopExtent = new THREE.Vector2();
  private monitorParts: HTMLElement[] = [];
  private screenShown = false;
  private screenFade = "";
  private besideQ = new THREE.Quaternion();
  private euler = new THREE.Euler();

  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private tmp3 = new THREE.Vector3();
  private tmp4 = new THREE.Vector3();
  private anchors: CoreAnchors;

  constructor(private canvas: HTMLCanvasElement, options: CoreSceneOptions = {}) {
    this.opts = {
      quality: options.quality ?? "high",
      interactive: options.interactive ?? true,
      reducedMotion: options.reducedMotion ?? false,
      nodeCount: options.nodeCount ?? 8,
      onFrame: options.onFrame,
    };
    this.state = options.state ?? { ...DEFAULT_STATE };
    this.rockGeometry = options.rockGeometry;
    const low = this.opts.quality === "low";
    this.maxDpr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
    this.dpr = this.maxDpr;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    // Clear to true black: the page colour is laid back in, in display space, by the final pass.
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.dpr);

    this.scene.add(this.camera);
    this.build(low);
    this.applyLight();
    if (options.screen) this.buildMonitor(options.screen);

    // Multisampled: clean edges on the Core's silhouette, its fragments and the fine wires (the canvas
    // itself is not antialiased — the scene is drawn into this target, then post-processed)
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: low ? 2 : 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.5, 0.72);
    this.composer.addPass(this.bloom);
    const output = new OutputPass();
    this.composer.addPass(output);
    this.final = new ShaderPass(S.finalPass);
    this.composer.addPass(this.final);

    this.anchors = {
      modules: FRAGMENTS.map(() => ({ x: 0, y: 0, alpha: 0 })),
      hoverModule: -1,
      nodes: this.nodes.map(() => ({ x: 0, y: 0, alpha: 0 })),
      zones: this.zonePoints.map(() => ({ x: 0, y: 0, alpha: 0 })),
      core: { x: 0, y: 0, alpha: 0, r: 0 },
    };

    const rect = canvas.getBoundingClientRect();
    this.setSize(rect.width || 1, rect.height || 1);
    this.ready = this.prepare(output);
  }

  /** Colours every material with the Core's light (CORE_LIGHT in look.ts). */
  private applyLight() {
    const p = CORE_LIGHT;
    p.heat.forEach((c, i) => this.light[`uHeat${i as 0 | 1 | 2 | 3}`].value.setRGB(c[0], c[1], c[2]));
    this.light.uRimColor.value.setRGB(...p.rim);
    this.light.uSpill.value.setRGB(...p.spill);
    this.colors.edge.setRGB(...p.edge);
    this.colors.vitrine.setRGB(...p.vitrine);
    this.colors.node.setRGB(...p.node);
    this.colors.nodeLit.setRGB(...p.nodeLit);
    this.colors.line.setRGB(...p.line);
    this.halos[0].material.uniforms.uColor.value.setRGB(...p.haloWide);
    this.halos[1].material.uniforms.uColor.value.setRGB(...p.haloTight);
    this.halos[2].material.uniforms.uColor.value.setRGB(...p.haloVeil);
    this.nodes.forEach((n) => {
      n.link.material.uniforms.uWarm.value.copy(this.colors.line);
      n.halo.material.uniforms.uColor.value.copy(color(p.node));
    });
    const em = this.embers.material.uniforms;
    em.uEmber0.value.setRGB(...p.ember[0]);
    em.uEmber1.value.setRGB(...p.ember[1]);
    this.floor.material.uniforms.uPool.value.setRGB(...p.pool);
    this.plinth.material.uniforms.uGlow.value.copy(color(p.edge));
    this.panes.forEach((m) => m.material.uniforms.uTint.value.setRGB(...p.glass));
  }

  /**
   * Gets every shader ready without freezing the page (a ~300ms+ stall on
   * integrated GPUs otherwise): compile in the background, then "warm up" each
   * distinct shader with one tiny draw per task — on Windows the browser
   * finishes each shader for its output format at its first real draw, which
   * background compilation cannot cover.
   */
  private async prepare(output: OutputPass) {
    try {
      await nextTask();
      this.buildParts();
      await nextTask();
      // compile against the composer buffer the scene really renders into (variants depend on the target)
      this.renderer.setRenderTarget(this.composer.readBuffer);
      const scene = this.renderer.compileAsync(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      await nextTask();
      const passes = this.passQuads(output);
      await Promise.all([scene, ...passes.compile]);
      await this.warmUp(passes);
      passes.dispose();
      // the first full frame (bloom chain at full size) gets a task of its own
      await nextTask();
    } catch {
      // fall through: the first frame will simply compile what is missing
    }
    this.renderer.setRenderTarget(null);
    this.compiled = true;
    this.update(0);
    this.composer.render();
  }

  /** One small draw per distinct shader, each in its own task. */
  private async warmUp(passes: ReturnType<CoreScene["passQuads"]>) {
    const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
    const seen = new Set<string>();
    const objects: THREE.Object3D[] = [];
    this.scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (!mat || Array.isArray(mat)) return;
      const sm = mat as THREE.ShaderMaterial;
      const key = `${mat.type}|${sm.vertexShader ?? ""}|${sm.fragmentShader ?? ""}|${Object.keys(sm.defines ?? {}).join()}|${(o as THREE.Points).isPoints ? "p" : ""}${(o as THREE.InstancedMesh).isInstancedMesh ? "i" : ""}${(o as THREE.Mesh).geometry?.type ?? ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      objects.push(o);
    });
    const draw = (obj: THREE.Object3D, camera: THREE.Camera, rt: THREE.WebGLRenderTarget | null) => {
      const culled = obj.frustumCulled;
      const visible = obj.visible;
      obj.frustumCulled = false;
      obj.visible = true;
      this.renderer.setRenderTarget(rt);
      this.renderer.render(obj, camera);
      obj.frustumCulled = culled;
      obj.visible = visible;
    };
    try {
      for (const obj of objects) {
        draw(obj, this.camera, target);
        await nextTask();
      }
      for (const quad of passes.offscreen.children) {
        draw(quad, passes.camera, target);
        await nextTask();
      }
      for (const quad of passes.onscreen.children) draw(quad, passes.camera, null);
    } finally {
      this.renderer.setRenderTarget(null);
      target.dispose();
    }
  }

  /**
   * The post-processing shaders (bloom blur chain, tone mapping, final pass),
   * each on a full-screen quad so they can be compiled and warmed like the scene.
   */
  private passQuads(output: OutputPass) {
    // OutputPass picks its defines on first render; set them now so the variant matches.
    const op = output as unknown as { _outputColorSpace: string; _toneMapping: THREE.ToneMapping };
    op._outputColorSpace = this.renderer.outputColorSpace;
    op._toneMapping = this.renderer.toneMapping;
    output.material.defines = { SRGB_TRANSFER: "", ACES_FILMIC_TONE_MAPPING: "" };

    const quad = new THREE.PlaneGeometry(2, 2);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const offscreen = new THREE.Scene();
    const onscreen = new THREE.Scene();
    const add = (scene: THREE.Scene, material: THREE.Material) => {
      const m = new THREE.Mesh(quad, material);
      m.frustumCulled = false;
      scene.add(m);
    };
    const b = this.bloom;
    [b.materialHighPassFilter, ...b.separableBlurMaterials, b.compositeMaterial, b.blendMaterial, output.material].forEach((m) => add(offscreen, m));
    add(onscreen, this.final.material);

    // offscreen passes render into half-float targets; the final pass renders to the canvas
    this.renderer.setRenderTarget(this.composer.readBuffer);
    const a = this.renderer.compileAsync(offscreen, camera);
    this.renderer.setRenderTarget(null);
    const c = this.renderer.compileAsync(onscreen, camera);
    return { compile: [a, c], offscreen, onscreen, camera, dispose: () => quad.dispose() };
  }

  /* ------------------------------------------------------------ building */

  private build(low: boolean) {
    const rand = mulberry32(5);
    const L = this.light;

    // The rock
    const rockMat = new THREE.ShaderMaterial({
      vertexShader: S.rockVert,
      fragmentShader: S.rockFrag,
      uniforms: {
        ...L,
        uTime: { value: 0 },
        uAwaken: { value: 0 },
        uOpen: { value: 0 },
        uScatter: { value: 0 },
        uTease: { value: 1 },
        uProbe: { value: this.probe },
        uZones: { value: this.zones },
        uPetalHi: { value: this.petalHi },
        uFocus: { value: 0 },
        uBump: { value: 0.006 },
        uKeyDir: { value: KEY_DIR },
        uKeyColor: { value: new THREE.Color(1.0, 0.9, 0.78) },
        uFillDir: { value: new THREE.Vector3(0.85, 0.1, 0.3).normalize() },
        uFillColor: { value: new THREE.Color(0.22, 0.26, 0.34) },
      },
      // scattered shards are open shells: their inner side must render too
      side: THREE.DoubleSide,
    });
    this.rock = new THREE.Mesh(this.rockGeometry ?? buildRockGeometry(low ? ROCK_DETAIL.low : ROCK_DETAIL.high), rockMat);
    // shards move outside the rest bounds during the opening sequence
    this.rock.frustumCulled = false;
    this.body.add(this.rock);
    // the opened Core: the same light and stone, its own shaders for the parts (and its own opening)
    this.pieceMat = new THREE.ShaderMaterial({
      vertexShader: S.pieceVert,
      fragmentShader: S.rockFrag,
      defines: { PIECES: "" },
      uniforms: { ...rockMat.uniforms, uOpen: { value: 0 } },
      side: THREE.DoubleSide,
    });
    this.parts.visible = false;
    this.body.add(this.parts);

    // Halos, layered soft light rather than one strong glow (all follow how awake the Core is):
    // a wide atmosphere, a tight breath, and a faint far veil — the air around the Core holding its light
    const wide = haloMesh(2.4);
    wide.scale.set(6.5, 6.5, 1);
    const tight = haloMesh(3.2);
    tight.scale.set(3.1, 3.1, 1);
    const veil = haloMesh(2);
    veil.scale.set(10, 10, 1);
    this.halos = [wide, tight, veil];
    this.halos.forEach((h) => this.coreGroup.add(h));

    // Embers rise around the awake Core
    {
      const n = low ? 90 : 180;
      const seeds = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        seeds[i * 4] = 0.95 + Math.pow(rand(), 0.7) * 1.9;
        seeds[i * 4 + 1] = rand() * TAU;
        seeds[i * 4 + 2] = rand() * 4.6;
        seeds[i * 4 + 3] = 0.25 + rand() * 0.9;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
      this.embers = new THREE.Points(
        g,
        new THREE.ShaderMaterial({
          vertexShader: S.emberVert,
          fragmentShader: S.emberFrag,
          uniforms: {
            uTime: { value: 0 },
            uPixel: { value: 1 },
            uHeight: { value: 4.6 },
            uSpread: { value: 1 },
            uIntensity: { value: 0 },
            uEmber0: { value: new THREE.Color() },
            uEmber1: { value: new THREE.Color() },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.embers.frustumCulled = false;
      this.coreGroup.add(this.embers);
    }

    // The brain's zones and the modules' fragments: a point on the surface of each, for their words
    ZONE_DIRS.forEach((d, i) => {
      this.zonePoints[i].position.copy(d).multiplyScalar(1.08);
      this.body.add(this.zonePoints[i]);
    });
    this.modulePoints.forEach((m) => this.body.add(m));

    // Chips: small bits of stone that come loose from the fragments' broken edges as the Core opens (placed in buildParts)
    {
      const n = low ? 10 : 18;
      let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 0);
      g = mergeVertices(g);
      const gp = g.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < gp.count; i++) {
        v.fromBufferAttribute(gp, i);
        v.multiplyScalar(0.7 + rand() * 0.55);
        gp.setXYZ(i, v.x, v.y * (0.6 + rand() * 0.5), v.z);
      }
      g = g.toNonIndexed();
      this.chips = new THREE.InstancedMesh(
        g,
        new THREE.ShaderMaterial({
          vertexShader: S.debrisVert,
          fragmentShader: S.debrisFrag,
          uniforms: { ...L, uKeyDir: { value: KEY_DIR }, uKeyColor: { value: new THREE.Color(1.0, 0.9, 0.78) }, uIntensity: { value: 1 } },
        }),
        n,
      );
      this.chips.frustumCulled = false;
      this.chips.count = 0;
      this.body.add(this.chips);
    }

    this.coreGroup.add(this.body);
    this.coreGroup.position.y = CORE_Y;
    this.scene.add(this.coreGroup);

    // Tools, wired to the Core: a ring around it, facing the viewer, each joined by a root that leaves its surface
    {
      const n = this.opts.nodeCount;
      const depth = [0.35, -0.25, 0.3, -0.3, 0.4, -0.2, 0.25, -0.35];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.PI / n;
        const p = new THREE.Vector3(Math.cos(a) * 3.1, Math.sin(a) * 1.72, depth[i % depth.length]);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.86, 0.8), transparent: true }));
        dot.position.copy(p);
        const halo = haloMesh(2.8);
        halo.position.copy(p);
        // the root leaves the Core's surface facing its tool, then travels only outwards, with one gentle sway
        const flat = new THREE.Vector3(p.x, p.y, 0).normalize();
        const exit = flat.clone().multiplyScalar(0.98).setZ(0.2);
        const end = p.clone().multiplyScalar(0.985);
        const sway = new THREE.Vector3(-flat.y, flat.x, 0).multiplyScalar(0.22 * (i % 2 ? 1 : -1));
        const curve = new THREE.CatmullRomCurve3([
          flat.clone().multiplyScalar(0.45),
          exit,
          exit.clone().lerp(end, 0.36).add(sway),
          exit.clone().lerp(end, 0.72).addScaledVector(sway, 0.55),
          end,
        ]);
        const link = new THREE.Mesh(taperedTube(curve, 120, 0.03, 0.007, low ? 6 : 10), lineMaterial());
        link.frustumCulled = false;
        this.nodeGroup.add(dot, halo, link);
        this.nodes.push({ dot, halo, link, hi: 0 });
      }
      this.coreGroup.add(this.nodeGroup);
    }

    // Stars: the Core floats in a much larger space
    {
      const n = low ? 1400 : 2800;
      const p = new Float32Array(n * 3);
      const seeds = new Float32Array(n * 4);
      const v = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        v.set(rand() * 2 - 1, (rand() * 2 - 1) * 0.75, rand() * 2 - 1);
        if (v.lengthSq() < 1e-4) v.set(0, 0, -1);
        v.normalize().multiplyScalar(26 + rand() * 30);
        p.set([v.x, v.y, v.z], i * 3);
        seeds.set([rand(), rand(), rand(), rand()], i * 4);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
      this.stars = new THREE.Points(
        g,
        new THREE.ShaderMaterial({
          vertexShader: S.starVert,
          fragmentShader: S.starFrag,
          uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uIntensity: { value: 0 } },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.stars.frustumCulled = false;
      this.scene.add(this.stars);
    }

    // Dust: the air close to the Core
    {
      const n = low ? 400 : 900;
      const p = new Float32Array(n * 3);
      const seeds = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        p[i * 3] = (rand() - 0.5) * 28;
        p[i * 3 + 1] = (rand() - 0.5) * 12;
        p[i * 3 + 2] = -18 + rand() * 26;
        seeds.set([rand(), rand(), rand(), 0.4 + rand()], i * 4);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
      this.dust = new THREE.Points(
        g,
        new THREE.ShaderMaterial({
          vertexShader: S.dustVert,
          fragmentShader: S.dustFrag,
          uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uIntensity: { value: 0 } },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.dust.frustumCulled = false;
      this.scene.add(this.dust);
    }

    // Floor: faint contour lines + a pool of the Core's light under it
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({
        vertexShader: S.floorVert,
        fragmentShader: S.floorFrag,
        uniforms: { uOpacity: { value: 1 }, uAwaken: { value: 0 }, uTime: { value: 0 }, uPool: { value: new THREE.Color() } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.floor.position.y = FLOOR_Y - 0.002;
    this.scene.add(this.floor);

    // Plinth: black marble, a quiet line of light along its edges, a lit plate on top — only for the vitrine at the end
    this.plinth = new THREE.Mesh(
      new RoundedBoxGeometry(PLINTH_W, PLINTH_H, PLINTH_W, 4, 0.025),
      new THREE.ShaderMaterial({
        vertexShader: S.plinthVert,
        fragmentShader: S.plinthFrag,
        uniforms: {
          uKeyDir: { value: KEY_DIR },
          uKeyColor: { value: new THREE.Color(1.0, 0.92, 0.82) },
          uGlow: { value: new THREE.Color() },
          uAwaken: { value: 0 },
          uTopY: { value: PLINTH_TOP },
          uOpacity: { value: 1 },
        },
        transparent: true,
      }),
    );
    this.plinth.position.y = FLOOR_Y + PLINTH_H / 2;
    this.plinthGroup.add(this.plinth);
    const edgeMat = () => new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const edge = (w: number, y: number, t = 0.012) => {
      const half = w / 2;
      for (const [x, z, sx, sz] of [
        [0, half, w, t],
        [0, -half, w, t],
        [half, 0, t, w],
        [-half, 0, t, w],
      ] as const) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, t, sz), edgeMat());
        m.position.set(x, y, z);
        this.plinthGroup.add(m);
        this.plinthLights.push(m);
      }
    };
    edge(PLINTH_W + 0.03, FLOOR_Y + 0.006, 0.014);
    edge(1.34, PLINTH_TOP + 0.004, 0.008);
    this.plate = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.004, 1.32), edgeMat());
    this.plate.position.y = PLINTH_TOP + 0.002;
    this.plinthGroup.add(this.plate);
    this.scene.add(this.plinthGroup);

    // Vitrine: fine edges + faint glass, rising around the Core at the end of the story
    {
      const VW = 2.12;
      const VH = 3.3;
      const half = VW / 2;
      for (const [x, z] of [
        [half, half],
        [-half, half],
        [half, -half],
        [-half, -half],
      ]) {
        const g = new THREE.BoxGeometry(0.01, VH, 0.01).translate(0, VH / 2, 0);
        const m = new THREE.Mesh(g, edgeMat());
        m.position.set(x, 0, z);
        this.vitrine.add(m);
        this.vitrineEdges.push(m);
      }
      for (const [x, z, sx, sz] of [
        [0, half, VW, 0.01],
        [0, -half, VW, 0.01],
        [half, 0, 0.01, VW],
        [-half, 0, 0.01, VW],
      ] as const) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.01, sz), edgeMat());
        m.position.set(x, VH, z);
        this.vitrine.add(m);
        this.vitrineTop.push(m);
      }
      const glassMat = () =>
        new THREE.ShaderMaterial({
          vertexShader: S.glassVert,
          fragmentShader: S.glassFrag,
          uniforms: { uOpacity: { value: 0 }, uTint: { value: new THREE.Color() } },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
      for (const [x, z, ry] of [
        [0, half, 0],
        [0, -half, Math.PI],
        [half, 0, Math.PI / 2],
        [-half, 0, -Math.PI / 2],
      ]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(VW, VH), glassMat());
        m.position.set(x, VH / 2, z);
        m.rotation.y = ry;
        this.vitrine.add(m);
        this.panes.push(m);
      }
      this.vitrine.position.y = PLINTH_TOP;
      this.scene.add(this.vitrine);
    }

    // Wordmark behind the Core
    this.wordmark = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 13 * (360 / 2048)),
      new THREE.MeshBasicMaterial({ map: wordmarkTexture(), transparent: true, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.54), opacity: 0 }),
    );
    this.wordmark.position.set(0, 0.55, -3.4);
    this.scene.add(this.wordmark);
  }

  /**
   * The opened Core (see buildPieces): its body, and each fragment as a mesh of
   * its own — moved as one piece, its module named at its top — plus the chips
   * that come loose from their broken edges.
   */
  private buildParts() {
    const { body, pieces } = buildPieces(this.rock.geometry);
    const main = new THREE.Mesh(body, this.pieceMat);
    main.frustumCulled = false;
    this.parts.add(main);
    this.pieces = pieces.map((pc, k) => {
      const mesh = new THREE.Mesh(pc.geometry, this.pieceMat);
      mesh.frustumCulled = false;
      this.modulePoints[k].position.copy(pc.top);
      mesh.add(this.modulePoints[k]);
      this.parts.add(mesh);
      return { ...pc, mesh };
    });
    const rand = mulberry32(17);
    const n = this.chips.instanceMatrix.count;
    for (let i = 0; i < n; i++) {
      const k = i % pieces.length;
      const rim = pieces[k].rim;
      if (!rim.length) continue;
      this.chipData.push({
        base: rim[Math.floor(rand() * rim.length)].clone(),
        drift: 0.25 + rand() * 0.55,
        size: 0.022 + rand() * 0.045,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spin: (rand() - 0.5) * 1.4,
        delay: FRAGMENTS[k].when + rand() * 0.2,
      });
    }
    this.chips.count = this.chipData.length;
  }

  /**
   * The product laptop, built in CSS 3D around the HTML front it is given (the
   * live dashboard + bezel): a lid with its back and edges, hinged on a base
   * with a keyboard and trackpad — so it reads at once as the real product, on
   * a real computer. It arrives closed and opens as it rises out of the Core.
   *
   *   group  placed by the scene (beside the Core → centre stage), scaled to CSS px
   *   pose   tips the laptop towards the viewer so its keyboard reads
   *   lid    hinged at the back of the base
   */
  private buildMonitor(front: HTMLElement) {
    const css = new CSS3DRenderer();
    const dom = css.domElement;
    dom.style.position = "absolute";
    dom.style.inset = "0";
    dom.style.pointerEvents = "none";
    this.canvas.parentElement?.appendChild(dom);
    this.css = css;
    this.cssScene = new THREE.Scene();
    const group = new THREE.Group();
    const pose = new THREE.Group();
    const lid = new THREE.Group();
    const { w, h, lid: d, deck: D, base: T } = LAPTOP;
    const part = (parent: THREE.Object3D, el: HTMLElement, x: number, y: number, z: number, rx = 0, ry = 0) => {
      el.style.backfaceVisibility = "hidden";
      const o = new CSS3DObject(el);
      o.position.set(x, y, z);
      o.rotation.set(rx, ry, 0);
      parent.add(o);
      if (el !== front) this.monitorParts.push(el);
      return o;
    };
    const div = (cls: string, width: number, height: number) => {
      const el = document.createElement("div");
      el.className = cls;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.setAttribute("aria-hidden", "true");
      return el;
    };

    // The base: its top (keyboard, trackpad, speakers), front lip and sides; the lid's hinge at its back
    const top = div("laptop-deck", w, D);
    const keys = document.createElement("div");
    keys.className = "laptop-keys";
    [14, 14, 13, 12, 12, 9].forEach((n, r) => {
      const row = document.createElement("div");
      row.className = "laptop-row";
      for (let i = 0; i < n; i++) {
        const k = document.createElement("span");
        // the long keys: tab, caps, shifts, return… and the space bar
        if (r === 5 && i === 4) k.style.flex = "5.6";
        else if ((r === 2 || r === 3) && (i === 0 || i === n - 1)) k.style.flex = "1.7";
        else if (r === 4 && (i === 0 || i === n - 1)) k.style.flex = "2.3";
        else if (r === 1 && i === n - 1) k.style.flex = "1.4";
        row.appendChild(k);
      }
      keys.appendChild(row);
    });
    top.appendChild(keys);
    const pad = document.createElement("div");
    pad.className = "laptop-trackpad";
    top.appendChild(pad);
    part(pose, top, 0, 0, D / 2, -Math.PI / 2);
    part(pose, div("laptop-lip", w, T), 0, -T / 2, D);
    part(pose, div("laptop-side", D, T), -w / 2, -T / 2, D / 2, 0, -Math.PI / 2);
    part(pose, div("laptop-side", D, T), w / 2, -T / 2, D / 2, 0, Math.PI / 2);

    // The lid: hinged at the back of the base, its screen at z = 0, its back behind
    lid.position.set(0, 1, d + 6);
    part(lid, front, 0, h / 2, 0);
    part(lid, div("laptop-lid-back", w, h), 0, h / 2, -d, 0, Math.PI);
    part(lid, div("laptop-lid-edge", w, d), 0, h, -d / 2, -Math.PI / 2);
    part(lid, div("laptop-lid-edge", d, h), -w / 2, h / 2, -d / 2, 0, -Math.PI / 2);
    part(lid, div("laptop-lid-edge", d, h), w / 2, h / 2, -d / 2, 0, Math.PI / 2);
    pose.add(lid);
    pose.rotation.x = LAPTOP.tip;
    group.add(pose);

    // Its visual centre and extent once open, so the scene can frame it (lid top ↔ base's front lip)
    lid.rotation.x = -LAPTOP.lean;
    group.updateMatrixWorld(true);
    const lidTop = new THREE.Vector3(0, h, 0).applyMatrix4(lid.matrixWorld);
    const lip = new THREE.Vector3(0, -T, D).applyMatrix4(pose.matrixWorld);
    this.laptopMid.addVectors(lidTop, lip).multiplyScalar(0.5);
    this.laptopExtent.set(w, lidTop.y - lip.y);

    front.style.visibility = "hidden";
    this.monitorParts.forEach((el) => (el.style.visibility = "hidden"));
    this.cssScene.add(group);
    this.monitor = group;
    this.monitorFront = front;
    this.lid = lid;
  }

  /* ------------------------------------------------------------ runtime */

  setSize(w: number, h: number) {
    this.w = Math.max(1, Math.round(w));
    this.h = Math.max(1, Math.round(h));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.w, this.h, false);
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(this.w, this.h);
    this.css?.setSize(this.w, this.h);
    // bloom at reduced resolution is softer and much cheaper
    this.bloom.resolution.set(this.w * 0.5, this.h * 0.5);
    this.camera.aspect = this.w / this.h;
    if (!this.running && this.compiled) {
      this.update(0);
      this.render();
    }
  }

  /** Pointer in -1..1 over the canvas (x right, y up); `active` false when it leaves. */
  setPointer(x: number, y: number, active = true) {
    this.pointer.set(x, y);
    this.pointerActive = active;
  }

  start() {
    if (this.running || !this.compiled) return;
    this.running = true;
    this.timer.reset();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.timer.update(now);
      const dt = Math.min(this.timer.getDelta(), 1 / 20);
      this.update(dt);
      // before the opening sequence shows anything, one blank frame is enough
      const hidden = this.state.intro < 0.001 && (this.state.scatter < 0.001 || this.state.tease < 0.001);
      if (hidden && this.blank) return;
      this.blank = hidden;
      this.render();
      this.adapt(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private render() {
    this.composer.render();
    if (this.css && this.cssScene && this.screenShown) this.css.render(this.cssScene, this.camera);
  }

  /** Drop resolution if the device cannot keep up. */
  private adapt(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 38 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.setSize(this.w, this.h);
    }
  }

  private update(dt: number) {
    const s = this.state;
    const rm = this.opts.reducedMotion;
    this.time += dt * (rm ? 0.35 : 1);
    const t = this.time;
    const k = s.intro;
    // heat eases off at the top so a fully awake Core keeps its dark mass
    const aw = s.awaken * (1.15 - 0.35 * s.awaken) * k;
    // frame-rate independent easing towards a target
    const ease = (rate: number) => (rm ? 1 : 1 - Math.exp(-dt * rate));
    const C = this.colors;

    // Camera
    this.pointerSmooth.lerp(this.pointerActive ? this.pointer : ORIGIN_2D, ease(2.5));
    const portrait = this.w / this.h < 1;
    // portrait: width is the limit; short screens also leave less room above the words
    const fit = portrait ? Math.pow(this.h / this.w, 0.6) * Math.sqrt(Math.max(1, 780 / this.h)) : 1;
    // the cursor turns the camera gently — except while the tools are wired: reaching for a logo must not move it
    const parallax = this.opts.interactive ? 1 - smoothstep(0, 0.6, s.network) : 0;
    const az = s.az + this.pointerSmooth.x * 0.05 * parallax;
    const el = s.el + this.pointerSmooth.y * 0.03 * parallax;
    const d = s.dist * fit;
    this.camera.position.set(s.tx + d * Math.cos(el) * Math.sin(az), s.ty + d * Math.sin(el), s.tz + d * Math.cos(el) * Math.cos(az));
    this.camera.lookAt(s.tx, s.ty, s.tz);
    this.camera.setViewOffset(this.w, this.h, -s.shiftX * this.w, s.shiftY * this.h, this.w, this.h);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // The Core: drifts on its own, or turns to face the viewer (and present a zone, or open towards them)
    const sc = s.scale * (0.82 + 0.18 * k);
    const bob = rm ? 0 : Math.sin(t * 0.9) * 0.03;
    this.coreGroup.position.y = CORE_Y + bob;
    // the tools stay anchored where they are: the Core floats, they do not
    this.nodeGroup.position.y = -bob / CORE_SIZE;
    this.coreGroup.scale.setScalar(CORE_SIZE);
    const drift = s.spin + (rm ? 0 : Math.sin(t * 0.17) * 0.28 + t * 0.012);
    this.body.rotation.y = drift + angleDelta(drift, s.az + s.turn) * s.face;
    this.body.rotation.x = (rm ? 0 : Math.sin(t * 0.13) * 0.05) * (1 - s.face);
    // Closed (and the opening sequence's shards): the whole rock. Opened: its body and six fragments, the same stone
    const opened = s.open * k > 0.001 && s.scatter < 0.01 && this.pieces.length > 0;
    this.rock.visible = !opened;
    this.parts.visible = opened;
    this.rock.scale.setScalar(sc);
    this.parts.scale.setScalar(sc);

    // Modules: each fragment leaves the body its own way; the one explored comes further out and lights
    const focus = s.modules > 0.5 ? Math.round(s.focus) : -1;
    const settled = smoothstep(0.3, 1, s.open);
    this.pieces.forEach((pc, i) => {
      const f = FRAGMENTS[i];
      this.petalHi[i] += ((i === focus ? 1 : 0) - this.petalHi[i]) * ease(6);
      const hi = this.petalHi[i] * settled;
      const o = fragmentOpen(f.when, s.open);
      // once out, each one breathes on its own rhythm
      const idle = rm ? 0 : Math.sin(t * (0.5 + 0.07 * i) + i * 1.7) * o;
      const q = pc.mesh.quaternion.setFromAxisAngle(pc.axis, f.turn * o * (1 + 0.3 * hi) + 0.03 * idle);
      // it turns about its own centre, and travels
      pc.mesh.position
        .copy(pc.centre)
        .applyQuaternion(q)
        .negate()
        .add(pc.centre)
        .addScaledVector(pc.dir, f.out * o + 0.17 * hi + 0.014 * idle);
    });
    this.rock.material.uniforms.uFocus.value = Math.max(0, ...this.petalHi) * settled;
    this.pieceMat.uniforms.uOpen.value = s.open * k;

    this.coreGroup.updateMatrixWorld(true);
    this.updateProbe(dt, sc);
    const ru = this.rock.material.uniforms;
    ru.uTime.value = t;
    ru.uAwaken.value = aw;
    ru.uScatter.value = s.scatter;
    ru.uTease.value = s.tease;
    this.zones[0].w = s.connect * k;
    this.zones[1].w = s.understand * k;
    this.zones[2].w = s.act * k;

    // chips come loose from the fragments' broken edges and drift as the Core opens
    this.chips.visible = s.open > 0.02 && s.scatter < 0.01 && this.chipData.length > 0;
    if (this.chips.visible) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const v = this.tmp4;
      const scl = new THREE.Vector3();
      this.chipData.forEach((c, i) => {
        const o = smoothstep(c.delay, c.delay + 0.65, s.open);
        v.copy(c.base).multiplyScalar(1 + o * c.drift);
        v.z += o * 0.25 * c.drift;
        v.y += rm ? 0 : Math.sin(t * 0.6 + i) * 0.03 * o;
        q.setFromAxisAngle(c.axis, c.spin * (o * 2 + t * 0.15));
        scl.setScalar(c.size * smoothstep(0, 0.25, o));
        m.compose(v, q, scl);
        this.chips.setMatrixAt(i, m);
      });
      this.chips.instanceMatrix.needsUpdate = true;
      this.chips.material.uniforms.uIntensity.value = k;
    }

    // halos are screen-filling up close: fade them as the camera approaches
    const near = smoothstep(3.5, 10, this.camera.position.distanceTo(this.coreGroup.position));
    this.flash = Math.max(0, this.flash - dt * 1.6);
    const glow = aw + 0.2 * s.open + 0.08 * s.understand + 0.35 * this.flash;
    this.halos[0].material.uniforms.uIntensity.value = (0.04 + 0.16 * glow) * k * (0.25 + 0.75 * near);
    this.halos[1].material.uniforms.uIntensity.value = (0.03 + 0.34 * glow) * k * (0.9 + 0.1 * Math.sin(t * 1.25)) * (0.45 + 0.55 * near);
    this.halos[2].material.uniforms.uIntensity.value = (0.018 + 0.04 * glow) * k * (0.15 + 0.85 * near);
    this.halos.forEach((h) => (h.visible = k > 0.001));

    const em = this.embers.material.uniforms;
    em.uTime.value = t;
    em.uPixel.value = this.dpr * (this.h / 900);
    em.uIntensity.value = s.embers * k * aw * 0.6;
    this.embers.visible = s.embers * aw > 0.01;

    const du = this.dust.material.uniforms;
    du.uTime.value = t;
    du.uPixel.value = this.dpr * (this.h / 900);
    du.uIntensity.value = s.dust * k * 0.8;

    const st = this.stars.material.uniforms;
    st.uTime.value = t;
    st.uPixel.value = this.dpr * Math.max(0.8, this.h / 900);
    st.uIntensity.value = s.stars * k * 1.7;
    this.stars.visible = s.stars * k > 0.001;
    this.stars.rotation.y = rm ? 0 : t * 0.004;

    this.floor.material.uniforms.uOpacity.value = s.floor * k;
    this.floor.material.uniforms.uAwaken.value = aw;
    this.floor.material.uniforms.uTime.value = t;
    this.floor.visible = s.floor > 0.001;

    // Plinth and its (quiet) light: only with the vitrine
    const pv = s.plinth * k;
    this.plinthGroup.visible = pv > 0.001;
    this.plinthGroup.position.y = -0.35 * (1 - smoothstep(0, 1, s.plinth));
    this.plinth.material.uniforms.uAwaken.value = aw;
    this.plinth.material.uniforms.uOpacity.value = pv;
    // opaque while solid so nothing shows through it; blended only while fading
    this.plinth.material.transparent = pv < 0.999;
    const lineK = pv * k * (0.05 + 0.16 * aw);
    this.plinthLights.forEach((m) => m.material.color.copy(C.edge).multiplyScalar(lineK));
    this.plate.material.color.copy(C.line).multiplyScalar(pv * k * aw * 0.02);

    // Vitrine: edges rise from the plinth, then the top closes, then the glass
    const v = s.vitrine;
    this.vitrine.visible = v > 0.001;
    const rise = smoothstep(0, 0.6, v);
    const close = smoothstep(0.5, 0.85, v);
    const glass = smoothstep(0.7, 1, v);
    this.vitrineEdges.forEach((m) => {
      m.scale.y = Math.max(0.001, rise);
      m.material.color.copy(C.vitrine).multiplyScalar(0.34 * k);
    });
    this.vitrineTop.forEach((m) => m.material.color.copy(C.vitrine).multiplyScalar(0.34 * close * k));
    this.panes.forEach((m) => (m.material.uniforms.uOpacity.value = glass));

    // Tool network: faces the viewer, its roots leave the Core; the tool pointed at sends a pulse down its wire
    this.nodeGroup.visible = s.network > 0.001;
    this.nodeGroup.rotation.y = s.az;
    // in portrait the constellation stands taller and narrower so every tool stays on screen
    this.nodeGroup.scale.set(portrait ? 0.56 : 1, portrait ? 1.15 : 1, 1);
    const tool = s.network > 0.5 ? Math.round(s.tool) : -1;
    const sh = this.shot;
    if (tool !== sh.last) {
      sh.last = tool;
      if (tool >= 0) {
        sh.node = tool;
        sh.t = 0;
      }
    }
    if (sh.node >= 0) {
      const before = sh.t;
      sh.t += dt / 1.15;
      // the pulse reaches the Core: it answers with a brief breath of light
      if (before < 0.92 && sh.t >= 0.92) this.flash = 1;
      // still pointed at: send another, calmly
      if (sh.t > 2.2 && tool === sh.node) sh.t = 0;
    }
    const anyHi = Math.max(...this.nodes.map((n) => n.hi));
    this.nodes.forEach((n, i) => {
      n.hi += ((i === tool ? 1 : 0) - n.hi) * ease(7);
      const appear = smoothstep(i * 0.05, i * 0.05 + 0.5, s.network);
      const tipIn = smoothstep(0.8, 1, appear);
      n.dot.material.color.copy(C.node).multiplyScalar(tipIn * k * (1.2 + 1.6 * n.hi));
      n.dot.scale.setScalar(Math.max(0.001, tipIn * (1 + 0.6 * n.hi)));
      n.halo.scale.setScalar(0.55 + 0.35 * n.hi);
      n.halo.material.uniforms.uIntensity.value = tipIn * k * (0.22 + 0.45 * n.hi);
      const u = n.link.material.uniforms;
      u.uTime.value = t + i * 0.9;
      u.uGrow.value = appear;
      u.uHi.value = n.hi;
      u.uDim.value = Math.max(0, anyHi - n.hi) * 0.6;
      u.uIntensity.value = appear * k * 0.9;
      const shooting = i === sh.node && sh.t < 1;
      // from the tool (vU 1) into the Core (vU 0)
      u.uShot.value = shooting ? 1 - sh.t : -1;
      u.uShotAmt.value = shooting ? smoothstep(0, 0.12, sh.t) * smoothstep(1, 0.8, sh.t) : 0;
    });

    // Wordmark stays centred on screen whatever the scene offset
    const wm = this.wordmark;
    // the wordmark belongs to wide screens; in portrait it would cut across the Core
    wm.visible = s.wordmark > 0.001 && !portrait;
    wm.material.opacity = s.wordmark * k * 0.075;
    if (wm.visible) {
      const depth = this.camera.position.distanceTo(this.tmp.set(0, 0.55, -3.4));
      const visH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * depth;
      const visW = visH * this.camera.aspect;
      this.tmp2.setFromMatrixColumn(this.camera.matrixWorld, 0);
      wm.position.set(0, 0.55, -3.4).addScaledVector(this.tmp2, -s.shiftX * visW);
      wm.position.y -= s.shiftY * visH;
      wm.quaternion.copy(this.camera.quaternion);
      const fitW = Math.min(1, (visW * 0.92) / 13);
      wm.scale.setScalar(fitW);
    }

    this.updateMonitor(portrait);

    // Post: bloom is the payoff of an awake, open Core
    this.final.uniforms.uTime.value = t % 100;
    this.bloom.strength = (0.45 + 0.25 * aw + 0.05 * s.open) * (0.7 + 0.3 * near);

    this.emitAnchors();
  }

  /**
   * The laptop rises out of the Core, closed, and opens as it comes to stand
   * beside it; then, as the visitor keeps scrolling, it glides towards the
   * centre — staying a reasonable size within the scene, the Core still there
   * behind it. Only a click takes it fullscreen (see LiveScreen).
   */
  private updateMonitor(portrait: boolean) {
    const g = this.monitor;
    const lid = this.lid;
    if (!g || !lid) return;
    const s = this.state;
    const e = s.screen * s.intro;
    const shown = e > 0.002;
    if (shown !== this.screenShown) {
      this.screenShown = shown;
      const vis = shown ? "visible" : "hidden";
      if (this.monitorFront) this.monitorFront.style.visibility = vis;
      this.monitorParts.forEach((el) => (el.style.visibility = vis));
    }
    if (!shown) return;
    const a = smoothstep(0, 1, e);
    const c = smoothstep(0, 1, s.center);
    // it emerges from the Core progressively — invisible, faint, then whole — and fades the same way back
    // into it (the HTML layer is drawn over the canvas, so without this it would pop up in front of the Core)
    const fade = (smoothstep(0.04, 0.62, e) ** 1.6).toFixed(3);
    if (fade !== this.screenFade && this.css) this.css.domElement.style.opacity = this.screenFade = fade;
    const unit = SCREEN_W / LAPTOP.w;
    // the lid opens once it is out of the Core
    lid.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, -LAPTOP.lean, smoothstep(0.3, 1, a));
    const mid = this.laptopMid;

    // beside the Core and a step in front of it, seen from SCREEN_AZ (centred in portrait)
    const fitW = portrait ? 0.7 : Math.min(0.9, Math.max(0.56, this.camera.aspect / 1.9));
    const right = this.tmp.set(Math.cos(SCREEN_AZ), 0, -Math.sin(SCREEN_AZ));
    const toCam = this.tmp2.set(Math.sin(SCREEN_AZ), 0, Math.cos(SCREEN_AZ));
    const beside = this.tmp3
      .set(0, CORE_Y + (portrait ? -0.1 : 0.02), 0)
      .addScaledVector(right, portrait ? 0 : 1.3 * fitW)
      .addScaledVector(toCam, portrait ? 1.9 : 1.1);
    const rise = this.tmp4.set(0, CORE_Y, 0).lerp(beside, a);
    this.besideQ.setFromEuler(this.euler.set((1 - a) * 0.5, SCREEN_AZ - (portrait ? 0 : 0.3) + (1 - a) * 0.5, 0));
    const besideScale = unit * (0.2 + 0.8 * a) * fitW;
    // placed by its visual centre, not its hinge
    rise.sub(this.tmp.copy(mid).applyQuaternion(this.besideQ).multiplyScalar(besideScale));

    if (c <= 0.0001) {
      g.position.copy(rise);
      g.quaternion.copy(this.besideQ);
      g.scale.setScalar(besideScale);
      return;
    }
    // centre stage, facing the visitor — a part of the scene, never all of it:
    // at the distance where it takes `fill` of the width (or `fillH` of the height), its centre at `at`
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const fill = portrait ? 0.84 : 0.36;
    const fillH = portrait ? 0.4 : 0.5;
    const ext = this.laptopExtent;
    const dist = Math.max(SCREEN_W / (fill * 2 * tan * aspect), (ext.y * unit) / (fillH * 2 * tan));
    const at = { x: portrait ? 0.5 : 0.55, y: portrait ? 0.46 : 0.45 };
    // where the camera's axis lands on screen (the scene's offset moves it), and how far `at` is from it
    const offX = (at.x - (0.5 + s.shiftX)) * 2 * tan * dist * aspect;
    const offY = (0.5 - s.shiftY - at.y) * 2 * tan * dist;
    const fwd = this.camera.getWorldDirection(this.tmp);
    const centre = this.tmp3.copy(this.camera.position).addScaledVector(fwd, dist);
    centre.addScaledVector(this.tmp2.setFromMatrixColumn(this.camera.matrixWorld, 0), offX);
    centre.addScaledVector(this.tmp2.setFromMatrixColumn(this.camera.matrixWorld, 1), offY);
    centre.sub(this.tmp.copy(mid).applyQuaternion(this.camera.quaternion).multiplyScalar(unit));
    g.position.copy(rise).lerp(centre, c);
    g.quaternion.slerpQuaternions(this.besideQ, this.camera.quaternion, c);
    g.scale.setScalar(THREE.MathUtils.lerp(besideScale, unit, c));
  }

  /** Where the cursor meets the Core: the stone warms under it, and the module fragment under it is reported. */
  private updateProbe(dt: number, sc: number) {
    const rate = this.opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 3);
    let target = 0;
    this.hoverPetal = -1;
    if (this.opts.interactive && this.pointerActive) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.sphere.center.setFromMatrixPosition(this.rock.matrixWorld);
      this.sphere.radius = 1.02 * CORE_SIZE * sc;
      const hit = this.raycaster.ray.intersectSphere(this.sphere, this.tmp);
      if (hit) {
        this.rock.worldToLocal(this.tmp);
        this.probe.x += (this.tmp.x - this.probe.x) * Math.min(1, rate * 3);
        this.probe.y += (this.tmp.y - this.probe.y) * Math.min(1, rate * 3);
        this.probe.z += (this.tmp.z - this.probe.z) * Math.min(1, rate * 3);
        target = 1;
      }
      // which fragment: the piece of stone itself under the cursor (they reach beyond the Core once out)
      if (this.state.modules > 0.5 && this.parts.visible) {
        this.hits.length = 0;
        for (const pc of this.pieces) pc.mesh.raycast(this.raycaster, this.hits);
        let nearest = Infinity;
        for (const h of this.hits)
          if (h.distance < nearest) {
            nearest = h.distance;
            this.hoverPetal = this.pieces.findIndex((pc) => pc.mesh === h.object);
          }
      }
    }
    this.probe.w += (target - this.probe.w) * rate;
  }

  private emitAnchors() {
    const cb = this.opts.onFrame;
    if (!cb) return;
    const s = this.state;
    const corePos = this.tmp2.setFromMatrixPosition(this.coreGroup.matrixWorld);
    const coreDist = this.camera.position.distanceTo(corePos);
    const project = (obj: THREE.Object3D, a: Anchor, alpha: number) => {
      obj.getWorldPosition(this.tmp);
      const behind = this.camera.position.distanceTo(this.tmp) > coreDist + 0.4 ? 0.5 : 1;
      this.tmp.project(this.camera);
      a.x = (this.tmp.x * 0.5 + 0.5) * this.w;
      a.y = (-this.tmp.y * 0.5 + 0.5) * this.h;
      a.alpha = this.tmp.z < 1 ? alpha * behind : 0;
    };
    this.modulePoints.forEach((m, i) => project(m, this.anchors.modules[i], smoothstep(i * 0.06, i * 0.06 + 0.5, s.modules) * s.intro));
    this.anchors.hoverModule = this.hoverPetal;
    this.nodes.forEach((n, i) => project(n.dot, this.anchors.nodes[i], smoothstep(i * 0.05 + 0.3, i * 0.05 + 0.5, s.network) * s.intro));
    const lit = [s.connect, s.understand, s.act];
    this.zonePoints.forEach((z, i) => project(z, this.anchors.zones[i], smoothstep(0.15, 0.6, lit[i]) * s.intro));

    // the Core itself: centre and apparent radius, for the "open the Core" target
    const c = this.anchors.core;
    this.tmp.copy(corePos).project(this.camera);
    c.x = (this.tmp.x * 0.5 + 0.5) * this.w;
    c.y = (-this.tmp.y * 0.5 + 0.5) * this.h;
    this.tmp.setFromMatrixColumn(this.camera.matrixWorld, 0).multiplyScalar(CORE_SIZE * 1.05 * this.rock.scale.x).add(corePos).project(this.camera);
    c.r = Math.abs((this.tmp.x * 0.5 + 0.5) * this.w - c.x);
    c.alpha = s.intro;
    cb(this.anchors);
  }

  dispose() {
    this.stop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        (mat as THREE.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      });
    });
    if (this.monitor) {
      // hand the front back untouched (its owner, React, removes it); the rest was ours
      this.monitorFront?.remove();
      this.monitorParts.forEach((el) => el.remove());
      this.cssScene?.remove(this.monitor);
    }
    this.css?.domElement.remove();
    this.composer.dispose();
    this.renderer.dispose();
  }
}

/** True when WebGL is available (cheap probe, context released immediately). */
export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
