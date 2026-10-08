import { lazy, Suspense, useRef } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { useInView } from '../hooks/useInView';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { moleculeState } from '../utils/scrollStore';
import { smoothstep } from '../utils/math';
import '../styles/molecular.css';

const MolecularCanvas = lazy(() => import('../three/MolecularCanvas'));

const LINES = [
  { k: 'Charge', v: 'Divalent sulfate is held more strongly than monovalent chloride, the main reason it elutes last.' },
  { k: 'Hydration', v: 'Each ion drags a shell of oriented water. Its effective size shapes how it meets the stationary phase.' },
  { k: 'Polarisability', v: 'Large, soft ions such as bromide and nitrate are retained longer than small, hard fluoride.' },
];

export function Molecular({ webgl, reducedMotion }: { webgl: boolean; reducedMotion: boolean }) {
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, '600px 0px');
  const visible = useInView(section, '0px');
  const title = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLLIElement | null)[]>([]);

  useScrollProgress(section, (p) => {
    moleculeState.progress = p;
    if (title.current) {
      const o = smoothstep(0.02, 0.15, p) * (1 - smoothstep(0.88, 1, p));
      title.current.style.opacity = o.toFixed(3);
      title.current.style.transform = `translate3d(0, ${((1 - smoothstep(0.02, 0.2, p)) * 40).toFixed(1)}px, 0)`;
    }
    if (card.current) {
      const o = smoothstep(0.5, 0.62, p) * (1 - smoothstep(0.92, 1, p));
      card.current.style.opacity = o.toFixed(3);
      card.current.style.transform = `translate3d(0, ${((1 - smoothstep(0.5, 0.65, p)) * 24).toFixed(1)}px, 0)`;
    }
    lines.current.forEach((el, i) => {
      if (!el) return;
      const o = smoothstep(0.3 + i * 0.1, 0.4 + i * 0.1, p) * (1 - smoothstep(0.92, 1, p));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - o) * 16).toFixed(1)}px, 0)`;
    });
  });

  return (
    <section className="molecular" ref={section} aria-labelledby="mol-title">
      <div className="molecular__sticky">
        {webgl && near ? (
          <Suspense fallback={null}>
            <MolecularCanvas active={visible} reducedMotion={reducedMotion} />
          </Suspense>
        ) : (
          !webgl && (
            <img
              className="molecular__fallback"
              src="assets/images/molecular-field.png"
              alt="Rendered field of small inorganic ions with a hydrated sulfate ion in focus."
            />
          )
        )}
        <div className="molecular__shade" aria-hidden="true" />

        <div className="container molecular__overlay">
          <div className="molecular__title" ref={title}>
            <SectionIndex num="06" label="The ions" />
            <h2 id="mol-title" className="h-lg">
              Ions never travel alone.
              <br />
              <span className="grad-text">Chemistry decides the order.</span>
            </h2>
            <ul className="molecular__lines">
              {LINES.map((l, i) => (
                <li key={l.k} ref={(el) => (lines.current[i] = el)}>
                  <span className="mono">{l.k}</span>
                  <p>{l.v}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="molecular__card" ref={card}>
            <p className="mono">In focus</p>
            <p className="molecular__card-name display">Sulfate, hydrated</p>
            <dl>
              <div>
                <dt className="mono">Ion</dt>
                <dd>SO₄²⁻ · S–O 1.49 Å</dd>
              </div>
              <div>
                <dt className="mono">Retention (EPA 300.1 A)</dt>
                <dd>18.4 min</dd>
              </div>
              <div>
                <dt className="mono">MDL</dt>
                <dd>0.003 mg/L</dd>
              </div>
            </dl>
            <p className="molecular__card-note">
              Illustrative model: twelve water molecules hydrogen-bonded to sulfate’s oxygens. Conductivity detection
              measures countless ions at once, never pictures of single ones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
