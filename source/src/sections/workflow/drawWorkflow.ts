import { clamp, gaussian, rng, smoothstep } from '../../utils/math';

let MONO = '500 12px "IBM Plex Mono", ui-monospace, monospace';
let BIG = '500 16px "IBM Plex Mono", ui-monospace, monospace';
let PHONE = false;
const SOFT = 'rgba(170,195,225,0.12)';
const TEXT = 'rgba(214,226,238,0.9)';
const MUTED = 'rgba(176,189,205,0.95)';
const NA = '#ffb877'; // sodium (eluent cation)
const H = '#8fe3ff'; // hydrogen ion
const CO3 = '#8ea2ff'; // carbonate
const ANA = '#c39bff'; // analyte anion

type C = CanvasRenderingContext2D;

const R = rng(9);
const P = Array.from({ length: 160 }, () => ({ a: R(), b: R(), c: R(), d: R() }));

function label(ctx: C, s: string, x: number, y: number, color = MUTED, align: CanvasTextAlign = 'left', font = MONO) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}
function ion(ctx: C, x: number, y: number, color: string, sign: string, r = 5) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(8,10,14,0.95)';
  ctx.font = '700 8px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(sign, x, y + 3);
}
function weight(s: number, i: number) {
  return 1 - smoothstep(0.32, 0.62, Math.abs(s - (i + 0.5)));
}

