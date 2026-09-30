import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createNoise3D, fbm, mulberry32, smoothstep } from "./noise";
import * as S from "./shaders";
import { DEFAULT_STATE, type Anchor, type CoreAnchors, type CoreState } from "./state";

/**
 * The Core — Syxoria's signature object and the company's brain: a dense,
 * near-black mass with a living heat in its fissures, floating in the dark.
 *
 * Everything is built once and driven by one flat numeric state (`CoreState`)
 * that GSAP scrubs with the scroll. Whatever leaves or reaches the Core is
 * part of one body that turns with it, so it always comes from the same place:
 *
 *   · three zones on its surface — signals flow in, the heart lights, action flows out
 *   · six petals that part like a flower around a lit nucleus
 *   · six module branches growing from that nucleus, each through its own seam
 *   · the tools, wired to it by roots that leave its surface
 *   · the product screen (live HTML, placed in the same 3D space)
 *
 * The visitor adds two things on top: the cursor warms the stone under it,
 * and the branch they explore (`focus`) reaches out and lights up.
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
  /** an HTML element (the product screen) placed in the scene beside the Core */
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
export const ROCK_DETAIL = { high: 34, low: 18 };
/** Branch directions (degrees, around the axis that faces the camera): three on the left, three on the right. */
const BRANCH_ANGLES = [120, 180, 240, 60, 0, 300];
/** The petals sit between the branches, so every branch leaves through a seam. */
const PETAL_ANGLES = [30, 90, 150, 210, 270, 330];
/** The brain's three zones (object space): where signals come in, the heart, where action leaves. */
export const ZONE_DIRS = [new THREE.Vector3(-0.8, 0.5, 0.42), new THREE.Vector3(0.12, -0.1, 1), new THREE.Vector3(0.78, -0.42, 0.5)].map((v) => v.normalize());
/** The product screen: its size in the scene, and the orbit angle it is set up to be seen from. */
const SCREEN_PX = 1200;
const SCREEN_W = 2.9;
export const SCREEN_AZ = 1.75;
const WARM = new THREE.Color(1.0, 0.5, 0.16);
const GRAPHITE_LINE = new THREE.Color(0.2, 0.2, 0.21);
const EDGE = new THREE.Color(1.0, 0.8, 0.6);
const NODE_IDLE = new THREE.Color(1.0, 0.82, 0.62);
const NODE_LIT = new THREE.Color(1.0, 0.7, 0.4);
const ORIGIN_2D = new THREE.Vector2();
const KEY_DIR = new THREE.Vector3(-0.55, 0.8, 0.45).normalize();

type LineMat = THREE.ShaderMaterial & {
  uniforms: Record<"uTime" | "uGrow" | "uGrowFrom" | "uHi" | "uDim" | "uIntensity" | "uFlow" | "uPulse", THREE.IUniform<number>> & {
    uCool: THREE.IUniform<THREE.Color>;
    uWarm: THREE.IUniform<THREE.Color>;
  };
};

