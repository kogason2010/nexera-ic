import { useEffect, useRef, useState } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { IONS } from '../data/apps';
import { useReveal } from '../hooks/useReveal';
import { useStageScene } from '../hooks/useStageScene';
import { setStage, stage, subscribeStage } from '../utils/stage';

const GROUPS = [
  { title: 'EPA 300.1 Part A · common anions', ids: ['F', 'Cl', 'NO2', 'Br', 'NO3', 'PO4', 'SO4'] },
  { title: 'EPA 300.1 Part B · disinfection by-products', ids: ['ClO2', 'BrO3', 'ClO3'] },
  { title: 'ASTM D6919-17 · cations', ids: ['Li', 'Na', 'NH4', 'K', 'Mg', 'Ca'] },
];

/** Pick any ion: the stage rebuilds it (with a hydration shell where one is modelled). */
export function Atlas() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  useStageScene(ref, 'atlas');
  const [sel, setSel] = useState(stage.ion);
  useEffect(() => subscribeStage(() => setSel(stage.ion)), []);
  const ion = IONS.find((i) => i.id === sel) ?? IONS[6];
  const pick = (id: string) => setStage('atlas', id);

  return (
    <section id="atlas" className="chapter atlas" ref={ref} aria-labelledby="atlas-title">
      <div className="container chapter__inner">
        <div className="chapter__col">
          <SectionIndex num="05" label="Ion atlas" />
          <h2 id="atlas-title" className="h-lg chapter__title" data-reveal>
            Meet the ions. <span className="grad-text">All sixteen.</span>
          </h2>
          <p className="lede chapter__lede" data-reveal>
            Choose an ion to rebuild it on the stage. Simple ions appear with an illustrative first shell of water; the
            panel shows where it appears in each published method.
          </p>
          <div className="atlas__groups" data-reveal>
            {GROUPS.map((g) => (
              <div key={g.title} className="atlas__group">
                <p className="mono atlas__gtitle">{g.title}</p>
                <div className="atlas__chips" role="group" aria-label={g.title}>
                  {g.ids.map((id) => {
                    const r = IONS.find((i) => i.id === id)!;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`atlas__chip ${sel === id ? 'is-on' : ''}`}
                        style={{ ['--c' as string]: r.color }}
                        aria-pressed={sel === id}
                        onClick={() => pick(id)}
                      >
                        <span className="atlas__dot" aria-hidden="true" />
                        {r.formula}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="atlas__panel" aria-live="polite" style={{ ['--c' as string]: ion.color }}>
            <p className="mono atlas__kind">
              {ion.kind} · charge {ion.charge}
            </p>
            <p className="atlas__name display">
              {ion.name} <span>{ion.formula}</span>
            </p>
            <p className="atlas__shape">{ion.shape}</p>
            <table className="atlas__table">
              <thead>
                <tr className="mono">
                  <th scope="col">Method</th>
                  <th scope="col">Retention</th>
                  <th scope="col">MDL</th>
                </tr>
              </thead>
              <tbody>
                {ion.methods.map((m) => (
                  <tr key={m.method}>
                    <th scope="row">{m.method}</th>
                    <td>{m.tR}</td>
                    <td>{m.mdl ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="atlas__note">{ion.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
