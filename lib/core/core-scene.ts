import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createNoise3D, fbm, mulberry32, smoothstep } from "./noise";
import * as S from "./shaders";
import { DEFAULT_STATE, type Anchor, type CoreAnchors, type CoreState } from "./state";

/**
 * The Core — Syxoria's signature object. A dense, faceted mass with a living
 * heat breaking through its fissures, floating above a black-marble plinth.
 *
 * Everything the story needs is built once and driven by one flat numeric
 * state (`CoreState`) that GSAP scrubs with the scroll: camera orbit, how
 * awake the Core is, the energy strands, the six module orbs, the tool
 * network, the warp transition and the vitrine reveal.
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
export const ROCK_DETAIL = { high: 30, low: 16 };
const WARM = new THREE.Color(1.0, 0.56, 0.2);
const KEY_DIR = new THREE.Vector3(-0.55, 0.8, 0.45).normalize();

type StrandMat = THREE.ShaderMaterial & {
  uniforms: Record<"uTime" | "uIntensity" | "uSpeed" | "uOffset" | "uBase" | "uReveal" | "uDirection", THREE.IUniform<number>> & {
    uColor: THREE.IUniform<THREE.Color>;
  };
};

function strandMaterial(speed: number, offset: number, direction = 1, color = WARM): StrandMat {
  return new THREE.ShaderMaterial({
    vertexShader: S.strandVert,
    fragmentShader: S.strandFrag,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uSpeed: { value: speed },
      uOffset: { value: offset },
      uBase: { value: 0.06 },
      uReveal: { value: 1 },
      uDirection: { value: direction },
      uColor: { value: color.clone().multiplyScalar(1.5) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }) as StrandMat;
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

/** Sculpt the Core: a lumpy, heart-like cluster with two glowing hollows. */
/** Yield to the browser so input and painting are not blocked between setup steps. */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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
    { c: new THREE.Vector3(0.12, -0.1, 1).normalize(), depth: 0.3, lo: 0.8, hi: 0.975, w: 1 },
    { c: new THREE.Vector3(-0.7, 0.35, -0.6).normalize(), depth: 0.16, lo: 0.89, hi: 0.985, w: 0.65 },
  ];

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const cavity = new Float32Array(pos.count);
  const p = new THREE.Vector3();
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

export class CoreScene {
  state: CoreState;
  readonly ready: Promise<void>;

  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private final: ShaderPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  private timer = new THREE.Timer();
  private raf = 0;
  private running = false;
  /** false until shaders finish compiling in the background — rendering earlier would compile them synchronously and freeze the page */
  private compiled = false;
  private time = 0;
  private flow = 0;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private maxDpr: number;
  private frameTimes: number[] = [];
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private opts: Required<Omit<CoreSceneOptions, "state" | "onFrame" | "rockGeometry">> & Pick<CoreSceneOptions, "onFrame">;
  private rockGeometry?: THREE.BufferGeometry;

