import { clamp, invLerp, lerp, smoothstep } from '../../utils/math';
import { BANDS, MIN_TO_SIM, S, timeToReach } from './flowPath';

/**
 * The hero's choreography as pure functions of scroll progress p ∈ [0, 1].
 *
 *  0.00–0.18  Eluent & injection — eluent flows; the valve switches and the sample plug leaves the loop
 *  0.18–0.42  Separation         — bands enter the ion-exchange column and pull apart
 *  0.42–0.58  Suppression        — the first bands cross the membrane suppressor
 *  0.58–0.86  Detection          — every band passes the conductivity cell; the chromatogram is written
 *  0.86–1.00  Result             — the whole flow path and finished chromatogram
 */
export const PHASES = [
  { id: 'inject', label: 'Injection', start: 0.0, end: 0.18 },
  { id: 'separation', label: 'Separation', start: 0.18, end: 0.42 },
  { id: 'suppression', label: 'Suppression', start: 0.42, end: 0.58 },
  { id: 'detection', label: 'Detection', start: 0.58, end: 0.86 },
  { id: 'insight', label: 'Result', start: 0.86, end: 1.0 },
] as const;

const F = BANDS[0];
const T_SEP_END = timeToReach(F, S.suppIn - 0.6); // fluoride about to leave the column tubing
const T_SUPP_END = timeToReach(F, S.cellIn - 0.25); // fluoride about to enter the cell
const T_END = 20 * MIN_TO_SIM; // 20 min run

export function simClock(p: number) {
  if (p < 0.17) return 0;
  if (p < 0.42) return lerp(0, T_SEP_END, invLerp(0.17, 0.42, p));
  if (p < 0.58) return lerp(T_SEP_END, T_SUPP_END, invLerp(0.42, 0.58, p));
  if (p < 0.86) return lerp(T_SUPP_END, T_END, invLerp(0.58, 0.86, p));
  return T_END;
}

export function injectAmount(p: number) {
  return smoothstep(0.09, 0.15, p);
}

export interface CamKey {
  p: number;
  pos: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_KEYS: CamKey[] = [
  { p: 0.0, pos: [-16.6, 0.5, 11.0], target: [-17.5, -0.3, 0] },
  { p: 0.08, pos: [-11.9, 0.3, 7.6], target: [-12.3, -0.7, 0] },
  { p: 0.15, pos: [-8.9, 0.3, 6.2], target: [-9.3, -0.8, 0] },
  { p: 0.22, pos: [-6.3, 0.6, 5.2], target: [-6.4, -0.45, 0] },
  { p: 0.32, pos: [-3.4, 0.6, 4.3], target: [-3.5, -0.4, 0] },
  { p: 0.41, pos: [-1.4, 1.0, 8.4], target: [-1.5, -1.1, 0] },
  { p: 0.47, pos: [6.0, 0.1, 5.4], target: [5.9, -0.54, 0] },
  { p: 0.56, pos: [6.4, 0.2, 5.6], target: [6.3, -0.5, 0] },
  { p: 0.64, pos: [9.8, 1.25, 8.2], target: [9.6, 0.85, 0] },
  { p: 0.8, pos: [9.7, 1.3, 8.6], target: [9.5, 0.85, 0] },
  { p: 0.9, pos: [-3.1, 2.0, 27.0], target: [-3.1, 1.0, 0] },
  { p: 1.0, pos: [-3.1, 2.1, 28.0], target: [-3.1, 1.0, 0] },
];

/** Reduced motion: one composed frame showing the whole flow path. */
export const STATIC_CAMERA: CamKey = { p: 0, pos: [-3.1, 1.3, 28.0], target: [-3.1, 0.1, 0] };

export function cameraAt(p: number, out: { pos: number[]; target: number[] }) {
  const keys = CAMERA_KEYS;
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = clamp((p - a.p) / (b.p - a.p));
  const e = t * t * (3 - 2 * t);
  for (let j = 0; j < 3; j++) {
    out.pos[j] = lerp(a.pos[j], b.pos[j], e);
    out.target[j] = lerp(a.target[j], b.target[j], e);
  }
  return out;
}

export function activePhase(p: number) {
  for (let i = PHASES.length - 1; i >= 0; i--) if (p >= PHASES[i].start) return i;
  return 0;
}
