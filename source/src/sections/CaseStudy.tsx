import { useMemo, useRef, useState } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useCanvas2D } from '../hooks/useCanvas2D';
import { useReveal } from '../hooks/useReveal';
import { CATIONS, EPA_A } from '../data/nexera';
import { ANION_COLORS, CATION_COLORS, bandSigma, type Peak } from '../utils/chroma';
import { drawChromatogram } from './separation/drawChromatogram';
import '../styles/case.css';

const ROOT2PI = Math.sqrt(2 * Math.PI);

/** Peaks redrawn from the application-note figures (retention times and apex heights). */
const ANIONS: (Peak & { formula: string })[] = EPA_A.peaks.map((p, i) => {
  const sigma = bandSigma(p.tR, 11000);
  return { id: p.id, label: p.label, formula: p.formula, tR: p.tR, sigma, area: Math.min(p.h, 7.2) * sigma * ROOT2PI, color: ANION_COLORS[i] };
});
const CATS: (Peak & { formula: string })[] = CATIONS.peaks.map((p, i) => ({
  id: p.id,
  label: p.label,
  formula: p.formula,
  tR: p.tR,
  sigma: p.sigma,
  area: p.h * p.sigma * ROOT2PI,
  color: CATION_COLORS[i],
}));

export function CaseStudy() {
  const section = useRef<HTMLElement>(null);
  const [split, setSplit] = useState(42);
  const splitRef = useRef(42);
  splitRef.current = split;
  const dragging = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  useReveal(section);

  const tMax = 20;
  const pad = { l: 40, r: 12, t: 30, b: 30 };

  const reading = useMemo(() => {
    const t = (split / 100) * tMax;
    const near = (arr: typeof ANIONS) => arr.reduce((b, p) => (Math.abs(p.tR - t) < Math.abs(b.tR - t) ? p : b), arr[0]);
    return { t, a: near(ANIONS), c: near(CATS) };
  }, [split]);

  const canvas = useCanvas2D(({ ctx, w, h }) => {
    const half = h / 2;
    const gw = w - pad.l - pad.r;
    const X = (t: number) => pad.l + (t / tMax) * gw;
    const labels = (peaks: typeof ANIONS, yMax: number, top: number) => {
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      peaks.forEach((p, i) => {
        const hgt = p.area / (p.sigma * ROOT2PI);
        const y = top + half - pad.b - (Math.min(hgt, yMax) / yMax) * (half - pad.t - pad.b);
        ctx.fillStyle = p.color;
        ctx.fillText(p.formula, X(p.tR), Math.max(top + pad.t, y - 8 - (i % 2) * 12));
      });
    };
    ctx.save();
    ctx.translate(0, half);
    drawChromatogram(ctx, w, half, { peaks: CATS, tMax, yMax: 11, pad, xLabel: 'min', noise: 0.02 });
    ctx.restore();
    labels(CATS, 11, half);
    drawChromatogram(ctx, w, half, { peaks: ANIONS, tMax, yMax: 8, pad, noise: 0.015 });
    labels(ANIONS, 8, 0);

    const sx = X((splitRef.current / 100) * tMax);
    ctx.strokeStyle = 'rgba(233,238,244,0.35)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, 8);
    ctx.lineTo(sx, h - 8);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  const setFromClient = (clientX: number) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    setSplit(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <section className="case section" ref={section} aria-labelledby="case-title">
      <div className="container">
        <div className="case__head">
          <div>
            <SectionIndex num="05" label="Dual channel" />
            <SplitText as="h2" id="case-title" className="h-lg" text="Anions and cations. One vial. Same run." />
          </div>
          <div>
            <p className="lede" data-reveal>
              Add the IC-150D and the autosampler injects every sample into two flow paths at once: an anion channel and a
              cation channel, each with its own column, suppressor and conductivity cell. Both results land in a single data
              file and report.
            </p>
            <p className="illustrative" data-reveal>
              <span className="dot" style={{ background: 'var(--amber)', boxShadow: '0 0 10px var(--amber)' }} /> Redrawn from
              Shimadzu application data (EPA 300.1 Part A and ASTM D6919-17)
            </p>
          </div>
        </div>

        <div
          className="case__compare"
          ref={wrap}
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setFromClient(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && setFromClient(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          <canvas
            ref={canvas}
            className="case__canvas"
            role="img"
            aria-label="Two chromatograms on a shared 20-minute axis. Top: seven anions, fluoride at 4.5 minutes through sulfate at 18.4 minutes. Bottom: six cations, lithium at 3.4 minutes through calcium at 16.0 minutes."
          />
          <div className="case__labels" aria-hidden="true">
            <span className="mono case__label case__label--before" style={{ color: 'var(--cyan)' }}>
              Anion channel · IC-150 · Shim-pack IC-SA3
            </span>
            <span className="mono case__label case__label--after" style={{ color: '#6ee7c8' }}>
              Cation channel · IC-150D · Shim-pack IC-C4
            </span>
          </div>
          <div className="case__handle" style={{ left: `${split}%` }} aria-hidden="true">
            <span>⇆</span>
          </div>
          <div className="case__reading mono" style={{ left: `${split}%` }} aria-live="polite">
            {reading.t.toFixed(1)} min · nearest {reading.a.formula} / {reading.c.formula}
          </div>
          <input
            className="case__range"
            type="range"
            min={2}
            max={98}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            aria-label="Move the reading line across both chromatograms"
          />
        </div>

        <dl className="case__stats">
          <div>
            <dt className="mono">Anions · EPA 300.1 Part A</dt>
            <dd>
              <span className="display case__after">7</span>
              <span className="case__unit mono">in under 20 min</span>
            </dd>
          </div>
          <div>
            <dt className="mono">Cations · ASTM D6919-17</dt>
            <dd>
              <span className="display case__after">6</span>
              <span className="case__unit mono">{CATIONS.runTime}</span>
            </dd>
          </div>
          <div>
            <dt className="mono">Cation peak-area RSD (n=7)</dt>
            <dd>
              <span className="display case__after">≤ 0.18 %</span>
            </dd>
          </div>
          <div>
            <dt className="mono">Output</dt>
            <dd>
              <span className="display case__after">1</span>
              <span className="case__unit mono">data file &amp; report</span>
            </dd>
          </div>
        </dl>
        <p className="case__fine body-s">
          The two traces come from separate application notes shown on a shared time axis to illustrate the dual-channel idea.
          Conditions: anions on Shim-pack IC-SA3, 4.5 mmol/L Na₂CO₃, 0.85 mL/min; cations on Shim-pack IC-C4, 2.5 mmol/L MSA,
          1.0 mL/min.
        </p>
      </div>
    </section>
  );
}
