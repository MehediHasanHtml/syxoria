/**
 * GLSL for the Core scene. Every material is hand-written so the whole
 * object stays one coherent light: a dark, faceted mass with a living heat
 * breaking through its fissures.
 */

/* 3D simplex noise — Ian McEwan, Ashima Arts (MIT). */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;


/**
 * The Core's light, as uniforms shared by every material (see PALETTES in
 * look.ts): the heat ramp deep → bright → hot → white-hot. Returns HDR colour.
 */
const HEAT = /* glsl */ `
uniform vec3 uHeat0;
uniform vec3 uHeat1;
uniform vec3 uHeat2;
uniform vec3 uHeat3;
vec3 heat(float h){
  vec3 c = mix(uHeat0, uHeat1, smoothstep(0.0,1.0,h));
  c = mix(c, uHeat2, smoothstep(0.9,2.4,h));
  c = mix(c, uHeat3, smoothstep(2.4,5.0,h));
  return c*h;
}
`;

/* ---------------------------------------------------------------- the rock */

/**
 * The rock is cut into six fragments around its heart, one per module. Each
 * opens its own way (aShard: direction + distance · aPetal: delay, fold,
 * twist, lift), so the Core parts irregularly, like something alive; the one
 * being explored lifts a little further (uPetalHi).
 */
export const rockVert = /* glsl */ `
attribute float aCavity;
attribute vec4 aShard;
attribute vec4 aPetal;
attribute float aSeam;
attribute float aShardId;
attribute float aOrder;
uniform float uOpen;
uniform float uScatter;    // opening sequence: 1 = shards float apart, 0 = the assembled Core
uniform float uTease;      // how many shards have appeared (0..1)
uniform float uTime;
uniform float uPetalHi[6];
varying vec3 vObj;
varying vec3 vWorld;
varying vec3 vRest;
varying vec3 vNormalW;
varying float vCavity;
varying float vSeam;
varying float vShow;
varying float vId;
varying float vHi;
float h11(float n){ return fract(sin(n*127.1 + 311.7) * 43758.5453); }
vec3 rotateAxis(vec3 v, vec3 a, float ang){ float c = cos(ang), s = sin(ang); return v*c + cross(a, v)*s + a*dot(a, v)*(1.0 - c); }
void main(){
  vObj = position;
  vId = aShardId;
  vec3 dir = aShard.xyz;
  float hi = uPetalHi[int(aShardId + 0.5)];
  vHi = hi;
  // each fragment starts parting at its own moment, and moves its own way
  float o = smoothstep(aPetal.x, aPetal.x + 0.72, uOpen);
  vec3 axis = normalize(cross(vec3(0.0, 0.0, 1.0), dir) + 1e-4);
  vec3 pivot = dir*0.55;
  vec3 p = rotateAxis(position - pivot, axis, aPetal.y*o) + pivot;
  p = rotateAxis(p, normalize(dir), aPetal.z*o);
  p += dir * (aShard.w*o + 0.07*hi*smoothstep(0.3, 1.0, uOpen)) + vec3(0.0, aPetal.w*o, 0.0);
  // shards appear one after another during the opening sequence
  vShow = smoothstep(aOrder*0.8, aOrder*0.8 + 0.2, uTease);
  if (uScatter > 0.0) {
    float r1 = h11(aShardId), r2 = h11(aShardId + 17.0), r3 = h11(aShardId + 41.0);
    vec3 c = dir*0.6;
    vec3 ax = normalize(vec3(r1 - 0.5, r2 - 0.5, r3 - 0.5) + 1e-3);
    float ang = uScatter*(1.2 + 2.2*r2) + uTime*(0.06 + 0.08*r3)*uScatter;
    vec3 away = dir*(0.7 + 0.9*r2) + vec3((r1 - 0.5)*1.2, (r3 - 0.5)*0.8, (r2 - 0.5)*1.4);
    // shards still to come wait further out and drift in as they form
    away += dir*1.2*(1.0 - vShow);
    p = c + rotateAxis(p - c, ax, ang) + away*uScatter;
  }
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vRest = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vCavity = aCavity;
  vSeam = aSeam;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const rockFrag = /* glsl */ `
