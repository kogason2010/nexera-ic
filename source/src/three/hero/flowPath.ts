import * as THREE from 'three';
import { EPA_A } from '../../data/nexera';
import { ANION_COLORS } from '../../utils/chroma';

/**
 * One continuous liquid flow path, following the Nexera IC flow chart in the EPA 300.1 Part A
 * application note: eluent → pump → autosampler injection → guard + analytical column (column oven)
 * → suppressor → conductivity cell → back through the suppressor's regenerant channels → waste.
 *
 * Every point of the path has an arc-length coordinate `s`. Liquid moves along `s` at constant
 * speed; dissolved sample anions travel as concentration bands whose positions follow the
 * retention model below, so the 3D bands and the chromatogram come from the same numbers.
 */

export type SegKind = 'tube' | 'bottle' | 'pump' | 'valve' | 'loop' | 'guard' | 'column' | 'supp' | 'cell' | 'regen';

type WP = [number, number, number, SegKind?];

// geometry anchors (scene units; not to scale between components)
export const LAYOUT = {
  bottle: { x: -15.6, y: -1.55, h: 2.5, r: 0.62 },
  pump: { x: -12.45, y: -0.55 },
  valve: { x: -9.6, y: 0.25, r: 0.55 },
  loop: { x: -9.6, y: -1.55, r: 0.52 },
  guard: { x0: -8.25, x1: -7.45, r: 0.2 },
  column: { x0: -6.95, x1: 3.05, r: 0.42, win0: -6.25, win1: 2.35 },
  supp: { x0: 4.35, x1: 6.85, y: 0, ch: 0.45 },
  cell: { x0: 8.3, x1: 8.95, y: 0 },
  inset: { x: 8.65, y: 2.0, len: 3.0, h: 0.95 },
  waste: { x: 7.45, y: -3.05 },
};

const L = LAYOUT;
const loopPts: WP[] = [];
{
  // sample loop: a flat coil hanging below the injection valve
  const turns = 1.75;
  const n = 70;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (i / n) * Math.PI * 2 * turns;
    const r = L.loop.r - (i / n) * 0.16;
    loopPts.push([L.loop.x + Math.cos(a) * r * 0.95, L.loop.y + Math.sin(a) * r, -0.1 + (i / n) * 0.2, 'loop']);
  }
}

const WAYPOINTS: WP[] = [
  [L.bottle.x, L.bottle.y + 0.15, 0, 'bottle'],
  [L.bottle.x, L.bottle.y + L.bottle.h + 0.35, 0, 'tube'],
  [-13.6, L.bottle.y + L.bottle.h + 0.35, 0, 'tube'],
  [-13.6, -0.25, 0, 'tube'],
  [-12.95, -0.25, 0, 'pump'],
  [-11.95, -0.25, 0, 'tube'],
  [-11.0, -0.25, 0, 'tube'],
  [-11.0, L.valve.y, 0, 'tube'],
  [L.valve.x - 0.42, L.valve.y, 0.05, 'valve'],
  [L.valve.x - 0.22, L.valve.y - 0.38, 0.05, 'loop'],
  [L.loop.x - 0.25, L.loop.y + L.loop.r + 0.25, -0.1, 'loop'],
  ...loopPts,
  [L.loop.x + 0.25, L.loop.y + L.loop.r + 0.25, 0.1, 'loop'],
  [L.valve.x + 0.22, L.valve.y - 0.38, 0.05, 'valve'],
  [L.valve.x + 0.42, L.valve.y, 0.05, 'tube'],
  [-8.75, L.valve.y, 0, 'tube'],
  [-8.75, 0, 0, 'tube'],
  [L.guard.x0, 0, 0, 'guard'],
  [L.guard.x1, 0, 0, 'tube'],
  [L.column.x0, 0, 0, 'column'],
  [L.column.x1, 0, 0, 'tube'],
  [L.supp.x0, 0, 0, 'supp'],
  [L.supp.x1, 0, 0, 'tube'],
  [L.cell.x0, 0, 0, 'cell'],
  [L.cell.x1, 0, 0, 'tube'],
  [9.45, 0, 0, 'tube'],
  [9.45, 1.15, 0, 'tube'],
  [7.15, 1.15, 0, 'tube'],
  [7.15, L.supp.ch, 0, 'tube'],
  [L.supp.x1, L.supp.ch, 0, 'regen'],
  [L.supp.x0, L.supp.ch, 0, 'tube'],
  [4.0, L.supp.ch, -0.05, 'tube'],
  [4.0, L.supp.ch, -0.55, 'tube'],
  [4.0, -L.supp.ch, -0.55, 'tube'],
  [4.0, -L.supp.ch, 0, 'tube'],
  [L.supp.x0, -L.supp.ch, 0, 'regen'],
  [L.supp.x1, -L.supp.ch, 0, 'tube'],
  [7.45, -L.supp.ch, 0, 'tube'],
  [7.45, L.waste.y + 1.0, 0, 'tube'],
];

