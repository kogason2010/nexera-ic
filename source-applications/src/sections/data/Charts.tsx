import { useMemo } from 'react';
import { CATIONS, EPA_A, EPA_B } from '../../data/nexera';
import { ANION_COLORS, CATION_COLORS } from '../../utils/chroma';
import { gaussian, toPath } from '../../utils/math';

const AX = 'rgba(170,195,225,0.28)';
const GRID = 'rgba(170,195,225,0.07)';
const TXT = '#b8c3d1';
const FONT = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, letterSpacing: '0.02em' };

interface Frame {
  w: number;
  h: number;
  l: number;
  r: number;
  t: number;
  b: number;
}
const sx = (f: Frame, v: number, min: number, max: number) => f.l + ((v - min) / (max - min)) * (f.w - f.l - f.r);
const sy = (f: Frame, v: number, min: number, max: number) => f.h - f.b - ((v - min) / (max - min)) * (f.h - f.t - f.b);

function Axes({ f, xt, yt, xmin, xmax, ymin, ymax, xl, yl }: {
  f: Frame;
  xt: number[];
  yt: number[];
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  xl: string;
  yl: string;
}) {
  return (
    <g style={FONT}>
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line x1={f.l} x2={f.w - f.r} y1={sy(f, v, ymin, ymax)} y2={sy(f, v, ymin, ymax)} stroke={GRID} />
          <text x={f.l - 8} y={sy(f, v, ymin, ymax) + 3} fill={TXT} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {xt.map((v) => (
        <text key={`x${v}`} x={sx(f, v, xmin, xmax)} y={f.h - f.b + 16} fill={TXT} textAnchor="middle">
          {v}
        </text>
      ))}
      <line x1={f.l} x2={f.w - f.r} y1={f.h - f.b} y2={f.h - f.b} stroke={AX} />
      <text x={f.w - f.r} y={f.h - 4} fill={TXT} textAnchor="end">
        {xl}
      </text>
      <text x={f.l} y={f.t - 10} fill={TXT}>
        {yl}
      </text>
    </g>
  );
}

/** Redrawn from Fig. 3 of the EPA 300.1 Part A application note (STD 3; DCA surrogate omitted). */
export function AnionChromatogram() {
  const f: Frame = { w: 760, h: 300, l: 40, r: 16, t: 34, b: 34 };
  const tmax = 20;
  const ymax = 7.5;
  const d = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 900; i++) {
      const t = (i / 900) * tmax;
      // water dip near the void time, small baseline noise
      let s = -1.6 * gaussian(t, EPA_A.voidTime, 0.06) + 0.02 * Math.sin(i * 12.9898) * Math.cos(i * 4.1);
      for (const p of EPA_A.peaks) s += Math.min(p.h, 9.5) * gaussian(t, p.tR, p.tR / 105);
      pts.push([sx(f, t, 0, tmax), sy(f, Math.max(-1.2, Math.min(s, 7.6)), -1.2, ymax)]);
    }
    return toPath(pts);
  }, []);
  return (
    <svg viewBox={`0 0 ${f.w} ${f.h}`} className="chart" role="img" aria-label="Chromatogram of seven anions per EPA 300.1 Part A: fluoride 4.5, chloride 7.7, nitrite 9.8, bromide 13.1, nitrate 15.8, phosphate 16.7 and sulfate 18.4 minutes.">
      <Axes f={f} xt={[0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20]} yt={[0, 2, 4, 6]} xmin={0} xmax={tmax} ymin={-1.2} ymax={ymax} xl="min" yl="µS/cm" />
      <path d={d} fill="none" stroke="#e6eef7" strokeWidth="1.3" data-draw />
      {EPA_A.peaks.map((p, i) => (
        <g key={p.id} style={FONT}>
          <text x={sx(f, p.tR, 0, tmax)} y={sy(f, Math.min(p.h, 7.2), -1.2, ymax) - 10} textAnchor="middle" fill={ANION_COLORS[i]}>
            {p.formula}
          </text>
        </g>
      ))}
      <text x={sx(f, 7.72, 0, tmax) + 10} y={f.t + 10} style={FONT} fill={TXT}>
        Cl⁻ off-scale (10 mg/L)
      </text>
    </svg>
  );
}