  private rock!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private coreGroup = new THREE.Group();
  private halos: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private strands: THREE.Mesh<THREE.TubeGeometry, StrandMat>[] = [];
  private strandGroup = new THREE.Group();
  private embers!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private dust!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private floor!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private plinth!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private plinthLights: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
  private plate!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  private plinthGroup = new THREE.Group();
  private vitrine = new THREE.Group();
  private vitrineEdges: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  private vitrineTop: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  private panes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private orbGroup = new THREE.Group();
  private orbs: { dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; link: THREE.Mesh<THREE.TubeGeometry, StrandMat> }[] = [];
  private nodeGroup = new THREE.Group();
  private nodes: { dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; link: THREE.Mesh<THREE.TubeGeometry, StrandMat> }[] = [];
  private streaks!: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private wordmark!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
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

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.5, 0.72);
    this.composer.addPass(this.bloom);
    const output = new OutputPass();
    this.composer.addPass(output);
    this.final = new ShaderPass(S.finalPass);
    this.composer.addPass(this.final);

    this.anchors = {
      orbs: this.orbs.map(() => ({ x: 0, y: 0, alpha: 0 })),
      nodes: this.nodes.map(() => ({ x: 0, y: 0, alpha: 0 })),
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
      obj.frustumCulled = false;
      this.renderer.setRenderTarget(rt);
      this.renderer.render(obj, camera);
      obj.frustumCulled = culled;
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
        uKeyDir: { value: KEY_DIR },
        uKeyColor: { value: new THREE.Color(1.0, 0.9, 0.78) },
        uFillDir: { value: new THREE.Vector3(0.85, 0.1, 0.3).normalize() },
        uFillColor: { value: new THREE.Color(0.22, 0.26, 0.34) },
        uRimColor: { value: new THREE.Color(1.0, 0.55, 0.22) },
      },
    });
    this.rock = new THREE.Mesh(this.rockGeometry ?? buildRockGeometry(low ? ROCK_DETAIL.low : ROCK_DETAIL.high), rockMat);
    this.coreGroup.add(this.rock);

    // Halos: wide warm atmosphere + tight hot breath
    const wide = haloMesh(new THREE.Color(1.0, 0.5, 0.18), 2.4);
    wide.scale.set(6.5, 6.5, 1);
    const tight = haloMesh(new THREE.Color(1.0, 0.68, 0.36), 3.2);
    tight.scale.set(3.1, 3.1, 1);
    this.halos = [wide, tight];
    this.halos.forEach((h) => this.coreGroup.add(h));

    // Energy strands: tilted, breathing orbits with comets of light
    const count = low ? 10 : 15;
    for (let i = 0; i < count; i++) {
      const R = 1.25 + rand() * 0.75;
      const squash = 0.25 + rand() * 0.55;
      const phase = rand() * TAU;
      const wob = 0.05 + rand() * 0.1;
      const lobes = 2 + Math.floor(rand() * 3);
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a < 72; a++) {
        const t = (a / 72) * TAU;
        const r = R * (1 + wob * Math.sin(lobes * t + phase));
        pts.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t * 2 + phase) * 0.1, Math.sin(t) * r * squash));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.0042 + rand() * 0.003, 3, true), strandMaterial(0.05 + rand() * 0.12, rand(), rand() > 0.5 ? 1 : -1));
      mesh.rotation.set((rand() - 0.5) * 2.4, rand() * TAU, (rand() - 0.5) * 2.4);
      mesh.frustumCulled = false;
      this.strands.push(mesh);
      this.strandGroup.add(mesh);
    }
    this.coreGroup.add(this.strandGroup);

    // Embers rising around the Core
    {
      const n = low ? 260 : 560;
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
    this.coreGroup.position.y = CORE_Y;
    this.scene.add(this.coreGroup);

    // Dust: the air of the room
    {
      const n = low ? 600 : 1400;
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

    // Floor: contour lines + warm pool
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

    // Plinth: black marble, light along its edges, a lit plate on top
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
    const lineMat = () => new THREE.MeshBasicMaterial({ color: WARM.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const edge = (w: number, y: number, t = 0.012) => {
      const half = w / 2;
      for (const [x, z, sx, sz] of [
        [0, half, w, t],
        [0, -half, w, t],
        [half, 0, t, w],
        [-half, 0, t, w],
      ] as const) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, t, sz), lineMat());
        m.position.set(x, y, z);
        this.plinthGroup.add(m);
        this.plinthLights.push(m);
      }
    };
    edge(PLINTH_W + 0.03, FLOOR_Y + 0.006, 0.014);
    edge(1.34, PLINTH_TOP + 0.004, 0.008);
    this.plate = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.004, 1.32), lineMat());
    this.plate.position.y = PLINTH_TOP + 0.002;
    this.plinthGroup.add(this.plate);
    this.scene.add(this.plinthGroup);

    // Vitrine: thin lit edges + faint glass, revealed at the end of the story
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
        const g = new THREE.BoxGeometry(0.012, VH, 0.012).translate(0, VH / 2, 0);
        const m = new THREE.Mesh(g, lineMat());
        m.position.set(x, 0, z);
        this.vitrine.add(m);
        this.vitrineEdges.push(m);
      }
      for (const [x, z, sx, sz] of [
        [0, half, VW, 0.012],
        [0, -half, VW, 0.012],
        [half, 0, 0.012, VW],
        [-half, 0, 0.012, VW],
      ] as const) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.012, sz), lineMat());
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

    // Six module orbs on a tilted ring, each wired to the Core
    {
      const R = 2.05;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.35;
        const p = new THREE.Vector3(Math.cos(a) * R, (i % 2 ? 0.16 : -0.12), Math.sin(a) * R);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.8, 0.55), transparent: true }));
        dot.position.copy(p);
        const halo = haloMesh(new THREE.Color(1.0, 0.62, 0.3), 2.6);
        halo.position.copy(p);
        const dir = p.clone().normalize();
        const curve = new THREE.CatmullRomCurve3([
          dir.clone().multiplyScalar(0.85),
          dir.clone().multiplyScalar(1.35).add(new THREE.Vector3(0, 0.22, 0)),
          p.clone().multiplyScalar(0.97),
        ]);
        const link = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0045, 3, false), strandMaterial(0.35, i / 6, 1));
        link.frustumCulled = false;
        this.orbGroup.add(dot, halo, link);
        this.orbs.push({ dot, halo, link });
      }
      this.orbGroup.rotation.set(0.32, 0, -0.14);
      this.coreGroup.add(this.orbGroup);
    }

    // Tool network: nodes around the Core, data flowing inward
    {
      const n = this.opts.nodeCount;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.4;
        const p = new THREE.Vector3(Math.cos(a) * 3.15, Math.sin(a) * 1.75 + 0.05, (rand() - 0.5) * 1.6);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.85, 0.65), transparent: true }));
        dot.position.copy(p);
        const halo = haloMesh(new THREE.Color(1.0, 0.7, 0.4), 2.8);
        halo.position.copy(p);
        const dir = p.clone().normalize();
        const bend = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(0.35 * (i % 2 ? 1 : -1));
        const curve = new THREE.CatmullRomCurve3([dir.clone().multiplyScalar(0.9), p.clone().multiplyScalar(0.55).add(bend), p.clone().multiplyScalar(0.97)]);
        const link = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.0042, 3, false), strandMaterial(0.28, rand(), -1));
        link.frustumCulled = false;
        this.nodeGroup.add(dot, halo, link);
        this.nodes.push({ dot, halo, link });
      }
      this.coreGroup.add(this.nodeGroup);
    }

    // Warp streaks, attached to the camera
    {
      const n = low ? 180 : 280;
      const base = new THREE.PlaneGeometry(1, 1);
      const g = new THREE.InstancedBufferGeometry();
      g.index = base.index;
      g.setAttribute("position", base.attributes.position);
      const seeds = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) seeds.set([rand() * TAU, 0.6 + Math.pow(rand(), 0.6) * 7, rand(), 0.4 + rand()], i * 4);
      g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
      g.instanceCount = n;
      this.streaks = new THREE.Mesh(
        g,
        new THREE.ShaderMaterial({
          vertexShader: S.streakVert,
          fragmentShader: S.streakFrag,
          uniforms: { uFlow: { value: 0 }, uWarp: { value: 0 } },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
        }),
      );
      this.streaks.frustumCulled = false;
      this.streaks.renderOrder = 10;
      this.camera.add(this.streaks);
    }

    // Wordmark behind the Core
    this.wordmark = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 13 * (360 / 2048)),
      new THREE.MeshBasicMaterial({ map: wordmarkTexture(), transparent: true, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.54), opacity: 0 }),
    );
    this.wordmark.position.set(0, 0.55, -3.4);
    this.scene.add(this.wordmark);
  }

  /* ------------------------------------------------------------ runtime */

  setSize(w: number, h: number) {
    this.w = Math.max(1, Math.round(w));
    this.h = Math.max(1, Math.round(h));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.w, this.h, false);
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(this.w, this.h);
    // bloom at reduced resolution is softer and much cheaper
    this.bloom.resolution.set(this.w * 0.5, this.h * 0.5);
    this.camera.aspect = this.w / this.h;
    if (!this.running && this.compiled) {
      this.update(0);
      this.composer.render();
    }
  }

  /** Pointer in -1..1 (x right, y up). */
  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
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
      this.composer.render();
      this.adapt(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
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

    // Camera
    this.pointerSmooth.lerp(this.pointer, Math.min(1, dt * 2.5));
    const portrait = this.w / this.h < 1;
    // portrait: width is the limit; short screens also leave less room above the words
    const fit = portrait ? Math.pow(this.h / this.w, 0.6) * Math.sqrt(Math.max(1, 780 / this.h)) : 1;
    const az = s.az + (this.opts.interactive ? this.pointerSmooth.x * 0.07 : 0);
    const el = s.el + (this.opts.interactive ? this.pointerSmooth.y * 0.04 : 0);
    const d = s.dist * fit;
    this.camera.position.set(s.tx + d * Math.cos(el) * Math.sin(az), s.ty + d * Math.sin(el), s.tz + d * Math.cos(el) * Math.cos(az));
    this.camera.lookAt(s.tx, s.ty, s.tz);
    this.camera.setViewOffset(this.w, this.h, -s.shiftX * this.w, s.shiftY * this.h, this.w, this.h);
    this.camera.updateProjectionMatrix();

    // Core
    const sc = s.scale * (0.82 + 0.18 * k);
    this.coreGroup.position.y = CORE_Y + s.lift + (rm ? 0 : Math.sin(t * 0.9) * 0.035);
    this.coreGroup.scale.setScalar(CORE_SIZE);
    this.rock.rotation.y = s.spin + Math.sin(t * 0.17) * 0.32 + t * 0.015;
    this.rock.rotation.x = Math.sin(t * 0.13) * 0.06;
    this.rock.scale.setScalar(sc);
    this.rock.material.uniforms.uTime.value = t;
    this.rock.material.uniforms.uAwaken.value = aw;
    // halos are screen-filling up close: fade them as the camera approaches
    const near = smoothstep(3.5, 10, this.camera.position.distanceTo(this.coreGroup.position));
    this.halos[0].material.uniforms.uIntensity.value = (0.04 + 0.16 * aw) * k * (0.25 + 0.75 * near);
    this.halos[1].material.uniforms.uIntensity.value = (0.03 + 0.34 * aw) * k * (0.9 + 0.1 * Math.sin(t * 1.25)) * (0.45 + 0.55 * near);
    this.halos.forEach((h) => (h.visible = k > 0.001));

    this.strandGroup.rotation.y = t * 0.06 + s.spin * 0.5;
    this.strandGroup.scale.setScalar(sc * (0.85 + 0.15 * s.strands));
    for (const m of this.strands) {
      m.material.uniforms.uTime.value = t;
      m.material.uniforms.uIntensity.value = s.strands * k;
    }
    this.strandGroup.visible = s.strands * k > 0.001;

    const em = this.embers.material.uniforms;
    em.uTime.value = t;
    em.uPixel.value = this.dpr * (this.h / 900);
    em.uIntensity.value = s.embers * k * (0.5 + 0.5 * aw);
    this.embers.visible = s.embers > 0.001;

    const du = this.dust.material.uniforms;
    du.uTime.value = t;
    du.uPixel.value = this.dpr * (this.h / 900);
    du.uIntensity.value = s.dust * k;

    this.floor.material.uniforms.uOpacity.value = s.floor * k;
    this.floor.material.uniforms.uAwaken.value = aw;
    this.floor.material.uniforms.uTime.value = t;
    this.floor.visible = s.floor > 0.001;

    // Plinth and its light
    const pv = s.plinth;
    this.plinthGroup.visible = pv > 0.001;
    this.plinth.material.uniforms.uAwaken.value = aw;
    this.plinth.material.uniforms.uOpacity.value = pv;
    // opaque while solid so nothing shows through it; blended only while fading
    this.plinth.material.transparent = pv < 0.999;
    const lineK = pv * k * (0.35 + 1.2 * aw);
    this.plinthLights.forEach((m) => m.material.color.copy(WARM).multiplyScalar(lineK * 1.5));
    this.plate.material.color.copy(WARM).multiplyScalar(pv * k * aw * 0.05);

    // Vitrine: edges rise from the plinth, then the top closes, then the glass
    const v = s.vitrine;
    this.vitrine.visible = v > 0.001;
    const rise = smoothstep(0, 0.6, v);
    const close = smoothstep(0.5, 0.85, v);
    const glass = smoothstep(0.7, 1, v);
    this.vitrineEdges.forEach((m) => {
      m.scale.y = Math.max(0.001, rise);
      m.material.color.copy(WARM).multiplyScalar(0.95 * k);
    });
    this.vitrineTop.forEach((m) => m.material.color.copy(WARM).multiplyScalar(0.95 * close * k));
    this.panes.forEach((m) => (m.material.uniforms.uOpacity.value = glass));

    // Module orbs
    this.orbGroup.visible = s.orbs > 0.001;
    this.orbGroup.rotation.y = s.spin * 0.3 + Math.sin(t * 0.1) * 0.05;
    this.orbs.forEach((o, i) => {
      const hi = Math.max(0, 1 - Math.abs(i - s.activeOrb));
      const on = s.orbs * k;
      const appear = smoothstep(i * 0.08, i * 0.08 + 0.45, s.orbs);
      o.dot.material.color.setRGB(1, 0.8, 0.55).multiplyScalar(appear * (1.2 + hi * 3));
      o.dot.scale.setScalar(0.6 + 0.4 * appear + hi * 0.5);
      o.halo.scale.setScalar((0.45 + hi * 0.7) * appear);
      o.halo.material.uniforms.uIntensity.value = on * appear * (0.35 + hi * 0.9);
      o.link.material.uniforms.uTime.value = t;
      o.link.material.uniforms.uReveal.value = appear;
      o.link.material.uniforms.uIntensity.value = on * (0.25 + hi * 1.1);
    });

    // Tool network
    this.nodeGroup.visible = s.network > 0.001;
    this.nodeGroup.rotation.y = Math.sin(t * 0.1) * 0.08;
    // in portrait the constellation stands taller and narrower so every tool stays on screen
    this.nodeGroup.scale.set(portrait ? 0.58 : 1, portrait ? 1.12 : 1, 1);
    this.nodes.forEach((n, i) => {
      const appear = smoothstep(i * 0.06, i * 0.06 + 0.4, s.network);
      n.dot.material.color.setRGB(1, 0.85, 0.65).multiplyScalar(appear * 2.2);
      n.dot.scale.setScalar(Math.max(0.001, appear));
      n.halo.scale.setScalar(0.5 * appear);
      n.halo.material.uniforms.uIntensity.value = appear * k * 0.6;
      n.link.material.uniforms.uTime.value = t;
      n.link.material.uniforms.uReveal.value = appear;
      n.link.material.uniforms.uIntensity.value = appear * k * 0.9;
    });

    // Warp
    const warp = rm ? 0 : s.warp;
    this.flow += dt * (0.15 + warp * 3.2);
    this.streaks.visible = warp > 0.001;
    this.streaks.material.uniforms.uFlow.value = this.flow;
    this.streaks.material.uniforms.uWarp.value = warp;

    // Wordmark stays centred on screen whatever the scene offset
    const wm = this.wordmark;
    // the wordmark belongs to wide screens; in portrait it would cut across the plinth
    wm.visible = s.wordmark > 0.001 && !portrait;
    wm.material.opacity = s.wordmark * k * 0.1;
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

    // Post
    const fu = this.final.uniforms;
    fu.uWarp.value = warp;
    fu.uFade.value = s.fade;
    fu.uTime.value = t % 100;
    this.bloom.strength = (0.45 + 0.25 * aw) * (0.7 + 0.3 * near) * (1 - 0.35 * warp);

    this.emitAnchors();
  }

  private emitAnchors() {
    const cb = this.opts.onFrame;
    if (!cb) return;
    const s = this.state;
    this.coreGroup.updateMatrixWorld();
    const corePos = this.tmp2.setFromMatrixPosition(this.coreGroup.matrixWorld);
    const coreDist = this.camera.position.distanceTo(corePos);
    const project = (obj: THREE.Object3D, a: Anchor, alpha: number) => {
      obj.getWorldPosition(this.tmp);
      const behind = this.camera.position.distanceTo(this.tmp) > coreDist + 0.4 ? 0.35 : 1;
      this.tmp.project(this.camera);
      a.x = (this.tmp.x * 0.5 + 0.5) * this.w;
      a.y = (-this.tmp.y * 0.5 + 0.5) * this.h;
      a.alpha = this.tmp.z < 1 ? alpha * behind : 0;
    };
    // small screens only name the lit module; wide screens show all six, quietly
    const idle = this.w < 640 || this.h < 520 ? 0 : 0.4;
    this.orbs.forEach((o, i) => {
      const hi = Math.max(0, 1 - Math.abs(i - s.activeOrb));
      project(o.dot, this.anchors.orbs[i], s.orbs * s.intro * (idle + (1 - idle) * hi) * smoothstep(0.3, 0.8, s.orbs));
    });
    this.nodes.forEach((n, i) => project(n.dot, this.anchors.nodes[i], smoothstep(i * 0.06 + 0.2, i * 0.06 + 0.45, s.network) * s.intro));
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