export interface PathSample {
  p: THREE.Vector3;
  s: number;
  kind: SegKind;
}

/** Densely sampled path with small rounded bends at corners. */
function buildPath(): PathSample[] {
  const out: PathSample[] = [];
  const v = WAYPOINTS.map((w) => new THREE.Vector3(w[0], w[1], w[2]));
  const kinds = WAYPOINTS.map((w) => w[3] ?? 'tube');
  let s = 0;
  let prev: THREE.Vector3 | null = null;
  const push = (p: THREE.Vector3, kind: SegKind) => {
    if (prev) s += prev.distanceTo(p);
    out.push({ p: p.clone(), s, kind });
    prev = p.clone();
  };
  const STEP = 0.03;
  const line = (a: THREE.Vector3, b: THREE.Vector3, kind: SegKind) => {
    const n = Math.max(1, Math.ceil(a.distanceTo(b) / STEP));
    for (let i = 1; i <= n; i++) push(a.clone().lerp(b, i / n), kind);
  };
  push(v[0], kinds[0]);
  let cur = v[0].clone();
  for (let i = 1; i < v.length - 1; i++) {
    const a = v[i].clone().sub(v[i - 1]);
    const b = v[i + 1].clone().sub(v[i]);
    const r = Math.min(0.22, a.length() / 2, b.length() / 2);
    const corner = a.clone().normalize().dot(b.clone().normalize()) < 0.995;
    if (!corner) {
      line(cur, v[i], kinds[i - 1]);
      cur = v[i].clone();
      continue;
    }
    const p1 = v[i].clone().sub(a.normalize().multiplyScalar(r));
    const p2 = v[i].clone().add(b.normalize().multiplyScalar(r));
    line(cur, p1, kinds[i - 1]);
    const q = new THREE.QuadraticBezierCurve3(p1, v[i].clone(), p2);
    const n = 8;
    for (let k = 1; k <= n; k++) push(q.getPoint(k / n), kinds[i]);
    cur = p2;
  }
  line(cur, v[v.length - 1], kinds[v.length - 2]);
  return out;
}

export const PATH = buildPath();
export const PATH_LENGTH = PATH[PATH.length - 1].s;

function firstS(kind: SegKind) {
  return PATH.find((q) => q.kind === kind)!.s;
}
function lastS(kind: SegKind) {
  let s = 0;
  for (const q of PATH) if (q.kind === kind) s = q.s;
  return s;
}
/** Arc length of the point nearest a world x on a straight horizontal stretch at y = 0. */
function sAtX(x: number, kind: SegKind) {
  let best = 0;
  let d = Infinity;
  for (const q of PATH) {
    if (q.kind !== kind && kind !== 'tube') continue;
    const dd = Math.abs(q.p.x - x) + Math.abs(q.p.y) * 4;
    if (dd < d) {
      d = dd;
      best = q.s;
    }
  }
  return best;
}

export const S = {
  loopIn: firstS('loop'),
  loopOut: lastS('loop'),
  colIn: firstS('column'),
  colOut: lastS('column'),
  suppIn: firstS('supp'),
  suppOut: lastS('supp'),
  cellIn: firstS('cell'),
  cellOut: lastS('cell'),
  get loopMid() {
    return (this.loopIn + this.loopOut) / 2;
  },
};
// silence unused helper in production builds
void sAtX;

/** Sub-ranges of the path drawn as small-bore tubing (everything outside the hardware bodies). */
export function tubeRanges(): [number, number][] {
  const r: [number, number][] = [];
  let start = -1;
  PATH.forEach((q, i) => {
    const t = q.kind === 'tube' || q.kind === 'loop' || q.kind === 'bottle';
    if (t && start < 0) start = i;
    if ((!t || i === PATH.length - 1) && start >= 0) {
      r.push([start, Math.min(PATH.length - 1, i)]);
      start = -1;
    }
  });
  return r;
}