function lineMaterial({ flow = 1, pulse = 0.25, growFrom = 0 } = {}): LineMat {
  return new THREE.ShaderMaterial({
    vertexShader: S.branchVert,
    fragmentShader: S.branchFrag,
    uniforms: {
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uGrowFrom: { value: growFrom },
      uHi: { value: 0 },
      uDim: { value: 0 },
      uIntensity: { value: 0 },
      uFlow: { value: flow },
      uPulse: { value: pulse },
      uCool: { value: GRAPHITE_LINE.clone() },
      uWarm: { value: WARM.clone() },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }) as LineMat;
}

/** A tube that thins from r0 at its start to r1 at its end — branches, not cables. */
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

function haloMesh(color: THREE.Color, falloff: number) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.haloVert,
    fragmentShader: S.haloFrag,
    uniforms: { uIntensity: { value: 0 }, uColor: { value: color.clone() }, uFalloff: { value: falloff } },
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
 * into six petals around the axis that faces the viewer — seams that meet at
 * its heart, so it can open like a flower.
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

  // Petals: six seeds around the facing axis, between the branch directions
  const rand = mulberry32(17);
  const seeds = PETAL_ANGLES.map((d) => {
    const a = THREE.MathUtils.degToRad(d);
    return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  });
  // each petal opens outwards and a little back, so the heart shows
  const dirs = seeds.map((s) => new THREE.Vector3(s.x, s.y, -0.22).normalize());
  const amounts = seeds.map(() => 0.14 + rand() * 0.04);
  // the order in which the petals form during the opening sequence (alternating sides)
  const order = [0, 3, 1, 4, 2, 5].map((k) => k / 6);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const cavity = new Float32Array(pos.count);
  const shard = new Float32Array(pos.count * 4);
  const shardId = new Float32Array(pos.count);
  const shardOrder = new Float32Array(pos.count);
  const seam = new Float32Array(pos.count);
  const p = new THREE.Vector3();
  const w = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).normalize();
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

    // the petal: nearest seed around the axis, on a slightly noise-warped direction so the seams wander a little
    w.set(p.x + 0.16 * n1(p.x * 1.8, p.y * 1.8, p.z * 1.8), p.y + 0.16 * n1(p.x * 1.8 + 5, p.y * 1.8, p.z * 1.8), 0);
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
    shard.set([dirs[idx].x, dirs[idx].y, dirs[idx].z, amounts[idx]], i * 4);
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
  geo.setAttribute("aShard", new THREE.BufferAttribute(shard, 4));
  geo.setAttribute("aSeam", new THREE.BufferAttribute(seam, 1));
  geo.setAttribute("aShardId", new THREE.BufferAttribute(shardId, 1));
  geo.setAttribute("aOrder", new THREE.BufferAttribute(shardOrder, 1));
  geo.computeVertexNormals();
  return geo;
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

type Branch = {
  group: THREE.Group;
  main: THREE.Mesh<THREE.BufferGeometry, LineMat>;
  twig: THREE.Mesh<THREE.BufferGeometry, LineMat>;
  dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  /** eased highlight, 0..1 */
  hi: number;
};

