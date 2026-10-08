/**
 * Chromatography model shared by every visual on the site.
 *
 * - Retention:  tR = t0 · (1 + k)
 * - Band width: σ_t = tR / √N
 * - Resolution: Rs = ΔtR / (2 · (σ1 + σ2))
 * - Ion-exchange eluent strength (stoichiometric model):
 *     log k = log k₀ − (x / y) · log [E]
 *   x = analyte charge, y = eluent ion charge (carbonate: 2). Monovalent anions therefore move
 *   with slope −½, divalent anions (sulfate, hydrogen-phosphate) with slope −1, so changing the
 *   carbonate concentration changes selectivity and can reorder peaks.
 *
 * Anions separate because they compete with the eluent for the fixed quaternary-ammonium sites
 * of the column, not because of their mass.
 */
import { gaussian } from './math';
import { EPA_A } from '../data/nexera';

export interface Peak {
  id: string;
  label: string;
  tR: number;
  sigma: number;
  area: number;
  color: string;
}

/** One colour per EPA 300.1 Part A anion, cool → warm in elution order. */
export const ANION_COLORS = ['#63d3ff', '#7cb8ff', '#999dff', '#b78dff', '#dc8fe0', '#ff9c8c', '#ffbf6a'];
export const CATION_COLORS = ['#6ee7c8', '#63d3ff', '#7cb8ff', '#999dff', '#dc8fe0', '#ffbf6a'];
export const ANALYTE_COLORS = ANION_COLORS;

export function bandSigma(tR: number, plates: number) {
  return tR / Math.sqrt(plates);
}
export function resolution(a: Peak, b: Peak) {
  return Math.abs(b.tR - a.tR) / (2 * (a.sigma + b.sigma));
}
export function peakHeight(p: Peak) {
  return p.area / (p.sigma * Math.sqrt(2 * Math.PI));
}
export function signalAt(t: number, peaks: Peak[], baseline = 0) {
  let s = baseline;
  for (const p of peaks) s += peakHeight(p) * gaussian(t, p.tR, p.sigma);
  return s;
}
export function minResolution(peaks: Peak[]) {
  const s = [...peaks].sort((a, b) => a.tR - b.tR);
  let min = Infinity;
  for (let i = 0; i < s.length - 1; i++) min = Math.min(min, resolution(s[i], s[i + 1]));
  return min;
}

/* ------------------------------------------------------------------ */
/* Hero: the seven EPA 300.1 Part A anions.                            */
/* ------------------------------------------------------------------ */
export const HERO_COLUMN = {
  inlet: -5.0,
  outlet: 4.0,
  suppressor: 5.0, // x of the electrodialytic suppressor
  detector: 6.1, // x of the conductivity cell
  radius: 0.34,
  velocity: 1.0,
  sigma0: 0.04,
  dispersion: 0.02,
  simToMinutes: EPA_A.voidTime / 11.1, // 11.1 scene units of flow path ≙ the 2.7 min void time
};

const DIST = HERO_COLUMN.detector - HERO_COLUMN.inlet;

/** k from the published retention time: tR = t0 (1 + k). */
export const HERO_ANALYTES = EPA_A.peaks.map((p, i) => ({
  id: p.id,
  formula: p.formula,
  tRmin: p.tR,
  k: p.tR / EPA_A.voidTime - 1,
  color: ANION_COLORS[i],
  // apex heights from the application-note figure, normalised (chloride is off-scale there)
  area: Math.min(1.3, p.h / 6.2),
}));

export function heroArrival(k: number) {
  return (DIST * (1 + k)) / HERO_COLUMN.velocity;
}
export function heroSigmaT(k: number) {
  const sx = HERO_COLUMN.sigma0 + HERO_COLUMN.dispersion * Math.sqrt(DIST);
  return sx * (1 + k);
}
export const HERO_SIM_END = heroArrival(HERO_ANALYTES[HERO_ANALYTES.length - 1].k) + 6;

export function heroSignal(tSim: number) {
  let s = 0;
  for (const a of HERO_ANALYTES) s += a.area * gaussian(tSim, heroArrival(a.k), heroSigmaT(a.k));
  return s;
}

/* ------------------------------------------------------------------ */
/* Selectivity explorer: carbonate concentration vs retention.          */
/* ------------------------------------------------------------------ */
export const ELUENT = {
  reference: 4.5, // mmol/L Na2CO3 used in the application note
  min: 2.5,
  // ICDS-Ai is documented for up to 15 mmol/L Na⁺; Na₂CO₃ carries 2 Na⁺, so 7.5 mmol/L is the ceiling
  max: 7.5,
  plates: 12000,
  t0: EPA_A.voidTime,
};
// effective charge ratio x/y for each anion against carbonate (y = 2)
const SLOPE: Record<string, number> = { F: 0.5, Cl: 0.5, NO2: 0.5, Br: 0.5, NO3: 0.5, PO4: 1.0, SO4: 1.0 };

export function eluentPeaks(conc: number): (Peak & { k: number; formula: string })[] {
  return EPA_A.peaks.map((p, i) => {
    const k0 = p.tR / ELUENT.t0 - 1;
    const k = k0 * Math.pow(conc / ELUENT.reference, -SLOPE[p.id]);
    const tR = ELUENT.t0 * (1 + k);
    const sigma = bandSigma(tR, ELUENT.plates);
    // keep each peak's published apex height at the reference condition: area ∝ h·σ_ref
    const sigmaRef = bandSigma(p.tR, ELUENT.plates);
    const area = Math.min(p.h, 7.5) * sigmaRef * Math.sqrt(2 * Math.PI);
    return { id: p.id, label: p.label, formula: p.formula, k, tR, sigma, area, color: ANION_COLORS[i] };
  });
}
