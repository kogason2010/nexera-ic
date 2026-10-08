import { lazy, Suspense, useRef, useState } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { CALLOUT_TEXT, MODULES } from '../data/instrument';
import { useInView } from '../hooks/useInView';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { instrumentState } from '../utils/scrollStore';
import { scrollToY } from '../hooks/useSmoothScroll';
import '../styles/instrument.css';

const InstrumentCanvas = lazy(() => import('../three/InstrumentCanvas'));
import { CALLOUTS, calloutEls } from '../three/instrumentCallouts';

function calloutText(active: number, i: number) {
  const c = active >= 0 && active <= 5 ? CALLOUTS[active][i] : undefined;
  return c ? CALLOUT_TEXT[c.key] : '';
}

/** Scroll stretch: overview → each of the six modules → overview. */
function activeFromProgress(p: number) {
  if (p < 0.1) return -1;
  if (p > 0.93) return 6;
  return Math.min(5, Math.floor(((p - 0.1) / 0.83) * 6));
}

export function Instrument({ webgl, reducedMotion }: { webgl: boolean; reducedMotion: boolean }) {
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, '600px 0px');
  const visible = useInView(section, '0px');
  const [active, setActive] = useState(-1);

  useScrollProgress(section, (p) => {
    instrumentState.progress = p;
    const a = activeFromProgress(p);
    instrumentState.active = a;
    setActive((prev) => (prev === a ? prev : a));
  });

  const jump = (i: number) => {
    const sec = section.current;
    if (!sec) return;
    const range = sec.offsetHeight - window.innerHeight;
    const p = 0.1 + ((i + 0.5) / 6) * 0.83;
    const top = sec.getBoundingClientRect().top + window.scrollY + range * p;
    scrollToY(top);
  };

  const mod = active >= 0 && active < 6 ? MODULES[active] : null;

  return (
    <section id="technology" className="instrument" ref={section} aria-labelledby="inst-title">
      <div className="instrument__sticky">
        {webgl && near ? (
          <Suspense fallback={null}>
            <InstrumentCanvas active={visible} reducedMotion={reducedMotion} />
          </Suspense>
        ) : null}
        <div className="instrument__shade" aria-hidden="true" />

        <div className="container instrument__overlay">
          <header className="instrument__head">
            <SectionIndex num="04" label="The system" />
            <h2 id="inst-title" className="h-md">
              Compact by design. <span className="muted">Each IC-150 main unit is just 26 cm wide.</span>
            </h2>
          </header>

          <div className="instrument__detail" aria-live="polite">
            {mod ? (
              <div key={mod.id} className="instrument__card">
                <p className="mono">
                  <span className="instrument__card-num">0{active + 1}</span> / 06
                </p>
                <h3 className="h-sm">{mod.name}</h3>
                <p>{mod.text}</p>
              </div>
            ) : (
              <div key={active > 5 ? 'dual' : 'single'} className="instrument__card">
                <p className="mono">{active > 5 ? 'Closed view · dual system' : 'Closed view · single system'}</p>
                <p>
                  {active > 5
                    ? 'SI-150 autosampler, IC-150 and IC-150D: two complete analytical channels for simultaneous anions and cations.'
                    : 'SI-150 autosampler with one IC-150 main unit, each 26 cm wide (H 28 cm and 49 cm, D 50 cm). Scroll to open the doors and follow the flow path.'}
                </p>
              </div>
            )}
          </div>

          <ol className="instrument__index" aria-label="Modules">
            {MODULES.map((m, i) => (
              <li key={m.id}>
                <button className={`mono ${i === active ? 'is-active' : ''} ${i < active ? 'is-past' : ''}`} onClick={() => jump(i)}>
                  <span>0{i + 1}</span> {m.name}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="instrument__callouts" aria-hidden="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="inst-callout"
              ref={(el) => {
                calloutEls[i] = el;
              }}
            >
              <span className="inst-callout__dot" />
              <span className="inst-callout__text">{calloutText(active, i)}</span>
            </div>
          ))}
        </div>
        <p className="instrument__note mono">Illustrative 3D model · interior simplified from Shimadzu product images</p>
      </div>
    </section>
  );
}