type Node = {
  dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  link: THREE.Mesh<THREE.BufferGeometry, LineMat>;
};

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
  private opts: Required<Omit<CoreSceneOptions, "state" | "onFrame" | "rockGeometry" | "screen">> & Pick<CoreSceneOptions, "onFrame">;
  private rockGeometry?: THREE.BufferGeometry;

  private rock!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private coreGroup = new THREE.Group();
  /** everything that turns with the Core */
  private body = new THREE.Group();
  private nucleus!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private halos: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private embers!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
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
  private branchGroup = new THREE.Group();
  private branches: Branch[] = [];
  /** the signals of the zones: flowing in (connect) and out (act) */
  private signals: { zone: number; mesh: THREE.Mesh<THREE.BufferGeometry, LineMat>; delay: number }[] = [];
  private zonePoints = ZONE_DIRS.map(() => new THREE.Object3D());
  private nodeGroup = new THREE.Group();
  private nodes: Node[] = [];
  private wordmark!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  // the product screen (HTML in 3D)
  private css?: CSS3DRenderer;
  private cssScene?: THREE.Scene;
  private screenObj?: CSS3DObject;
  private screenShown = false;

  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private tmp3 = new THREE.Vector3();
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
    this.maxDpr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 1.75);
    this.dpr = this.maxDpr;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    // Clear to true black: the page colour is laid back in, in display space, by the final pass.
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.dpr);

    this.scene.add(this.camera);
    this.build(low);
    if (options.screen) this.buildScreen(options.screen);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.5, 0.72);
    this.composer.addPass(this.bloom);
    const output = new OutputPass();
    this.composer.addPass(output);
    this.final = new ShaderPass(S.finalPass);
    this.composer.addPass(this.final);

    this.anchors = {
      branches: this.branches.map(() => ({ x: 0, y: 0, alpha: 0 })),
      nodes: this.nodes.map(() => ({ x: 0, y: 0, alpha: 0 })),
      zones: this.zonePoints.map(() => ({ x: 0, y: 0, alpha: 0 })),
      core: { x: 0, y: 0, alpha: 0, r: 0 },
    };

    const rect = canvas.getBoundingClientRect();
    this.setSize(rect.width || 1, rect.height || 1);
    this.ready = this.prepare(output);
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
      const key = `${mat.type}|${sm.fragmentShader ?? ""}|${(o as THREE.Points).isPoints ? "p" : ""}${(o as THREE.Mesh).geometry?.type ?? ""}`;
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

    // The rock
    const rockMat = new THREE.ShaderMaterial({
      vertexShader: S.rockVert,
      fragmentShader: S.rockFrag,
      uniforms: {
        uTime: { value: 0 },
        uAwaken: { value: 0 },
        uOpen: { value: 0 },
        uScatter: { value: 0 },
        uTease: { value: 1 },
        uProbe: { value: this.probe },
        uZones: { value: this.zones },
        uBump: { value: 0.006 },
        uKeyDir: { value: KEY_DIR },
        uKeyColor: { value: new THREE.Color(1.0, 0.9, 0.78) },
        uFillDir: { value: new THREE.Vector3(0.85, 0.1, 0.3).normalize() },
        uFillColor: { value: new THREE.Color(0.22, 0.26, 0.34) },
        uRimColor: { value: new THREE.Color(1.0, 0.55, 0.22) },
      },
      // opened petals and scattered shards are open shells: their inner side must render too
      side: THREE.DoubleSide,
    });
    this.rock = new THREE.Mesh(this.rockGeometry ?? buildRockGeometry(low ? ROCK_DETAIL.low : ROCK_DETAIL.high), rockMat);
    // petals move outside the rest bounds when the Core opens
    this.rock.frustumCulled = false;
    this.body.add(this.rock);

    // The nucleus: the Core's light itself, only seen through its openings
    this.nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) }));
    this.body.add(this.nucleus);

    // Halos: wide warm atmosphere + tight hot breath (both follow how awake the Core is)
    const wide = haloMesh(new THREE.Color(1.0, 0.5, 0.18), 2.4);
    wide.scale.set(6.5, 6.5, 1);
    const tight = haloMesh(new THREE.Color(1.0, 0.68, 0.36), 3.2);
    tight.scale.set(3.1, 3.1, 1);
    this.halos = [wide, tight];
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
          uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uHeight: { value: 4.6 }, uSpread: { value: 1 }, uIntensity: { value: 0 } },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.embers.frustumCulled = false;
      this.coreGroup.add(this.embers);
    }

    // The brain's zones: a point on the surface of each, and its signals
    ZONE_DIRS.forEach((d, i) => {
      this.zonePoints[i].position.copy(d).multiplyScalar(1.08);
      this.body.add(this.zonePoints[i]);
    });
    {
      // connect: signals arrive from far away into the upper-left zone · act: the lower-right zone sends them out
      const make = (zone: number, count: number, flow: number) => {
        const d = ZONE_DIRS[zone];
        const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
        const up = new THREE.Vector3().crossVectors(side, d).normalize();
        for (let j = 0; j < count; j++) {
          // a fan around the zone's direction, like fine roots of light
          const a = ((j + 0.5) / count - 0.5) * 2.4 + (rand() - 0.5) * 0.3;
          const far = d
            .clone()
            .multiplyScalar(0.8)
            .addScaledVector(side, Math.sin(a) * 0.9)
            .addScaledVector(up, Math.cos(a) * 0.35 - 0.15 + (rand() - 0.5) * 0.5)
            .normalize()
            .multiplyScalar(2.2 + rand() * 0.9);
          const start = d.clone().multiplyScalar(0.96);
          const bend = side.clone().multiplyScalar((rand() - 0.5) * 0.6).addScaledVector(up, (rand() - 0.5) * 0.6);
          const curve = new THREE.CatmullRomCurve3([
            start,
            d.clone().multiplyScalar(1.3).addScaledVector(far.clone().normalize(), 0.12),
            start.clone().lerp(far, 0.5).add(bend),
            far.clone().lerp(start, 0.18).addScaledVector(bend, -0.4),
            far,
          ]);
          const mesh = new THREE.Mesh(taperedTube(curve, 72, 0.011, 0.002, 5), lineMaterial({ flow, pulse: 0.9, growFrom: flow < 0 ? 1 : 0 }));
          mesh.frustumCulled = false;
          this.body.add(mesh);
          this.signals.push({ zone, mesh, delay: j / count });
        }
      };
      make(0, low ? 4 : 6, -1);
      make(2, low ? 4 : 6, 1);
    }

    // Six module branches, from the nucleus out through the six seams, each ending in a lit node
    {
      const depth = [0.3, -0.15, 0.2, -0.2, 0.3, -0.1];
      BRANCH_ANGLES.forEach((deg, i) => {
        const a = THREE.MathUtils.degToRad(deg);
        const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        const tip = new THREE.Vector3(dir.x * 2.0, dir.y * 1.42, 0.35 + depth[i]);
        // it leaves the Core through its seam, towards the viewer, then reaches out and bends like a branch
        const bend = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(i % 2 ? 0.12 : -0.12);
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0.02),
          dir.clone().multiplyScalar(0.55).setZ(0.1),
          dir.clone().multiplyScalar(1.12).setZ(0.24),
          dir.clone().multiplyScalar(1.6).add(bend).setZ(0.3 + depth[i] * 0.5),
          tip,
        ]);
        const group = new THREE.Group();
        const main = new THREE.Mesh(taperedTube(curve, 110, 0.05, 0.008, low ? 5 : 7), lineMaterial({ flow: 1, pulse: 0.3 }));
        main.frustumCulled = false;
        // a twig forking from the branch — organic, not a wire
        const fork = curve.getPointAt(0.62);
        const tangent = curve.getTangentAt(0.62);
        const twigEnd = fork
          .clone()
          .addScaledVector(tangent, 0.28)
          .add(new THREE.Vector3(0, tip.y >= 0 ? 0.18 : -0.18, 0.08));
        const twigCurve = new THREE.CatmullRomCurve3([fork, fork.clone().lerp(twigEnd, 0.5).addScaledVector(tangent, 0.06), twigEnd]);
        const twig = new THREE.Mesh(taperedTube(twigCurve, 32, 0.013, 0.003, 5), lineMaterial({ flow: 1, pulse: 0.2 }));
        twig.frustumCulled = false;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: NODE_IDLE.clone(), transparent: true }));
        dot.position.copy(tip);
        const halo = haloMesh(new THREE.Color(1.0, 0.62, 0.3), 2.6);
        halo.position.copy(tip);
        group.add(main, twig, dot, halo);
        this.branchGroup.add(group);
        this.branches.push({ group, main, twig, dot, halo, hi: 0 });
      });
      this.body.add(this.branchGroup);
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
        const halo = haloMesh(new THREE.Color(1.0, 0.8, 0.6), 2.8);
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
        const link = new THREE.Mesh(taperedTube(curve, 90, 0.03, 0.005, low ? 4 : 6), lineMaterial({ flow: -1, pulse: 0.8 }));
        link.frustumCulled = false;
        this.nodeGroup.add(dot, halo, link);
        this.nodes.push({ dot, halo, link });
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

    // Floor: faint contour lines + a warm pool under the Core
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({
        vertexShader: S.floorVert,
        fragmentShader: S.floorFrag,
        uniforms: { uOpacity: { value: 1 }, uAwaken: { value: 0 }, uTime: { value: 0 } },
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
          uAwaken: { value: 0 },
          uTopY: { value: PLINTH_TOP },
          uOpacity: { value: 1 },
        },
        transparent: true,
      }),
    );
    this.plinth.position.y = FLOOR_Y + PLINTH_H / 2;
    this.plinthGroup.add(this.plinth);
    const edgeMat = () => new THREE.MeshBasicMaterial({ color: WARM.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
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

    // Vitrine: fine warm edges + faint glass, rising around the Core at the end of the story
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
          uniforms: { uOpacity: { value: 0 } },
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

  /** The product screen: an HTML element rendered in the same 3D space as the Core. */
  private buildScreen(el: HTMLElement) {
    const css = new CSS3DRenderer();
    const dom = css.domElement;
    dom.style.position = "absolute";
    dom.style.inset = "0";
    dom.style.pointerEvents = "none";
    this.canvas.parentElement?.appendChild(dom);
    this.css = css;
    this.cssScene = new THREE.Scene();
    this.screenObj = new CSS3DObject(el);
    el.style.visibility = "hidden";
    this.cssScene.add(this.screenObj);
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

    // Camera
    this.pointerSmooth.lerp(this.pointerActive ? this.pointer : ORIGIN_2D, ease(2.5));
    const portrait = this.w / this.h < 1;
    // portrait: width is the limit; short screens also leave less room above the words
    const fit = portrait ? Math.pow(this.h / this.w, 0.6) * Math.sqrt(Math.max(1, 780 / this.h)) : 1;
    const az = s.az + (this.opts.interactive ? this.pointerSmooth.x * 0.05 : 0);
    const el = s.el + (this.opts.interactive ? this.pointerSmooth.y * 0.03 : 0);
    const d = s.dist * fit;
    this.camera.position.set(s.tx + d * Math.cos(el) * Math.sin(az), s.ty + d * Math.sin(el), s.tz + d * Math.cos(el) * Math.cos(az));
    this.camera.lookAt(s.tx, s.ty, s.tz);
    this.camera.setViewOffset(this.w, this.h, -s.shiftX * this.w, s.shiftY * this.h, this.w, this.h);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // The Core: drifts on its own, or turns to face the viewer (and present a zone, or open towards them)
    const sc = s.scale * (0.82 + 0.18 * k);
    this.coreGroup.position.y = CORE_Y + (rm ? 0 : Math.sin(t * 0.9) * 0.03);
    this.coreGroup.scale.setScalar(CORE_SIZE);
    const drift = s.spin + (rm ? 0 : Math.sin(t * 0.17) * 0.28 + t * 0.012);
    this.body.rotation.y = drift + angleDelta(drift, s.az + s.turn) * s.face;
    this.body.rotation.x = (rm ? 0 : Math.sin(t * 0.13) * 0.05) * (1 - s.face);
    // in portrait the branches stand taller and narrower so every node stays on screen
    this.branchGroup.scale.set(portrait ? 0.92 : 1, portrait ? 1.2 : 1, 1);
    this.rock.scale.setScalar(sc);
    this.coreGroup.updateMatrixWorld(true);
    this.updateProbe(dt, sc);
    const ru = this.rock.material.uniforms;
    ru.uTime.value = t;
    ru.uAwaken.value = aw;
    ru.uOpen.value = s.open * k;
    ru.uScatter.value = s.scatter;
    ru.uTease.value = s.tease;
    this.zones[0].w = s.connect * k;
    this.zones[1].w = s.understand * k;
    this.zones[2].w = s.act * k;

    // the nucleus: its light, seen through the openings (and the heart, as it is understood)
    const nuc = (0.2 * aw + 1.3 * s.open + 0.3 * s.understand) * k * (0.9 + 0.1 * Math.sin(t * 1.25));
    this.nucleus.material.color.setRGB(1.0 * nuc, 0.46 * nuc, 0.12 * nuc);
    this.nucleus.scale.setScalar(0.6 + 0.4 * s.open);
    // unlit it would be a black ball: only there once it glows, and never among the scattered shards
    this.nucleus.visible = nuc > 0.002 && s.scatter < 0.01;

    // halos are screen-filling up close: fade them as the camera approaches
    const near = smoothstep(3.5, 10, this.camera.position.distanceTo(this.coreGroup.position));
    const glow = aw + 0.2 * s.open + 0.08 * s.understand;
    this.halos[0].material.uniforms.uIntensity.value = (0.04 + 0.16 * glow) * k * (0.25 + 0.75 * near);
    this.halos[1].material.uniforms.uIntensity.value = (0.03 + 0.34 * glow) * k * (0.9 + 0.1 * Math.sin(t * 1.25)) * (0.45 + 0.55 * near);
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
    this.plinthLights.forEach((m) => m.material.color.copy(EDGE).multiplyScalar(lineK));
    this.plate.material.color.copy(WARM).multiplyScalar(pv * k * aw * 0.02);

    // Vitrine: edges rise from the plinth, then the top closes, then the glass
    const v = s.vitrine;
    this.vitrine.visible = v > 0.001;
    const rise = smoothstep(0, 0.6, v);
    const close = smoothstep(0.5, 0.85, v);
    const glass = smoothstep(0.7, 1, v);
    this.vitrineEdges.forEach((m) => {
      m.scale.y = Math.max(0.001, rise);
      m.material.color.setRGB(1.0, 0.72, 0.45).multiplyScalar(0.34 * k);
    });
    this.vitrineTop.forEach((m) => m.material.color.setRGB(1.0, 0.72, 0.45).multiplyScalar(0.34 * close * k));
    this.panes.forEach((m) => (m.material.uniforms.uOpacity.value = glass));

    // The zones' signals: they flow in (connect) and out (act) while their zone is lit
    this.signals.forEach((sg) => {
      const z = sg.zone === 0 ? s.connect : s.act;
      const grow = smoothstep(sg.delay * 0.35, sg.delay * 0.35 + 0.65, z);
      const u = sg.mesh.material.uniforms;
      u.uTime.value = t + sg.delay * 3.1;
      u.uGrow.value = grow;
      u.uIntensity.value = z * k * 0.7;
      sg.mesh.visible = z > 0.001;
    });

    // Module branches: grow one after another; the explored one reaches out and warms
    this.branchGroup.visible = s.branches > 0.001;
    const focus = s.branches > 0.5 ? Math.round(s.focus) : -1;
    this.branches.forEach((b, i) => (b.hi += ((i === focus ? 1 : 0) - b.hi) * ease(6)));
    const anyHi = Math.max(...this.branches.map((b) => b.hi));
    this.branches.forEach((b, i) => {
      const appear = smoothstep(i * 0.08, i * 0.08 + 0.55, s.branches);
      const others = Math.max(0, anyHi - b.hi);
      const on = appear * k;
      b.group.scale.setScalar(1 + 0.06 * b.hi);
      for (const m of [b.main, b.twig]) {
        const u = m.material.uniforms;
        u.uTime.value = t + i * 0.7;
        u.uHi.value = b.hi;
        u.uDim.value = others;
        u.uIntensity.value = on * (0.8 + 0.3 * aw);
      }
      b.main.material.uniforms.uGrow.value = appear;
      b.twig.material.uniforms.uGrow.value = smoothstep(0.62, 1, appear);
      const tipIn = smoothstep(0.85, 1, appear);
      b.dot.material.color.copy(NODE_IDLE).lerp(NODE_LIT, b.hi).multiplyScalar(k * tipIn * (1.3 + 2.4 * b.hi) * (1 - 0.55 * others));
      b.dot.scale.setScalar(Math.max(0.001, tipIn * (0.9 + 0.6 * b.hi)));
      b.halo.scale.setScalar(0.7 + 0.35 * b.hi);
      b.halo.material.uniforms.uIntensity.value = on * tipIn * (0.18 + 0.5 * b.hi) * (1 - 0.5 * others);
    });

    // Tool network: faces the viewer, its roots leave the Core
    this.nodeGroup.visible = s.network > 0.001;
    this.nodeGroup.rotation.y = s.az + (rm ? 0 : Math.sin(t * 0.1) * 0.06);
    // in portrait the constellation stands taller and narrower so every tool stays on screen
    this.nodeGroup.scale.set(portrait ? 0.56 : 1, portrait ? 1.15 : 1, 1);
    this.nodes.forEach((n, i) => {
      const appear = smoothstep(i * 0.05, i * 0.05 + 0.5, s.network);
      const tipIn = smoothstep(0.8, 1, appear);
      n.dot.material.color.setRGB(0.95, 0.9, 0.84).multiplyScalar(tipIn * 1.4 * k);
      n.dot.scale.setScalar(Math.max(0.001, tipIn));
      n.halo.scale.setScalar(0.55);
      n.halo.material.uniforms.uIntensity.value = tipIn * k * 0.22;
      const u = n.link.material.uniforms;
      u.uTime.value = t + i * 0.9;
      u.uGrow.value = appear;
      u.uIntensity.value = appear * k * 0.9;
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

    this.updateScreen(portrait);

    // Post: bloom is the payoff of an awake, open Core
    this.final.uniforms.uTime.value = t % 100;
    this.bloom.strength = (0.45 + 0.25 * aw + 0.05 * s.open) * (0.7 + 0.3 * near);

    this.emitAnchors();
  }

  /** The product screen rises out of the Core and stands beside it, turned towards the viewer. */
  private updateScreen(portrait: boolean) {
    const obj = this.screenObj;
    if (!obj) return;
    const e = this.state.screen * this.state.intro;
    const shown = e > 0.002;
    if (shown !== this.screenShown) {
      this.screenShown = shown;
      obj.element.style.visibility = shown ? "visible" : "hidden";
    }
    if (!shown) return;
    const a = smoothstep(0, 1, e);
    // where it stands: in front of the Core and to its right, seen from SCREEN_AZ (centred in portrait)
    const right = this.tmp.set(Math.cos(SCREEN_AZ), 0, -Math.sin(SCREEN_AZ));
    const toCam = this.tmp2.set(Math.sin(SCREEN_AZ), 0, Math.cos(SCREEN_AZ));
    // narrower screens get a smaller one, so it never runs off the edge
    const fitW = portrait ? 0.78 : Math.min(1, Math.max(0.62, this.camera.aspect / 1.75));
    // beside the Core and a step in front of it: the Core glows just behind its left edge
    const target = this.tmp3
      .set(0, CORE_Y + (portrait ? -0.05 : 0.08), 0)
      .addScaledVector(right, portrait ? 0 : 1.25 * fitW)
      .addScaledVector(toCam, portrait ? 1.9 : 1.0);
    obj.position.set(0, CORE_Y, 0).lerp(target, a);
    obj.rotation.set((1 - a) * 0.5, SCREEN_AZ - (portrait ? 0 : 0.26) + (1 - a) * 0.5, 0);
    obj.scale.setScalar((SCREEN_W / SCREEN_PX) * (0.25 + 0.75 * a) * fitW);
    obj.element.style.opacity = smoothstep(0.05, 0.45, e).toFixed(3);
  }

  /** Where the cursor meets the Core: the stone warms under it. */
  private updateProbe(dt: number, sc: number) {
    const rate = this.opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 3);
    let target = 0;
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
    this.branches.forEach((b, i) => {
      const appear = smoothstep(i * 0.08, i * 0.08 + 0.55, s.branches);
      project(b.dot, this.anchors.branches[i], smoothstep(0.8, 1, appear) * s.intro);
    });
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
    if (this.screenObj) {
      // hand the element back untouched: its owner (React) removes it
      this.screenObj.element.remove();
      this.cssScene?.remove(this.screenObj);
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