/** Method detection limits, Part A (mg/L) on a log scale. */
export function MdlChart() {
  const f: Frame = { w: 380, h: 250, l: 54, r: 16, t: 26, b: 34 };
  const lo = Math.log10(0.0002);
  const hi = Math.log10(0.005);
  const bw = (f.w - f.l - f.r) / EPA_A.peaks.length;
  return (
    <svg viewBox={`0 0 ${f.w} ${f.h}`} className="chart" role="img" aria-label="Method detection limits for EPA 300.1 Part A anions, from 0.0004 mg/L for nitrate to 0.003 mg/L for sulfate.">
      {[0.0005, 0.001, 0.002, 0.005].map((v) => (
        <g key={v} style={FONT}>
          <line x1={f.l} x2={f.w - f.r} y1={sy(f, Math.log10(v), lo, hi)} y2={sy(f, Math.log10(v), lo, hi)} stroke={GRID} />
          <text x={f.l - 8} y={sy(f, Math.log10(v), lo, hi) + 3} fill={TXT} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <line x1={f.l} x2={f.w - f.r} y1={f.h - f.b} y2={f.h - f.b} stroke={AX} />
      <text x={f.l} y={f.t - 10} style={FONT} fill={TXT}>
        MDL (mg/L, log scale)
      </text>
      {EPA_A.peaks.map((p, i) => {
        const y = sy(f, Math.log10(p.mdl), lo, hi);
        return (
          <g key={p.id}>
            <rect x={f.l + i * bw + bw * 0.25} y={y} width={bw * 0.5} height={f.h - f.b - y} fill={ANION_COLORS[i]} opacity="0.85" data-grow />
            <text x={f.l + i * bw + bw / 2} y={f.h - f.b + 16} style={FONT} fill={TXT} textAnchor="middle">
              {p.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Disinfection by-products, Part B: MDLs in µg/L. */
export function DbpChart() {
  const f: Frame = { w: 380, h: 250, l: 70, r: 40, t: 26, b: 30 };
  const max = 0.8;
  const bh = (f.h - f.t - f.b) / EPA_B.analytes.length;
  return (
    <svg viewBox={`0 0 ${f.w} ${f.h}`} className="chart" role="img" aria-label="EPA 300.1 Part B method detection limits: chlorite 0.3, bromate 0.6, bromide 0.3 and chlorate 0.5 micrograms per litre.">
      <text x={f.l} y={f.t - 10} style={FONT} fill={TXT}>
        MDL (µg/L)
      </text>
      {EPA_B.analytes.map((a, i) => {
        const y = f.t + i * bh + bh * 0.22;
        const wv = ((a.mdl / max) * (f.w - f.l - f.r));
        return (
          <g key={a.id} style={FONT}>
            <text x={f.l - 10} y={y + bh * 0.35} fill={TXT} textAnchor="end">
              {a.label}
            </text>
            <rect x={f.l} y={y} width={wv} height={bh * 0.5} fill={ANION_COLORS[2 + i]} opacity="0.85" data-grow-x />
            <text x={f.l + wv + 8} y={y + bh * 0.35} fill="#e9eef4">
              {a.mdl}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Redrawn from Fig. 1 of the ASTM D6919-17 suppressed-cation application note. */
export function CationChromatogram() {
  const f: Frame = { w: 380, h: 250, l: 36, r: 12, t: 30, b: 34 };
  const tmax = 18;
  const ymax = 11;
  const d = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 600; i++) {
      const t = (i / 600) * tmax;
      let s = 0.02 * Math.sin(i * 12.9898) * Math.cos(i * 4.1);
      for (const p of CATIONS.peaks) s += p.h * gaussian(t, p.tR, p.sigma);
      pts.push([sx(f, t, 0, tmax), sy(f, s, -0.3, ymax)]);
    }
    return toPath(pts);
  }, []);
  return (
    <svg viewBox={`0 0 ${f.w} ${f.h}`} className="chart" role="img" aria-label="Suppressed cation chromatogram: lithium, sodium, ammonium and potassium between 3.4 and 4.7 minutes, magnesium at 12.0 and calcium at 16.0 minutes.">
      <Axes f={f} xt={[0, 5, 10, 15]} yt={[0, 5, 10]} xmin={0} xmax={tmax} ymin={-0.3} ymax={ymax} xl="min" yl="µS/cm" />
      <path d={d} fill="none" stroke="#e6eef7" strokeWidth="1.3" data-draw />
      {CATIONS.peaks.map((p, i) => (
        <text
          key={p.id}
          x={sx(f, p.tR, 0, tmax) + (i > 0 && i < 4 ? 10 + i * 4 : 0)}
          y={sy(f, p.h, -0.3, ymax) - 6 - (i > 0 && i < 4 ? 0 : 0)}
          style={FONT}
          fill={CATION_COLORS[i]}
          textAnchor={i > 0 && i < 4 ? 'start' : 'middle'}
        >
          {p.formula}
        </text>
      ))}
    </svg>
  );
}
