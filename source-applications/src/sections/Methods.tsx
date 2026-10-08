import { useRef } from 'react';
import { MagneticButton } from '../components/MagneticButton';
import { SectionIndex } from '../components/SectionIndex';
import { METHODS, SOURCES } from '../data/apps';
import { useReveal } from '../hooks/useReveal';
import { useStageScene } from '../hooks/useStageScene';

const ROWS: [string, keyof (typeof METHODS)[number]][] = [
  ['Sample', 'matrix'],
  ['Column', 'column'],
  ['Eluent', 'eluent'],
  ['Flow · temperature', 'flow'],
  ['Injection', 'injection'],
  ['Analytes', 'analytes'],
  ['Run time', 'run'],
  ['MDL range', 'mdl'],
  ['QC highlights', 'qc'],
];

export function Methods() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  useStageScene(ref, 'outro');
  return (
    <section id="methods" className="methods" ref={ref} aria-labelledby="methods-title">
      <div className="container">
        <SectionIndex num="06" label="Methods at a glance" />
        <h2 id="methods-title" className="h-lg methods__title" data-reveal>
          Three methods, side by side.
        </h2>
        <div className="methods__scroll" data-reveal>
          <table className="methods__table">
            <thead>
              <tr>
                <th scope="col" className="mono">
                  Method
                </th>
                {METHODS.map((m) => (
                  <th key={m.id} scope="col">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, key]) => (
                <tr key={label}>
                  <th scope="row" className="mono">
                    {label}
                  </th>
                  {METHODS.map((m) => (
                    <td key={m.id}>{key === 'flow' ? `${m.flow} · ${m.temp}` : String(m[key])}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="mono">
                  Source
                </th>
                {METHODS.map((m) => (
                  <td key={m.id}>
                    <a href={m.source.url} target="_blank" rel="noopener noreferrer">
                      {m.source.label.split(' · ')[0]} ↗
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="methods__fine body-s" data-reveal>
          All values come from Shimadzu’s application notes and customer presentations. Part B retention times are read
          from the published chromatogram and are approximate. Method detection limits are study results under the
          stated conditions, not routine quantitation limits.
        </p>
        <div className="methods__ctas" data-reveal>
          <MagneticButton href={SOURCES.apps.url}>
            <span className="btn__label">Shimadzu Nexera IC applications ↗</span>
          </MagneticButton>
          <MagneticButton href="https://www.shimadzu.com/an/forms/product/index.html" variant="ghost">
            <span className="btn__label">Ask Shimadzu about an application ↗</span>
          </MagneticButton>
          <MagneticButton href={SOURCES.showcase.url} variant="ghost">
            <span className="btn__label">The instrument showcase ↗</span>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