/** Mini chromatogram: background level + noise + analyte peaks. */
function trace(ctx: C, x0: number, y0: number, w: number, h: number, bg: number, noise: number, gain: number, t: number, color: string, draw = 1) {
  ctx.strokeStyle = SOFT;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + w, y0);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const N = 160;
  for (let i = 0; i <= N * draw; i++) {
    const f = i / N;
    const n = noise * (Math.sin(i * 12.9898 + t * 3) * Math.cos(i * 4.1414 - t * 2));
    const pk = gain * (0.7 * gaussian(f, 0.3, 0.025) + 0.5 * gaussian(f, 0.52, 0.03) + 0.85 * gaussian(f, 0.76, 0.035));
    const y = y0 - (bg + n + pk) * h;
    if (i === 0) ctx.moveTo(x0, y);
    else ctx.lineTo(x0 + f * w, y);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

/* 01 — the eluent itself conducts */
function drawProblem(ctx: C, w: number, h: number, t: number, lp: number) {
  const cx = w * 0.27;
  const top = h * 0.2;
  const bot = h * 0.62;
  ctx.fillStyle = 'rgba(190,200,212,0.6)';
  ctx.fillRect(cx - 120, top - 8, 240, 6);
  ctx.fillRect(cx - 120, bot + 2, 240, 6);
  label(ctx, 'CONDUCTIVITY CELL', cx - 120, top - 18);
  const field = Math.sin(t * 5);
  for (let i = 0; i < 90; i++) {
    const p = P[i];
    const x = cx - 110 + p.a * 220 + Math.sin(t * 0.8 + p.c * 20) * 4;
    const y = top + 10 + p.b * (bot - top - 20);
    const pos = i % 3 !== 0;
    ion(ctx, x, y + field * (pos ? 3 : -3), pos ? NA : CO3, pos ? '+' : '−', pos ? 4.2 : 5);
  }
  for (let i = 0; i < 6; i++) ion(ctx, cx - 30 + i * 11, top + 50 + (i % 2) * 20, ANA, '−', 5);
  label(ctx, 'Na⁺', cx - 120, bot + 30, NA);
  label(ctx, 'CO₃²⁻ / HCO₃⁻', cx - 80, bot + 30, CO3);
  label(ctx, 'analyte', cx + 40, bot + 30, ANA);

  const gx = w * 0.6;
  const gw = w * 0.35;
  const gy = h * 0.62;
  const gh = h * 0.42;
  trace(ctx, gx, gy, gw, gh, 0.62, 0.035, 0.12, t, '#ffd2a6', smoothstep(0.05, 0.7, lp));
  label(ctx, 'WITHOUT SUPPRESSION', gx, gy - gh - 14, TEXT);
  label(ctx, 'high, noisy background', gx, gy + 20);
}

/* 02 — membrane exchange powered by water electrolysis */
function drawMembrane(ctx: C, w: number, h: number, t: number) {
  const x0 = w * 0.06;
  const x1 = w * 0.94;
  const cy = h * 0.46;
  const ch = 46;
  ctx.fillStyle = 'rgba(120,170,230,0.06)';
  ctx.fillRect(x0, cy - ch / 2, x1 - x0, ch);
  ctx.strokeStyle = 'rgba(159,224,255,0.75)';
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, cy - ch / 2);
  ctx.lineTo(x1, cy - ch / 2);
  ctx.moveTo(x0, cy + ch / 2);
  ctx.lineTo(x1, cy + ch / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const ay = cy - ch / 2 - 74;
  const ky = cy + ch / 2 + 74;
  ctx.fillStyle = 'rgba(200,210,222,0.55)';
  ctx.fillRect(x0, ay - 4, x1 - x0, 4);
  ctx.fillRect(x0, ky, x1 - x0, 4);
  label(ctx, 'ANODE (+)   2 H₂O → 4 H⁺ + O₂ + 4 e⁻', x0, ay - 12, TEXT);
  if (!PHONE) label(ctx, 'ANION SUPPRESSION · SCHEMATIC', x1, ay - 12, MUTED, 'right');
  label(ctx, 'CATHODE (−)   2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', x0, ky + 22, TEXT);
  if (!PHONE) label(ctx, 'CATION-EXCHANGE MEMBRANES', x1, cy - ch / 2 - 8, MUTED, 'right');

  for (let i = 0; i < 40; i++) {
    const p = P[i];
    const f = (t * (0.3 + p.c * 0.3) + p.d) % 1;
    const bx = x0 + p.a * (x1 - x0);
    ctx.strokeStyle = `rgba(200,235,255,${0.6 * (1 - f)})`;
    ctx.beginPath();
    if (i % 2) ctx.arc(bx, ay + 6 + f * 26, 2 + p.b * 2, 0, Math.PI * 2);
    else ctx.arc(bx, ky - 6 - f * 26, 2 + p.b * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 22; i++) {
    const p = P[40 + i];
    const f = (t * 0.35 + p.a) % 1;
    const x = x0 + 40 + p.b * (x1 - x0 - 80);
    ion(ctx, x + f * 20, ay + 12 + f * (cy - ch / 2 - ay - 14), H, '+', 4);
    ion(ctx, x + 16 + f * 20, cy + ch / 2 + 4 + f * (ky - cy - ch / 2 - 16), NA, '+', 4.2);
  }
  for (let i = 0; i < 60; i++) {
    const p = P[70 + i];
    const f = (p.a + t * 0.12) % 1;
    const x = x0 + f * (x1 - x0);
    const y = cy - ch / 2 + 8 + p.b * (ch - 16);
    const isNa = p.c > f * 1.15;
    ion(ctx, x, y, isNa ? NA : H, '+', isNa ? 4.2 : 3.6);
  }
  if (!PHONE) {
    label(ctx, 'ELUENT IN →', x0, cy + ch / 2 + 16, MUTED);
    label(ctx, '→ TO DETECTOR', x1, cy + ch / 2 + 16, MUTED, 'right');
  }
  label(ctx, 'H⁺ in', x0 + 6, ay + 36, H);
  label(ctx, 'Na⁺ out', x0 + 6, ky - 28, NA);
}

/* 03 — background falls, peaks rise */
function drawResult(ctx: C, w: number, h: number, t: number, lp: number) {
  const k = smoothstep(0.1, 0.75, lp);
  const gx = w * 0.05;
  const gw = w * 0.52;
  const gy = h * 0.7;
  const gh = h * 0.48;
  const bg = 0.62 * (1 - k) + 0.04 * k;
  const noise = 0.035 * (1 - k) + 0.004 * k;
  const gain = 0.12 * (1 - k) + 0.78 * k;
  trace(ctx, gx, gy, gw, gh, bg, noise, gain, t, k > 0.5 ? '#e6f3ff' : '#ffd2a6');
  label(ctx, k > 0.5 ? 'WITH SUPPRESSION' : 'SUPPRESSING…', gx, gy - gh - 14, TEXT);

  const ex = w * 0.63;
  const y0 = h * 0.16;
  label(ctx, 'ELUENT', ex, y0, MUTED);
  label(ctx, 'Na₂CO₃ → H₂CO₃', ex, y0 + 24, TEXT, 'left', BIG);
  label(ctx, 'weak acid · low conductance', ex, y0 + 44, MUTED);
  label(ctx, 'ANALYTE', ex, y0 + 90, MUTED);
  label(ctx, 'Na⁺X⁻ → H⁺X⁻', ex, y0 + 114, TEXT, 'left', BIG);
  label(ctx, 'H⁺ ≈ 350 vs Na⁺ ≈ 50 S·cm²/mol', ex, y0 + 134, MUTED);
  label(ctx, 'RESULT', ex, y0 + 180, MUTED);
  label(ctx, '↓ noise   ↑ signal', ex, y0 + 204, '#8fe3ff', 'left', BIG);
  label(ctx, 'detection limits: ppm → ppb', ex, y0 + 224, MUTED);
}

/* 04 — cation suppression: a different mechanism (anion exchange), then S/N 125 → 3,215 */
const OH = '#9ff0ff';
const MSA = '#ffcf8a';
const CAT = '#6ee7c8';
function drawCations(ctx: C, w: number, h: number, t: number, lp: number) {
  // mechanism schematic
  const x0 = w * 0.06;
  const x1 = w * 0.94;
  const cy = h * 0.3;
  const ch = 36;
  const ky = cy - ch / 2 - 46; // cathode (top)
  const ay = cy + ch / 2 + 46; // anode (bottom)
  ctx.fillStyle = 'rgba(110,231,200,0.05)';
  ctx.fillRect(x0, cy - ch / 2, x1 - x0, ch);
  ctx.strokeStyle = 'rgba(195,155,255,0.8)';
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, cy - ch / 2);
  ctx.lineTo(x1, cy - ch / 2);
  ctx.moveTo(x0, cy + ch / 2);
  ctx.lineTo(x1, cy + ch / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,210,222,0.55)';
  ctx.fillRect(x0, ky - 4, x1 - x0, 4);
  ctx.fillRect(x0, ay, x1 - x0, 4);
  label(ctx, 'CATHODE (−)   2 H₂O + 2 e⁻ → H₂ + 2 OH⁻', x0, ky - 12, TEXT);
  if (!PHONE) label(ctx, 'CATION SUPPRESSION · SCHEMATIC', x1, ky - 12, MUTED, 'right');
  label(ctx, 'ANODE (+)   2 H₂O → 4 H⁺ + O₂ + 4 e⁻', x0, ay + 22, TEXT);
  if (!PHONE) label(ctx, 'ANION-EXCHANGE MEMBRANES', x1, cy + ch / 2 + 16, MUTED, 'right');
  for (let i = 0; i < 16; i++) {
    const p = P[90 + i];
    const f = (t * 0.33 + p.a) % 1;
    const x = x0 + 40 + p.b * (x1 - x0 - 120);
    ion(ctx, x + f * 16, ky + 8 + f * (cy - ky - 8), OH, '−', 3.8); // OH⁻ in
    ion(ctx, x + 22 + f * 16, cy + 4 + f * (ay - cy - 10), MSA, '−', 4.4); // methanesulfonate out
  }
  for (let i = 0; i < 46; i++) {
    const p = P[110 + (i % 50)];
    const f = (p.a + t * 0.12 + i * 0.013) % 1;
    const x = x0 + f * (x1 - x0);
    const y = cy - ch / 2 + 7 + p.b * (ch - 14);
    if (i < 14) {
      ion(ctx, x, y, CAT, '+', 4.6); // sample cation continues
    } else {
      // eluent H⁺ disappears as it meets OH⁻ (becomes water)
      const gone = p.c < f * 1.2;
      if (!gone) ion(ctx, x, y, H, '+', 3.4);
      else if (p.d < 0.5) {
        ctx.strokeStyle = 'rgba(150,170,190,0.55)';
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  if (!PHONE) label(ctx, 'MSA ELUENT IN →', x0, cy - ch / 2 - 6, MUTED);
  label(ctx, 'OH⁻ in', x0 + 6, ky + 30, OH);
  label(ctx, 'CH₃SO₃⁻ out', x0 + 6, ay - 12, MSA);
  if (PHONE) label(ctx, 'H⁺ + OH⁻ → H₂O · M⁺ → M⁺OH⁻', x0, ay + 50, CAT);
  else label(ctx, 'H⁺ + OH⁻ → H₂O   ·   M⁺ → M⁺OH⁻', x1, cy - ch / 2 - 6, CAT, 'right');

  // result: non-suppressed vs suppressed sodium
  const k = smoothstep(0.1, 0.6, lp);
  const gw = w * 0.4;
  const gh = h * 0.2;
  const gy = h * 0.84;
  const panels = [
    { x: w * 0.05, title: 'NON-SUPPRESSED', sn: 125, noise: 0.11, bg: 0.25, col: '#ffd2a6' },
    { x: w * 0.55, title: 'SUPPRESSED', sn: 3215, noise: 0.006, bg: 0.05, col: '#e6f3ff' },
  ];
  panels.forEach((p, i) => {
    const vis = i === 0 ? 1 : Math.max(0.001, k);
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * vis;
    ctx.strokeStyle = SOFT;
    ctx.beginPath();
    ctx.moveTo(p.x, gy);
    ctx.lineTo(p.x + gw, gy);
    ctx.stroke();
    ctx.strokeStyle = p.col;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let j = 0; j <= 200; j++) {
      const f = j / 200;
      const n = p.noise * Math.sin(j * 12.9898 + t * 4) * Math.cos(j * 3.3 - t);
      const y = gy - (p.bg + n + 0.62 * gaussian(f, 0.35, 0.03)) * gh;
      if (j === 0) ctx.moveTo(p.x, y);
      else ctx.lineTo(p.x + f * gw, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    label(ctx, p.title, p.x, gy - gh - 12, TEXT);
    label(ctx, `S/N ${p.sn.toLocaleString('en-US')}`, p.x, gy + 24, i ? '#8fe3ff' : NA, 'left', BIG);
    label(ctx, 'Na⁺ 50 ppb', p.x + gw, gy + 24, MUTED, 'right');
    ctx.globalAlpha = prev;
  });
}

export function drawWorkflow(ctx: C, w: number, h: number, t: number, progress: number) {
  const s = clamp(progress) * 4;
  const sc = Math.min(1, h / 520, w / 640);
  // keep labels ≥ ~10 px on screen even when the diagram is scaled down for phones
  const fs = Math.min(17, Math.max(12, 10 / sc));
  MONO = `500 ${fs.toFixed(1)}px "IBM Plex Mono", ui-monospace, monospace`;
  BIG = `500 ${(fs * 1.3).toFixed(1)}px "IBM Plex Mono", ui-monospace, monospace`;
  PHONE = fs > 12.5;
  const W = w / sc;
  const Hh = h / sc;
  const stages = [drawProblem, drawMembrane, drawResult, drawCations];
  stages.forEach((fn, i) => {
    const wgt = weight(s, i);
    if (wgt < 0.01) return;
    ctx.save();
    ctx.scale(sc, sc);
    ctx.globalAlpha = wgt;
    ctx.translate(0, (1 - wgt) * 18 * (s > i + 0.5 ? -1 : 1));
    fn(ctx, W, Hh, t, clamp(s - i));
    ctx.restore();
  });
}
