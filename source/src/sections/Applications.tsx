import { useEffect, useRef } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useReveal } from '../hooks/useReveal';
import { ScrollTrigger } from '../utils/gsap';
import { Glyph } from './automation/Glyphs';
import '../styles/applications.css';

/** Analytical Intelligence features from the Nexera IC customer presentation, in workflow order. */
const FEATURES = [
  { id: 'level', stage: 'Eluent', name: 'Eluent level sensor', line: 'Watches the reservoir so a long batch never runs dry.' },
  { id: 'dilution', stage: 'Eluent', name: 'Automatic eluent dilution', line: 'Mixes a concentrate with pure water at 2×, 5× or 10×. Less weighing, fewer mistakes.' },
  { id: 'purge', stage: 'Start-up', name: 'Auto-purge', line: 'Clears the lines before the first injection, hands-free.' },
  { id: 'flowpilot', stage: 'Start-up', name: 'Flow Pilot', line: 'Ramps the flow up gently to protect the column and extend its life.' },
  { id: 'baseline', stage: 'Start-up', name: 'Baseline judgment', line: 'Checks that the detector has settled and starts the analysis on its own when it is ready.' },
  { id: 'sample', stage: 'Samples', name: 'Auto dilution & pretreatment', line: 'The autosampler mixes sample and diluent in the vial before injecting.' },
  { id: 'calibration', stage: 'Calibration', name: 'Automatic calibration curve', line: 'Builds the calibration levels from a single standard solution.' },
  { id: 'batch', stage: 'Analysis', name: 'Intelligent Batch', line: 'Over the top of the curve? The sample is diluted and re-run automatically.' },
  { id: 'report', stage: 'Report', name: 'Intelligent Report', line: 'Pass/fail flags make out-of-spec results stand out at a glance.' },
  { id: 'diagnosis', stage: 'Always on', name: 'Pump self-diagnosis & recovery', line: 'Detects pump trouble and attempts recovery before it costs a batch.' },
];

export function Applications() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useReveal(section);

  useEffect(() => {
    const sec = section.current;
    const tr = track.current;
    if (!sec || !tr) return;
    const mq = window.matchMedia('(min-width: 901px)');
    let st: ScrollTrigger | null = null;
    const setup = () => {
      st?.kill();
      st = null;
      tr.style.transform = '';
      sec.style.height = '';
      if (!mq.matches) return;
      const distance = Math.max(0, tr.scrollWidth - window.innerWidth);
      sec.style.height = `${distance + window.innerHeight}px`;
      st = ScrollTrigger.create({
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          tr.style.transform = `translate3d(${(-distance * self.progress).toFixed(1)}px,0,0)`;
          const i = Math.min(FEATURES.length - 1, Math.round(self.progress * (FEATURES.length - 1)));
          if (counter.current) counter.current.textContent = String(i + 1).padStart(2, '0');
          if (bar.current) bar.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
        },
      });
      ScrollTrigger.refresh();
    };
    setup();
    mq.addEventListener('change', setup);
    window.addEventListener('resize', setup);
    return () => {
      st?.kill();
      mq.removeEventListener('change', setup);
      window.removeEventListener('resize', setup);
    };
  }, []);

  return (
    <section id="automation" className="apps" ref={section} aria-labelledby="apps-title">
      <div className="apps__sticky">
        <div className="apps__track" ref={track}>
          <div className="apps__intro">
            <SectionIndex num="08" label="Analytical intelligence" />
            <SplitText as="h2" id="apps-title" className="h-lg" text="The routine runs itself." />
            <p className="lede" data-reveal>
              From the eluent bottle to the final report, the jobs that usually need an expert’s eye are automated. Students and
              technicians get trustworthy data on day one. Availability depends on configuration: some functions are part of
              the optional IC Solution software, which currently supports single-channel systems.
            </p>
            <div className="apps__meta mono" aria-hidden="true">
              <span>
                <span ref={counter}>01</span> / {String(FEATURES.length).padStart(2, '0')}
              </span>
              <span className="apps__bar">
                <span ref={bar} />
              </span>
            </div>
          </div>

          {FEATURES.map((f, i) => (
            <article key={f.id} className="app-card feature-card" aria-labelledby={`feat-${f.id}`}>
              <div className="app-card__media feature-card__media">
                <Glyph id={f.id} />
                <span className="app-card__num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="feature-card__stage mono">{f.stage}</span>
              </div>
              <div className="app-card__body">
                <h3 id={`feat-${f.id}`} className="h-md app-card__title">
                  {f.name}
                </h3>
                <p className="app-card__line">{f.line}</p>
              </div>
            </article>
          ))}
          <div className="apps__end" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
