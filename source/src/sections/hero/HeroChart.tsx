import { useEffect, useRef } from 'react';
import { BANDS, chromAt } from '../../three/hero/flowPath';
import { heroFrame, heroScreen } from '../../three/hero/heroFrame';
import { smoothstep } from '../../utils/math';

const W = 560;
const H = 290;
const X0 = 58;
const X1 = 540;
const Y0 = 236; // baseline (0 µS/cm)
const Y1 = 26;
const TMAX = 20;
const YMAX = 7;
const xOf = (t: number) => X0 + (t / TMAX) * (X1 - X0);
const yOf = (v: number) => Y0 - (Math.min(v, YMAX) / YMAX) * (Y0 - Y1);

/**
 * Chromatogram written live as each band passes the conductivity cell. Axes: retention time (min)
 * and conductivity (µS/cm), peaks redrawn from the EPA 300.1 Part A application data.
 */
export function HeroChart({ active, sticky }: { active: boolean; sticky: React.RefObject<HTMLDivElement> }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const pen = useRef<SVGCircleElement>(null);
  const labels = useRef<(SVGGElement | null)[]>([]);
  const wire = useRef<SVGLineElement>(null);
  const wireSvg = useRef<SVGSVGElement>(null);
  const off = useRef<SVGTextElement>(null);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      const p = heroFrame.p;
      const vis = smoothstep(0.57, 0.63, p);
      if (root.current) {
        root.current.style.opacity = vis.toFixed(3);
        root.current.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
      }
      const tNow = Math.min(TMAX, heroFrame.minutes);
      if (vis > 0.01 && line.current && fill.current) {
        let d = '';
        const n = Math.max(2, Math.round((tNow / TMAX) * 420));
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * tNow;
          d += `${i ? 'L' : 'M'}${xOf(t).toFixed(1)} ${yOf(chromAt(t)).toFixed(1)}`;
        }
        line.current.setAttribute('d', d);
        fill.current.setAttribute('d', `${d}L${xOf(tNow).toFixed(1)} ${Y0}L${X0} ${Y0}Z`);
        pen.current?.setAttribute('cx', xOf(tNow).toFixed(1));
        pen.current?.setAttribute('cy', yOf(chromAt(tNow)).toFixed(1));
        BANDS.forEach((b, i) => {
          const g = labels.current[i];
          if (g) g.style.opacity = smoothstep(b.tR + b.sigmaMin, b.tR + b.sigmaMin * 4, tNow).toFixed(3);
        });
        if (off.current) off.current.style.opacity = smoothstep(BANDS[1].tR, BANDS[1].tR + 0.4, tNow).toFixed(3);
      }
      // signal wire: conductivity cell → pen
      const ws = wireSvg.current;
      if (ws && wire.current && svg.current && sticky.current) {
        const wOn = vis * (1 - smoothstep(0.86, 0.9, p)) * (heroScreen.cell.on ? 1 : 0);
        ws.style.opacity = wOn.toFixed(3);
        if (wOn > 0.01) {
          const sr = sticky.current.getBoundingClientRect();
          const r = svg.current.getBoundingClientRect();
          const k = r.width / W;
          const px = r.left - sr.left + xOf(tNow) * k;
          const py = r.top - sr.top + yOf(chromAt(tNow)) * k;
          wire.current.setAttribute('x1', heroScreen.cell.x.toFixed(1));
          wire.current.setAttribute('y1', heroScreen.cell.y.toFixed(1));
          wire.current.setAttribute('x2', px.toFixed(1));
          wire.current.setAttribute('y2', py.toFixed(1));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, sticky]);

  return (
    <>
      <svg className="hero__wire" ref={wireSvg} aria-hidden="true">
        <line ref={wire} />
      </svg>
      <div className="hero-chart" ref={root} aria-hidden="true">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="hero-chart__svg">
          <defs>
            <linearGradient id="hcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#63d3ff" stopOpacity="0.28" />
              <stop offset="1" stopColor="#c39bff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 2, 4, 6].map((v) => (
            <g key={v}>
              <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} className="hc-grid" />
              <text x={X0 - 10} y={yOf(v) + 4} className="hc-tick" textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {[0, 5, 10, 15, 20].map((t) => (
            <g key={t}>
              <line x1={xOf(t)} x2={xOf(t)} y1={Y0} y2={Y0 + 5} className="hc-axis" />
              <text x={xOf(t)} y={Y0 + 20} className="hc-tick" textAnchor="middle">
                {t}
              </text>
            </g>
          ))}
          <line x1={X0} x2={X1} y1={Y0} y2={Y0} className="hc-axis" />
          <line x1={X0} x2={X0} y1={Y1 - 6} y2={Y0} className="hc-axis" />
          <text x={(X0 + X1) / 2} y={H - 8} className="hc-label" textAnchor="middle">
            Retention time (min)
          </text>
          <text x={16} y={(Y0 + Y1) / 2} className="hc-label" textAnchor="middle" transform={`rotate(-90 16 ${(Y0 + Y1) / 2})`}>
            Conductivity (µS/cm)
          </text>
          <path ref={fill} fill="url(#hcFill)" />
          <path ref={line} className="hc-line" />
          {BANDS.map((b, i) => {
            const lift = [0, 0, 14, 0, 26, 8, 0][i];
            const y = Math.max(Y1 + 10, yOf(chromAt(b.tR))) - 10 - lift;
            return (
              <g key={b.id} ref={(el) => (labels.current[i] = el)} style={{ opacity: 0 }}>
                <circle cx={xOf(b.tR)} cy={y + 4} r={3} fill={b.color} />
                <text x={xOf(b.tR)} y={y - 4} className="hc-peak" textAnchor="middle" fill={b.color}>
                  {b.formula}
                </text>
              </g>
            );
          })}
          <text ref={off} x={xOf(BANDS[1].tR) + 8} y={Y1 + 8} className="hc-note" style={{ opacity: 0 }}>
            Cl⁻ off-scale
          </text>
          <circle ref={pen} r={3.5} className="hc-pen" />
        </svg>
        <p className="hero-chart__cap mono">
          Suppressed conductivity · peaks redrawn from Shimadzu’s EPA 300.1 Part A application data
        </p>
      </div>
    </>
  );
}

/** Background conductivity before and after the suppressor (qualitative). */
export function SuppressionGauge() {
  return (
    <div className="supp-gauge" aria-hidden="true">
      <p className="mono supp-gauge__title">Background conductivity</p>
      <div className="supp-gauge__row">
        <span className="mono">Entering · Na₂CO₃</span>
        <span className="supp-gauge__bar">
          <i style={{ width: '92%' }} className="is-high" />
        </span>
      </div>
      <div className="supp-gauge__row">
        <span className="mono">Leaving · H₂CO₃</span>
        <span className="supp-gauge__bar">
          <i style={{ width: '9%' }} />
        </span>
      </div>
      <p className="supp-gauge__note">Baseline drops; sample anions now pair with H⁺, which conducts better than Na⁺.</p>
      <p className="mono supp-gauge__q">Qualitative illustration</p>
    </div>
  );
}