uniform float uTime;
uniform float uAwaken;
uniform float uOpen;
uniform float uScatter;
uniform vec4 uProbe;       // xyz: point under the cursor (object space), w: strength
uniform vec4 uZones[3];    // the brain's three zones: xyz direction (object space), w: how lit
uniform float uBump;       // strength of the micro relief (world units)
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uRimColor;
uniform vec3 uSpill;
varying vec3 vObj;
varying vec3 vWorld;
varying vec3 vRest;
varying vec3 vNormalW;
varying float vCavity;
varying float vSeam;
varying float vShow;
varying float vId;
varying float vHi;
${NOISE}
${HEAT}
vec3 hash33(vec3 p){
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yxz + 19.19);
  return fract((p.xxy + p.yxx) * p.zyx);
}
vec2 voronoi(vec3 x){
  vec3 p = floor(x);
  vec3 f = fract(x);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int k=-1;k<=1;k++) for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++){
    vec3 b = vec3(float(i),float(j),float(k));
    vec3 r = b + hash33(p+b) - f;
    float d = dot(r,r);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2){ d2 = d; }
  }
  return vec2(sqrt(d1), sqrt(d2));
}
void main(){
  // faceted normal from screen derivatives, softened with the smooth one
  vec3 dpx = dFdx(vWorld);
  vec3 dpy = dFdy(vWorld);
  vec3 fN = normalize(cross(dpx, dpy));
  vec3 N = normalize(mix(normalize(vNormalW), fN, 0.55));
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;
  // the silhouette rim reads the shape, not the grain: taken before the relief
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  // micro relief: a rough, crisp stone surface (derivative bump mapping, no texture)
  float grain = snoise(vObj*9.0)*0.5 + snoise(vObj*23.0)*0.25;
  float bump = snoise(vObj*11.0)*0.7 + snoise(vObj*24.0)*0.3;
  {
    float bx = dFdx(bump);
    float by = dFdy(bump);
    vec3 r1 = cross(dpy, N);
    vec3 r2 = cross(N, dpx);
    float det = dot(dpx, r1);
    vec3 grad = sign(det) * (bx*r1 + by*r2);
    N = normalize(abs(det)*N - uBump*grad);
  }

  // triangles bridging two fragments (their corners carry different ids) are the gap;
  // how far they have stretched says how wide it has opened
  float bridge = step(1e-4, fwidth(vId));
  float sw = length(dpx) + length(dpy);
  float sr = length(dFdx(vRest)) + length(dFdy(vRest));
  float gap = bridge * smoothstep(1.3, 2.4, sw / (sr + 1e-6));

  // the opening sequence: shards materialise through a lit dissolve, and float as separate pieces
  float front = 0.0;
  if (uScatter > 0.001) {
    if (bridge > 0.5) discard;
    float grow = snoise(vObj*5.0)*0.5 + 0.5;
    if (grow > vShow*1.08) discard;
    front = (1.0 - smoothstep(0.0, 0.05, vShow*1.08 - grow)) * step(vShow, 0.999);
  }

  // near-black volcanic stone, a faint warm cast
  float tone = 0.02 + 0.012*snoise(vObj*2.4) + 0.006*grain;
  vec3 albedo = vec3(tone*1.04, tone, tone*0.94);

  // the cursor wakes the stone locally, like a hand held over embers
  vec3 dp = vObj - uProbe.xyz;
  float probe = uProbe.w * exp(-dot(dp, dp) * 3.5);
  vec3 nObj = normalize(vObj);
  float t = uTime;

  // the brain's three zones, each with its own behaviour:
  //   connect (0)     light runs IN along the fissures, converging on its area — signals arriving
  //   understand (1)  the heart glows, its light spreading the more it is lit
  //   act (2)         pulses leave its area and run OUT along the fissures — action going out
  float dIn = 1.0 - dot(nObj, uZones[0].xyz);
  float dHeart = 1.0 - dot(nObj, uZones[1].xyz);
  float dOut = 1.0 - dot(nObj, uZones[2].xyz);
  float zone = uZones[0].w * exp(-dIn*7.0) * 0.6
             + uZones[1].w * exp(-dHeart * mix(9.0, 3.2, uZones[1].w))
             + uZones[2].w * exp(-dOut*7.0) * 0.6;
  float waveIn = pow(0.5 + 0.5*sin(dIn*30.0 + t*3.2), 6.0) * smoothstep(0.8, 0.05, dIn) * uZones[0].w;
  float waveOut = pow(0.5 + 0.5*sin(dOut*30.0 - t*3.2), 6.0) * smoothstep(0.8, 0.05, dOut) * uZones[2].w;
  float waves = waveIn + waveOut;
  float aw = clamp(uAwaken + probe*0.5 + zone*0.55 + vHi*0.3, 0.0, 1.4);

  float diff = max(dot(N, uKeyDir), 0.0);
  float fill = max(dot(N, uFillDir), 0.0);
  vec3 H = normalize(uKeyDir + V);
  float glint = smoothstep(0.35, 0.85, grain + 0.45);
  float spec = pow(max(dot(N, H), 0.0), 38.0) * (0.15 + 0.85*glint);
  vec3 col = albedo * (uKeyColor*diff*1.2 + uFillColor*fill*0.7 + 0.05)
           + uKeyColor*spec*0.16
           + uRimColor*fres*0.28;

  // fissures: cell borders of a warped voronoi field, only in "open" zones
  vec3 q = vObj*2.5 + 0.28*vec3(snoise(vObj*1.6), snoise(vObj*1.6+7.1), snoise(vObj*1.6+3.3));
  vec2 v = voronoi(q);
  float edge = v.y - v.x;
  float zoneMask = smoothstep(-0.3, 0.55, snoise(vObj*1.2 + 2.0));
  float reach = clamp(zoneMask*0.85 + vCavity*1.6 + probe*0.6 + zone*0.7 + waves*0.6 + vHi*0.5, 0.0, 1.0);
  float width = mix(0.02, 0.085, clamp(aw, 0.0, 1.0)) * reach + 1e-4;
  float crack = 1.0 - smoothstep(0.0, width, edge);
  crack *= crack;
  float spill = (1.0 - smoothstep(0.0, width*4.5, edge)) * reach;
  float flow = 0.5 + 0.5*snoise(vObj*3.4 + vec3(0.0, t*0.32, t*0.18));
  float pulse = 0.88 + 0.12*sin(t*1.25) + 0.05*sin(t*3.1);
  float cav = vCavity*vCavity;
  float core = cav * (0.45 + 0.9*flow + 1.2*crack);
  // the seams the Core opens along glow first, as it gets ready to part
  float seam = 1.0 - smoothstep(0.0, 0.004 + 0.012*uOpen, vSeam);
  seam *= seam * smoothstep(0.0, 0.25, uOpen);
  float h = (crack*reach*(0.4+flow)*3.2 + core*1.9 + spill*0.3 + seam*(0.6+flow)*2.0) * aw * pulse;
  // the zones' travelling light, carried by the fissures
  h += waves * (crack*4.2 + spill*0.6) * pulse;
  col += heat(h);
  // surfaces near the heat catch its light
  col += uSpill * spill * aw * 0.08 * diff;

  // opened: the stone really parts — no skin across the gap, you see into it: a dark inner
  // shell warmed by the nucleus, and every broken rim lit (brighter on the module explored)
  if (uOpen > 0.002) {
    if (gap > 0.35) discard;
    // only the real broken edges: thin, and not at the heart where every seam meets
    float rim = (1.0 - smoothstep(0.0, 0.022, vSeam)) * smoothstep(0.12, 0.42, length(vObj.xy));
    col += heat((0.65 + 0.5*flow) * (1.0 + 0.5*vHi)) * rim * smoothstep(0.0, 0.3, uOpen);
    // inside: dark stone, lit only along its own fissures by the nucleus
    if (!gl_FrontFacing) col = albedo*0.45 + heat((crack*1.5 + spill*0.15 + 0.05 + 0.06*flow) * uOpen * (1.0 + 0.6*vHi)) + heat(0.9) * rim * uOpen;
  }

  // scattered (the opening sequence): deep, polished pieces whose broken edges hold a low light
  if (uScatter > 0.001) {
    float broken = 1.0 - smoothstep(0.0, 0.09, vSeam);
    col *= mix(1.0, gl_FrontFacing ? 0.8 : 0.35, uScatter);
    col += uKeyColor * pow(max(dot(N, H), 0.0), 60.0) * 0.3 * uScatter;
    col += uRimColor * fres * 0.12 * uScatter;
    col += heat(0.5 + 0.4*flow) * (broken*0.5 + front*0.65) * uScatter;
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------- debris */

/** Small stone chips drifting out of the opened Core (instanced). */
export const debrisVert = /* glsl */ `
varying vec3 vWorld;
varying vec3 vObj;
void main(){
  vec4 local = vec4(position, 1.0);
  #ifdef USE_INSTANCING
  local = instanceMatrix * local;
  #endif
  vObj = position;
  vec4 w = modelMatrix * local;
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const debrisFrag = /* glsl */ `
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uRimColor;
uniform float uIntensity;
varying vec3 vWorld;
varying vec3 vObj;
${HEAT}
void main(){
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;
  float diff = max(dot(N, uKeyDir), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
  vec3 H = normalize(uKeyDir + V);
  vec3 col = vec3(0.022, 0.021, 0.02) * (uKeyColor*diff*1.3 + 0.08)
           + uKeyColor * pow(max(dot(N, H), 0.0), 50.0) * 0.25
           + uRimColor * fres * 0.25
           + heat(0.9) * fres * 0.35;
  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

/* ------------------------------------------------------- glow billboards */

export const haloVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  // camera-facing quad
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec2 scale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
  mv.xy += position.xy * scale;
  gl_Position = projectionMatrix * mv;
}
`;

export const haloFrag = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColor;
uniform float uFalloff;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), uFalloff);
  gl_FragColor = vec4(uColor * a * uIntensity, 1.0);
}
`;

/* -------------------------------------------------------------- particles */

export const emberVert = /* glsl */ `
attribute vec4 aSeed; // radius, angle, height, speed
uniform float uTime;
uniform float uPixel;
uniform float uHeight;
uniform float uSpread;
varying float vAlpha;
varying float vHeat;
void main(){
  float r = aSeed.x * uSpread;
  float ang = aSeed.y + uTime * aSeed.w * 0.25;
  float y = mod(aSeed.z + uTime * aSeed.w * 0.22, uHeight) - uHeight*0.5;
  vec3 p = vec3(cos(ang)*r, y, sin(ang)*r);
  p.x += sin(uTime*0.7 + aSeed.y*3.0)*0.05;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float life = y/uHeight + 0.5;
  vAlpha = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.55, life);
  vHeat = fract(aSeed.y*7.13);
  float size = mix(1.2, 3.4, fract(aSeed.x*13.7)) * (0.7 + 0.6*sin(uTime*2.0 + aSeed.y*11.0)*0.5 + 0.3);
  gl_PointSize = size * uPixel * (4.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const emberFrag = /* glsl */ `
uniform float uIntensity;
uniform vec3 uEmber0;
uniform vec3 uEmber1;
varying float vAlpha;
varying float vHeat;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 2.2) * vAlpha;
  vec3 c = mix(uEmber0, uEmber1, vHeat);
  gl_FragColor = vec4(c * a * uIntensity * 2.2, 1.0);
}
`;

export const dustVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uPixel;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y = mod(p.y + uTime*0.05*aSeed.w + 6.0, 12.0) - 6.0;
  p.x += sin(uTime*0.1 + aSeed.x*6.28)*0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vAlpha = (0.35 + 0.65*abs(sin(uTime*0.6 + aSeed.y*20.0))) * smoothstep(40.0, 6.0, -mv.z) * smoothstep(0.4, 2.0, -mv.z);
  gl_PointSize = mix(0.8, 2.2, aSeed.z) * uPixel * (6.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const dustFrag = /* glsl */ `
uniform float uIntensity;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 1.8) * vAlpha;
  gl_FragColor = vec4(vec3(0.85,0.82,0.78) * a * uIntensity * 0.55, 1.0);
}
`;

/* ------------------------------------------------------------ the wiring */

export const branchVert = /* glsl */ `
varying float vU;
varying vec3 vWorld;
varying vec3 vNormalW;
void main(){
  vU = uv.x;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/**
 * A wire between the Core and a tool. It starts at the Core (vU = 0): hot
 * there, like sap, cooling to graphite along its length; light travels into
 * the Core (uFlow -1). Pointing at the tool sends one brighter pulse along
 * it (uShot: where the pulse is, uShotAmt: how bright).
 */
export const branchFrag = /* glsl */ `
uniform float uTime;
uniform float uGrow;       // how much of the line is drawn (0..1)
uniform float uHi;         // pointed at (0..1)
uniform float uDim;        // another wire is pointed at (0..1)
uniform float uIntensity;
uniform float uFlow;       // 1 outwards, -1 inwards
uniform float uPulse;      // strength of the travelling light
uniform float uShot;
uniform float uShotAmt;
uniform vec3 uCool;
uniform vec3 uWarm;
varying float vU;
varying vec3 vWorld;
varying vec3 vNormalW;
void main(){
  if (vU > uGrow) discard;
  vec3 V = normalize(cameraPosition - vWorld);
  float edge = 1.0 - abs(dot(normalize(vNormalW), V));
  float sap = pow(1.0 - vU, 2.4);
  float tip = smoothstep(0.08, 0.0, uGrow - vU) * step(uGrow, 0.999);
  float ph = fract(vU*1.4 - uTime*0.22*uFlow);
  float comet = uFlow > 0.0 ? exp(-(1.0 - ph)*9.0) : exp(-ph*9.0);
  float shot = exp(-pow((vU - uShot) * 9.0, 2.0)) * uShotAmt;
  vec3 col = uCool * (0.45 + 0.55*edge + 0.5*uHi) * (1.0 - 0.6*uDim);
  col += uWarm * (sap*(0.45 + 0.6*uHi)*(1.0 - 0.5*uDim) + comet*uPulse*(1.0 - 0.5*uDim) + tip*1.1 + 0.25*uHi + shot*3.0);
  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

/* ------------------------------------------------------------- the stars */

/** A distant starfield: fine cold points, a few warm ones, some slowly twinkling. */
export const starVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uPixel;
varying float vAlpha;
varying float vWarm;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 0.55 + 0.45*sin(uTime*(0.4 + aSeed.y*1.4) + aSeed.x*40.0);
  vAlpha = mix(0.3, 1.0, aSeed.z) * mix(1.0, tw, step(0.65, aSeed.w));
  vWarm = step(0.88, aSeed.y);
  gl_PointSize = mix(0.8, 2.3, aSeed.z*aSeed.z*aSeed.z) * uPixel;
  gl_Position = projectionMatrix * mv;
}
`;

export const starFrag = /* glsl */ `
uniform float uIntensity;
varying float vAlpha;
varying float vWarm;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 1.6) * vAlpha;
  vec3 c = mix(vec3(0.86,0.9,1.0), vec3(1.0,0.92,0.84), vWarm);
  gl_FragColor = vec4(c * a * uIntensity, 1.0);
}
`;

/* ----------------------------------------------------------- the ground */

export const floorVert = /* glsl */ `
varying vec3 vWorld;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** Topographic contour lines, a pool of the Core's light under it. */
export const floorFrag = /* glsl */ `
uniform float uOpacity;
uniform float uAwaken;
uniform float uTime;
uniform vec3 uPool;
varying vec3 vWorld;
${NOISE}
void main(){
  vec2 p = vWorld.xz;
  float r = length(p);
  float h = r*0.55 + snoise(vec3(p*0.11, 0.0))*1.1 + snoise(vec3(p*0.27, 3.0))*0.25;
  float k = h*1.6 - uTime*0.02;
  float line = 1.0 - min(abs(fract(k - 0.5) - 0.5) / fwidth(k), 1.0);
  float fade = smoothstep(19.0, 4.0, r) * smoothstep(1.45, 2.4, r);
  vec3 col = vec3(0.62,0.62,0.6) * line * 0.05 * fade;
  float pool = exp(-r*0.7) * uAwaken;
  col += uPool * pool * (0.02 + line*0.22) * smoothstep(1.3, 2.0, r);
  gl_FragColor = vec4(col * uOpacity, 1.0);
}
`;

/* --------------------------------------------------------------- plinth */

export const plinthVert = /* glsl */ `
varying vec3 vObj;
varying vec3 vWorld;
varying vec3 vNormalW;
void main(){
  vObj = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** Black marble: fine pale veins, lacquered highlight, the Core's light from above. */
export const plinthFrag = /* glsl */ `
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uGlow;
uniform float uAwaken;
uniform float uTopY;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vWorld;
varying vec3 vNormalW;
${NOISE}
void main(){
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 w = vObj*1.1 + 0.9*vec3(snoise(vObj*0.6), snoise(vObj*0.6+4.0), snoise(vObj*0.6+9.0));
  float vein = 1.0 - smoothstep(0.0, 0.045, abs(snoise(w)));
  float vein2 = 1.0 - smoothstep(0.0, 0.02, abs(snoise(w*2.3+5.0)));
  float tone = 0.011 + 0.004*snoise(vObj*4.0) + vein*0.034 + vein2*0.014;
  vec3 albedo = vec3(tone);
  float diff = max(dot(N, uKeyDir), 0.0);
  vec3 H = normalize(uKeyDir + V);
  float spec = pow(max(dot(N, H), 0.0), 110.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  vec3 col = albedo*(uKeyColor*diff*0.9 + 0.06) + uKeyColor*spec*0.45 + vec3(0.5)*fres*0.025;

  float top = step(0.9, N.y);
  float r = length(vWorld.xz);
  col += uGlow * top * exp(-r*r*2.2) * uAwaken * 0.14;
  float side = 1.0 - top;
  col += uGlow * side * exp(-(uTopY - vWorld.y)*9.0) * uAwaken * 0.15;
  gl_FragColor = vec4(col, uOpacity);
}
`;

/* ---------------------------------------------------------------- glass */

export const glassFrag = /* glsl */ `
uniform float uOpacity;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  float sheen = smoothstep(0.08, 0.0, abs(vUv.x - vUv.y*0.55 - 0.18)) * 0.6
              + smoothstep(0.03, 0.0, abs(vUv.x - vUv.y*0.55 - 0.32)) * 0.3;
  float edge = smoothstep(0.1, 0.0, min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)));
  float base = 0.006 + edge*0.02 + sheen*0.035 + smoothstep(0.3, 0.0, vUv.y)*0.012;
  gl_FragColor = vec4(uTint * base * uOpacity, 1.0);
}
`;

export const glassVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* ------------------------------------------------------------ final pass */

export const finalPass = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.55 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5;
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      // display space (after tone mapping)
      float vig = smoothstep(0.95, 0.25, length(c*vec2(1.0, 0.85)));
      col *= mix(1.0, vig, uVignette);
      // lift black to the page canvas colour (#08090a) so the scene sits flush with the page
      vec3 bg = vec3(8.0, 9.0, 10.0) / 255.0;
      col = col + bg * (1.0 - col);
      float g = fract(sin(dot(vUv*vec2(1873.1, 4121.7) + uTime, vec2(12.9898, 78.233)))*43758.5453);
      col += (g - 0.5) * (1.5 / 255.0);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};