/* ------------------------------------------------------------------ */
/* Band transport                                                       */
/* ------------------------------------------------------------------ */

export const FLOW_V = 1; // liquid speed, scene units per simulation second
const L_TOT = S.cellIn + 0.3 - S.loopMid; // injection point → detection volume
const L_COL = S.colOut - S.colIn;
const PLATES = 4200;

/** Converts simulation time to chromatogram minutes: the unretained front (k = 0) arrives at t0. */
export const SIM_TO_MIN = EPA_A.voidTime / (L_TOT / FLOW_V);
export const MIN_TO_SIM = 1 / SIM_TO_MIN;

export interface Band {
  id: string;
  formula: string;
  color: string;
  tR: number; // published retention time, min
  h: number; // published apex height
  k: number; // retention factor, tR = t0 (1 + k)
  kc: number; // in-column retention factor for this path geometry
  sigmaMin: number; // peak standard deviation in minutes
  arrive: number; // sim time the band centre reaches the cell
  sigmaExit: number; // spatial σ when leaving the column
}

export const BANDS: Band[] = EPA_A.peaks.map((p, i) => {
  const k = p.tR / EPA_A.voidTime - 1;
  const kc = (k * L_TOT) / L_COL; // so that arrival time ∝ (1 + k), exactly as tR = t0 (1 + k)
  const sigmaMin = p.tR / Math.sqrt(PLATES);
  const sigmaSim = sigmaMin * MIN_TO_SIM;
  return {
    id: p.id,
    formula: p.formula,
    color: ANION_COLORS[i],
    tR: p.tR,
    h: p.h,
    k,
    kc,
    sigmaMin,
    arrive: (L_TOT * (1 + k)) / FLOW_V,
    sigmaExit: (sigmaSim * FLOW_V) / (1 + kc),
  };
});

const SIGMA0 = 0.22; // injected plug

/** Band centre (path s) and spatial σ at simulation time t. */
export function bandState(b: Band, t: number, out: { c: number; sigma: number; inColumn: boolean }) {
  const pre = S.colIn - S.loopMid;
  const d = t * FLOW_V;
  if (d <= pre) {
    out.c = S.loopMid + d;
    out.sigma = SIGMA0;
    out.inColumn = false;
    return out;
  }
  const tc = t - pre / FLOW_V;
  const xin = (tc * FLOW_V) / (1 + b.kc);
  if (xin <= L_COL) {
    out.c = S.colIn + xin;
    out.sigma = SIGMA0 + (b.sigmaExit - SIGMA0 * 0.4) * Math.sqrt(xin / L_COL);
    out.inColumn = true;
    return out;
  }
  const tExit = pre / FLOW_V + (L_COL * (1 + b.kc)) / FLOW_V;
  out.c = S.colOut + (t - tExit) * FLOW_V;
  out.sigma = Math.max(SIGMA0, b.sigmaMin * MIN_TO_SIM * FLOW_V);
  out.inColumn = false;
  return out;
}

/** Simulation time at which a band centre reaches path coordinate s (monotonic search). */
export function timeToReach(b: Band, s: number) {
  let lo = 0;
  let hi = 400;
  const o = { c: 0, sigma: 0, inColumn: false };
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    bandState(b, mid, o);
    if (o.c < s) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** Suppressed-conductivity chromatogram (min → published-height units), incl. the water dip at t0. */
export function chromAt(min: number) {
  let y = 0.06;
  for (const b of BANDS) y += b.h * Math.exp(-0.5 * ((min - b.tR) / b.sigmaMin) ** 2);
  y -= 0.35 * Math.exp(-0.5 * ((min - EPA_A.voidTime) / 0.06) ** 2);
  return y;
}

/** Path sample lookup by arc length (linear scan from a hint is fast enough for UI use). */
export function pointAtS(s: number, target = new THREE.Vector3()) {
  let lo = 0;
  let hi = PATH.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PATH[m].s < s) lo = m;
    else hi = m;
  }
  const a = PATH[lo];
  const b = PATH[hi];
  const f = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
  return target.copy(a.p).lerp(b.p, Math.min(1, Math.max(0, f)));
}
