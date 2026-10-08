import { useMemo } from 'react';
import { DBP_COLORS, PART_B_PEAKS, PART_B_SURROGATE } from '../data/apps';
import { gaussian, toPath } from '../utils/math';

/** EPA 300.1 Part B standard (STD 3), redrawn approximately from Fig. 3 of 01-01153-EN. */
export function DbpChromatogram() {
  const W = 380;
  const H = 230;
  const l = 40;
  const r = 12;
  const t = 22;
  const b = 34;
  const tmax = 18;
  const ymax = 1.05;
  const sx = (x: number) => l + (x / tmax) * (W - l - r);
  const sy = (y: number) => H - b - ((y + 0.06) / (ymax + 0.06)) * (H - b - t);
  const d = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 700; i++) {
      const x = (i / 700) * tmax;
      let y = 0;
      for (const p of PART_B_PEAKS) y += p.h * gaussian(x, p.tR, 0.09);
      y += PART_B_SURROGATE.h * gaussian(x, PART_B_SURROGATE.tR, 0.12);
      y -= 0.04 * gaussian(x, 3.3, 0.35);
      pts.push([sx(x), sy(y)]);
    }
    return toPath(pts);
  }, []);
  const F = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Part B standard chromatogram, approximate: chlorite about 6.2, bromate 6.7, bromide 13.1 and chlorate 13.8 minutes, followed by the large dichloroacetate surrogate peak at about 14.4 minutes.">
      {[0, 0.5, 1].map((v) => (
        <g key={v} style={F}>
          <line x1={l} x2={W - r} y1={sy(v)} y2={sy(v)} stroke="rgba(160,185,215,0.12)" />
          <text x={l - 6} y={sy(v) + 4} textAnchor="end" fill="#b8c3d1">
            {v}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15].map((v) => (
        <text key={v} x={sx(v)} y={H - b + 16} textAnchor="middle" style={F} fill="#b8c3d1">
          {v}
        </text>
      ))}
      <text x={W - r} y={H - 4} textAnchor="end" style={F} fill="#b8c3d1">
        min
      </text>
      <text x={l} y={t - 8} style={F} fill="#b8c3d1">
        µS/cm
      </text>
      <path d={d} fill="none" stroke="#e6eef7" strokeWidth="1.4" />
      {PART_B_PEAKS.map((p, i) => (
        <text key={p.id} x={sx(p.tR) + (i % 2 ? 10 : -10)} y={sy(p.h) - 10 - (i % 2) * 14} textAnchor="middle" style={F} fill={DBP_COLORS[i]}>
          {p.formula}
        </text>
      ))}
      <text x={sx(PART_B_SURROGATE.tR) + 8} y={sy(PART_B_SURROGATE.h) + 12} style={F} fill="#97a3b3">
        DCA (surrogate)
      </text>
    </svg>
  );
}
