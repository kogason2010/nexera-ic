import { BANDS, chromAt } from '../../three/hero/flowPath';

/** Static, labelled flow diagram: shown when WebGL is unavailable. */
export function FlowDiagram() {
  const boxes = [
    { x: 20, label: 'Eluent', sub: 'Na₂CO₃' },
    { x: 150, label: 'Pump', sub: '' },
    { x: 280, label: 'Injection', sub: 'autosampler' },
    { x: 410, label: 'Columns', sub: 'guard + anion exch.' },
    { x: 540, label: 'Suppressor', sub: 'membrane' },
    { x: 670, label: 'Conductivity', sub: 'cell' },
  ];
  let d = '';
  for (let i = 0; i <= 300; i++) {
    const t = (i / 300) * 20;
    d += `${i ? 'L' : 'M'}${(430 + t * 17).toFixed(1)} ${(330 - Math.min(chromAt(t), 7) * 15).toFixed(1)}`;
  }
  return (
    <svg className="hero__fallback-svg" viewBox="0 0 800 380" role="img" aria-label="Flow path of a suppressed-conductivity ion chromatograph: eluent, pump, injection, guard and anion-exchange column, membrane suppressor, conductivity cell, then the cell effluent returns through the suppressor regenerant channels to waste. A chromatogram of seven anions is shown.">
      {boxes.map((b, i) => (
        <g key={b.label}>
          <rect x={b.x} y={70} width={110} height={64} rx={10} className="fd-box" />
          <text x={b.x + 55} y={98} textAnchor="middle" className="fd-label">
            {b.label}
          </text>
          <text x={b.x + 55} y={118} textAnchor="middle" className="fd-sub">
            {b.sub}
          </text>
          {i < boxes.length - 1 && <path d={`M${b.x + 110} 102 H${boxes[i + 1].x}`} className="fd-flow" markerEnd="url(#fdArrow)" />}
        </g>
      ))}
      <path d="M780 102 V40 H595 V70" className="fd-flow fd-flow--regen" markerEnd="url(#fdArrow)" />
      <text x={688} y={32} textAnchor="middle" className="fd-sub">
        cell effluent → regenerant
      </text>
      <path d="M595 134 V180 H700" className="fd-flow fd-flow--regen" markerEnd="url(#fdArrow)" />
      <text x={712} y={184} className="fd-sub">
        waste
      </text>
      <defs>
        <marker id="fdArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10z" fill="#8fa6c2" />
        </marker>
      </defs>
      <line x1={430} x2={770} y1={330} y2={330} className="fd-axis" />
      <path d={d} className="fd-trace" />
      {BANDS.map((b) => (
        <circle key={b.id} cx={430 + b.tR * 17} cy={322 - Math.min(b.h, 7) * 15} r={3} fill={b.color} />
      ))}
      <text x={600} y={358} textAnchor="middle" className="fd-sub">
        Retention time (min) · conductivity (µS/cm)
      </text>
      <text x={40} y={250} className="fd-sub">
        Liquid-phase ion exchange → membrane suppression → conductivity detection
      </text>
    </svg>
  );
}
