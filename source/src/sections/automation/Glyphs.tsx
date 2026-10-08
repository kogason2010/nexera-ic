/** Small animated line drawings, one per automation feature (original artwork). */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function Glyph({ id }: { id: string }) {
  switch (id) {
    case 'level':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <rect x="38" y="22" width="44" height="80" rx="6" {...S} />
          <rect x="40" y="58" width="40" height="42" rx="4" className="glyph-fill glyph-level" />
          <path d="M30 58h8M82 58h8" {...S} className="glyph-accent" />
          <path d="M52 22v-8h16v8" {...S} />
        </svg>
      );
    case 'dilution':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M24 30h22v40H24zM74 30h22v40H74z" {...S} />
          <path d="M35 70v12l25 14 25-14V70" {...S} />
          <circle cx="60" cy="96" r="5" className="glyph-fill glyph-pulse" />
          <text x="35" y="54" className="glyph-text">10×</text>
          <text x="80" y="54" className="glyph-text">H₂O</text>
        </svg>
      );
    case 'purge':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M14 60h92" {...S} />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={20 + i * 26} cy="60" r="4" className={`glyph-fill glyph-flow glyph-d${i}`} />
          ))}
          <path d="M60 30v-10M50 34l-6-8M70 34l6-8" {...S} className="glyph-accent" />
        </svg>
      );
    case 'baseline':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M12 70c8-18 14 14 22-6s12 10 18-2 10 4 16 0h40" {...S} className="glyph-draw" />
          <path d="M82 58l6 6 12-14" {...S} className="glyph-accent" />
        </svg>
      );
    case 'flowpilot':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M16 96C40 96 46 40 104 36" {...S} className="glyph-draw" />
          <path d="M16 96h88M16 96V24" {...S} opacity="0.4" />
          <text x="66" y="88" className="glyph-text">mL/min</text>
        </svg>
      );
    case 'sample':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M44 28h12v62a6 6 0 0 1-12 0z" {...S} />
          <path d="M66 28h12v62a6 6 0 0 1-12 0z" {...S} />
          <rect x="45" y="56" width="10" height="38" className="glyph-fill" opacity="0.85" />
          <rect x="67" y="76" width="10" height="18" className="glyph-fill glyph-level" opacity="0.5" />
          <path d="M60 12v20" {...S} className="glyph-accent glyph-needle" />
        </svg>
      );
    case 'calibration':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M18 100h88M18 100V18" {...S} opacity="0.4" />
          <path d="M18 98L102 26" {...S} className="glyph-draw" />
          {[0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
            <circle key={i} cx={18 + f * 84} cy={98 - f * 72} r="3.5" className={`glyph-fill glyph-pop glyph-d${i}`} />
          ))}
        </svg>
      );
    case 'batch':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <path d="M18 96h84M18 96V20" {...S} opacity="0.4" />
          <path d="M18 92L96 40" {...S} opacity="0.6" />
          <circle cx="92" cy="22" r="4" className="glyph-fill glyph-warn" />
          <path d="M92 28v16" {...S} className="glyph-accent" strokeDasharray="3 4" />
          <circle cx="66" cy="58" r="4" className="glyph-fill glyph-pop glyph-d3" />
          <text x="70" y="22" className="glyph-text">÷5</text>
        </svg>
      );
    case 'report':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <rect x="28" y="18" width="64" height="84" rx="4" {...S} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path d={`M38 ${38 + i * 16}h30`} {...S} opacity="0.5" />
              {i === 2 ? (
                <path d={`M76 ${34 + i * 16}l8 8M84 ${34 + i * 16}l-8 8`} {...S} className="glyph-warn-stroke" />
              ) : (
                <path d={`M75 ${38 + i * 16}l4 4 7-8`} {...S} className="glyph-accent" />
              )}
            </g>
          ))}
        </svg>
      );
    case 'diagnosis':
      return (
        <svg viewBox="0 0 120 120" className="glyph" aria-hidden="true">
          <circle cx="60" cy="60" r="34" {...S} opacity="0.4" />
          <path d="M60 26a34 34 0 0 1 34 34" {...S} className="glyph-spin glyph-accent" />
          <path d="M40 62h10l5-12 8 22 5-10h12" {...S} />
        </svg>
      );
    default:
      return null;
  }
}
