import { useMemo, useRef, useState } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useCanvas2D } from '../hooks/useCanvas2D';
import { useReveal } from '../hooks/useReveal';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { ELUENT, eluentPeaks, peakHeight, resolution } from '../utils/chroma';
import { clamp, lerp, normal, rng, smoothstep } from '../utils/math';
import { drawChromatogram } from './separation/drawChromatogram';
import '../styles/separation.css';

const C_START = 7.2;
const C_END = ELUENT.reference;

const rand = rng(77);
const BAND_DOTS = Array.from({ length: 1100 }, (_, i) => ({
  pop: i % 7,
  n: clamp(normal(rand), -2.8, 2.8),
  y: rand(),
  ph: rand() * 6.28,
}));

function useSmoothed(target: number) {
  const ref = useRef(target);
  return { ref, step: (dt: number) => (ref.current += (target - ref.current) * (1 - Math.exp(-dt * 6))) };
}

export function Separation() {
  const section = useRef<HTMLElement>(null);
  const [conc, setConc] = useState(C_START);
  const concRef = useRef(C_START);
  const manual = useRef<{ at: number } | null>(null);
  const progress = useRef(0);

  useReveal(section);
  useScrollProgress(section, (p) => {
    progress.current = p;
    if (manual.current && Math.abs(p - manual.current.at) < 0.08) return;
    manual.current = null;
    const v = Math.round(lerp(C_START, C_END, smoothstep(0.12, 0.78, p)) * 10) / 10;
    if (v !== concRef.current) {
      concRef.current = v;
      setConc(v);
    }
  });

  const peaks = useMemo(() => eluentPeaks(conc), [conc]);
  const sorted = useMemo(() => [...peaks].sort((a, b) => a.tR - b.tR), [peaks]);
  const crit = useMemo(() => {
    let idx = 0;
    let m = Infinity;
    for (let i = 0; i < sorted.length - 1; i++) {
      const r = resolution(sorted[i], sorted[i + 1]);
      if (r < m) {
        m = r;
        idx = i;
      }
    }
    return { a: sorted[idx], b: sorted[idx + 1], rs: m };
  }, [sorted]);

  const tMax = useSmoothed(Math.max(8, sorted[sorted.length - 1].tR * 1.12));
  const yMax = useSmoothed(Math.max(...peaks.map(peakHeight)) * 1.2);

  const chromCanvas = useCanvas2D(({ ctx, w, h, dt }) => {
    tMax.step(dt);
    yMax.step(dt);
    drawChromatogram(ctx, w, h, {
      peaks,
      tMax: tMax.ref.current,
      yMax: Math.min(yMax.ref.current, 8.5),
      annotate: true,
      noise: 0.012,
      xLabel: 'Retention time (min)',
      yLabel: 'µS/cm',
      pad: { l: 44, r: 12, t: 44, b: 44 },
    });
    // ion labels above peaks
    const pad = { l: 44, r: 12, t: 44, b: 44 };
    const gw = w - pad.l - pad.r;
    const gh = h - pad.t - pad.b;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    peaks.forEach((p) => {
      const x = pad.l + (p.tR / tMax.ref.current) * gw;
      const y = h - pad.b - (Math.min(peakHeight(p), 8.2) / Math.min(yMax.ref.current, 8.5)) * gh;
      ctx.fillStyle = p.color;
      ctx.fillText(p.formula, x, Math.max(pad.t + 2, y - 10));
    });
  });

  const columnCanvas = useCanvas2D(({ ctx, w, h, t }) => {
    const L = w - 2;
    const cy = h / 2;
    const R = Math.min(30, h * 0.36);
    ctx.strokeStyle = 'rgba(180,205,235,0.4)';
    ctx.strokeRect(1, cy - R, L, R * 2);
    ctx.fillStyle = 'rgba(140,160,185,0.07)';
    for (let i = 0; i < 160; i++) {
      ctx.beginPath();
      ctx.arc(4 + (i / 160) * (L - 8), cy - R + 4 + ((i * 0.618) % 1) * (R * 2 - 8), 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const cycle = 7;
    const tau = (t % cycle) / cycle;
    const tm = tMax.ref.current;
    for (const d of BAND_DOTS) {
      const p = peaks[d.pop];
      const pos = (tau * tm * 1.05) / p.tR;
      if (pos > 1.02) continue;
      const sig = 0.005 + (pos * 2.2) / Math.sqrt(ELUENT.plates);
      const x = 1 + (pos + d.n * sig) * L;
      if (x < 1 || x > L) continue;
      const y = cy + (d.y - 0.5) * (R * 2 - 8) + Math.sin(t * 2 + d.ph) * 1.2;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  const ok = crit.rs >= 1.5;
  const runTime = sorted[sorted.length - 1].tR;
  const atRef = Math.abs(conc - ELUENT.reference) < 0.05;

  return (
    <section className="separation" ref={section} aria-labelledby="sep-title">
      <div className="separation__sticky">
        <div className="container separation__inner">
          <header className="separation__head">
            <div>
              <SectionIndex num="03" label="Selectivity" />
              <SplitText as="h2" id="sep-title" className="h-lg" text="Turn the eluent. Move the ions." />
            </div>
            <p className="lede separation__lede" data-reveal>
              Monovalent and divalent anions respond differently to carbonate strength. Stronger eluent speeds everything up,
              but it speeds sulfate and phosphate up most, so peaks can slide past each other.
            </p>
          </header>

          <div className="separation__stage">
            <div className="separation__column">
              <div className="separation__column-labels mono">
                <span>Inlet</span>
                <span>Shim-pack IC-SA3 · 250 × 4.0 mm · 5 µm</span>
                <span>Suppressor → cell</span>
              </div>
              <canvas ref={columnCanvas} className="separation__column-canvas" aria-hidden="true" />
            </div>

            <div className="separation__grid">
              <div className="separation__chrom">
                <canvas
                  ref={chromCanvas}
                  className="separation__chrom-canvas"
                  role="img"
                  aria-label={`Modelled chromatogram at ${conc.toFixed(1)} mmol/L sodium carbonate: ${sorted
                    .map((p) => `${p.label} at ${p.tR.toFixed(1)} minutes`)
                    .join(', ')}. Critical pair resolution ${crit.rs.toFixed(2)}.`}
                />
              </div>

              <aside className="separation__panel" aria-label="Separation metrics">
                <label className="sep-control">
                  <span className="mono">Sodium carbonate eluent</span>
                  <span className="sep-control__value display">
                    {conc.toFixed(1)}
                    <small>mmol/L {atRef && '· app-note condition'}</small>
                  </span>
                  <input
                    type="range"
                    min={ELUENT.min}
                    max={ELUENT.max}
                    step={0.1}
                    value={conc}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      manual.current = { at: progress.current };
                      concRef.current = v;
                      setConc(v);
                    }}
                    aria-valuetext={`${conc.toFixed(1)} millimoles per litre sodium carbonate`}
                  />
                  <span className="sep-control__scale mono">
                    <span>Weaker · longer</span>
                    <span>Stronger · faster</span>
                  </span>
                  <span className="sep-control__limit mono">
                    Na⁺ = {(conc * 2).toFixed(1)} mmol/L · range capped at 7.5 mmol/L Na₂CO₃ (15 mmol/L Na⁺, the documented
                    ICDS-Ai limit)
                  </span>
                </label>

                <dl className="sep-metrics">
                  <div className={`sep-metric ${ok ? 'is-ok' : 'is-warn'}`}>
                    <dt className="mono">Resolution · critical pair · model</dt>
                    <dd>
                      <span className="display">{crit.rs.toFixed(2)}</span>
                      <span className="mono">
                        {crit.a.id}/{crit.b.id} · {ok ? 'resolved' : 'overlapping'}
                      </span>
                    </dd>
                  </div>
                  <div className="sep-metric">
                    <dt className="mono">Last peak · predicted</dt>
                    <dd>
                      <span className="display">{runTime.toFixed(1)}</span>
                      <span className="mono">min</span>
                    </dd>
                  </div>
                  <div className="sep-metric">
                    <dt className="mono">Elution order</dt>
                    <dd>
                      <span className="sep-order mono">{sorted.map((p) => p.id).join(' · ')}</span>
                    </dd>
                  </div>
                </dl>

                <table className="sep-table">
                  <caption className="sep-table__cap mono">Predicted by the model (illustrative)</caption>
                  <thead>
                    <tr className="mono">
                      <th scope="col">Anion</th>
                      <th scope="col">tR (min)</th>
                      <th scope="col">k</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">
                          <span className="sep-swatch" style={{ background: p.color }} /> {p.formula}
                        </th>
                        <td>{p.tR.toFixed(2)}</td>
                        <td>{p.k.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </aside>
            </div>
          </div>
          <p className="separation__note body-s">
            Illustrative model output. At 4.5 mmol/L the retention times match Shimadzu’s EPA 300.1 Part A data on a
            Shim-pack IC-SA3; other concentrations use the stoichiometric ion-exchange model, log k = log k₀ − (x/y)·log[CO₃²⁻],
            with a fixed plate count. Predicted retention times and resolution are not measured data, and the slider stops at
            the suppressor’s documented sodium limit.{' '}
            <a href="https://www.shimadzu.com/an/sites/shimadzu.com.an/files/pim/pim_document_file/applications/application_note/26181/an_01-01104-en.pdf" target="_blank" rel="noopener noreferrer">
              Part A application note ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
