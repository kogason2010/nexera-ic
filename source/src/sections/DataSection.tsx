import { useEffect, useRef } from 'react';
import { CountUp } from '../components/CountUp';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useReveal } from '../hooks/useReveal';
import { CATIONS, EPA_A, EPA_B, SUPPRESSION } from '../data/nexera';
import { gsap } from '../utils/gsap';
import { AnionChromatogram, CationChromatogram, DbpChart, MdlChart } from './data/Charts';
import '../styles/data.css';

export function DataSection() {
  const section = useRef<HTMLElement>(null);
  useReveal(section);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<SVGElement>('.chart').forEach((svg) => {
        const st = { trigger: svg, start: 'top 85%' };
        const grow = svg.querySelectorAll('[data-grow]');
        if (grow.length)
          gsap.from(grow, { scaleY: 0, transformOrigin: '50% 100%', transformBox: 'fill-box', duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: st });
        const growX = svg.querySelectorAll('[data-grow-x]');
        if (growX.length)
          gsap.from(growX, { scaleX: 0, transformOrigin: '0% 50%', transformBox: 'fill-box', duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: st });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="data" className="data section" ref={section} aria-labelledby="data-title">
      <div className="container">
        <div className="data__head">
          <div>
            <SectionIndex num="07" label="Proven methods" />
            <SplitText as="h2" id="data-title" className="h-lg" text="Drinking water to wastewater, by the book." />
          </div>
          <p className="lede" data-reveal>
            Shimadzu’s application work runs the Nexera IC against the regulated methods labs use every day: EPA 300.1 for anions
            and disinfection by-products, ASTM D6919-17 for cations. These are the published numbers.
          </p>
        </div>

        <div className="data__grid">
          <figure className="data-card data-card--chrom" data-reveal>
            <figcaption className="data-card__cap">
              <span className="mono">A · EPA 300.1 Part A · common anions</span>
              <span className="mono muted">Shim-pack IC-SA3 · 4.5 mmol/L Na₂CO₃ · 0.85 mL/min · 40 °C</span>
            </figcaption>
            <AnionChromatogram />
          </figure>

          <figure className="data-card" data-reveal data-delay="0.05">
            <figcaption className="data-card__cap">
              <span className="mono">B · Detection limits</span>
              <span className="mono muted">Part A · n = 7 · r² ≥ 0.9995</span>
            </figcaption>
            <MdlChart />
          </figure>

          <figure className="data-card" data-reveal data-delay="0.1">
            <figcaption className="data-card__cap">
              <span className="mono">C · Part B · disinfection by-products</span>
              <span className="mono muted">200 µL injection · {EPA_B.runTime}</span>
            </figcaption>
            <DbpChart />
          </figure>

          <figure className="data-card" data-reveal data-delay="0.15">
            <figcaption className="data-card__cap">
              <span className="mono">D · ASTM D6919-17 · cations</span>
              <span className="mono muted">Shim-pack IC-C4 · 2.5 mmol/L MSA</span>
            </figcaption>
            <CationChromatogram />
          </figure>

          <div className="data-result" data-reveal data-delay="0.2">
            <p className="mono">Suppressor lifetime test</p>
            <p className="data-result__value display">
              <CountUp value={5000} decimals={0} />
              <span className="data-result__unit">+ injections</span>
            </p>
            <ol className="data-result__chain">
              <li>
                <span className="mono">Anion ICDS-Ai</span>
                <span>{SUPPRESSION.anionLifetime}</span>
              </li>
              <li>
                <span className="mono">Cation ICDS-Ci</span>
                <span>{SUPPRESSION.cationLifetime}</span>
              </li>
              <li>
                <span className="mono">Part A spike recovery</span>
                <span>{EPA_A.recovery}</span>
              </li>
              <li>
                <span className="mono">Part B MDL</span>
                <span>{EPA_B.mdlRange}</span>
              </li>
              <li>
                <span className="mono">Cation MDL (ASTM study)</span>
                <span>0.2–1.6 µg/L</span>
              </li>
              <li>
                <span className="mono">Cation recovery</span>
                <span>{CATIONS.recovery}</span>
              </li>
            </ol>
            <p className="data-result__note">
              Lifetime figures come from Shimadzu demonstrations ({SUPPRESSION.lifetimeConditions}). They are not a guaranteed
              service life. MDLs are study results under the stated conditions, not routine quantitation limits. Continuing
              calibration checks stayed within 100 ± 10 % across ~{EPA_A.hours} hours of continuous Part A analysis.
            </p>
          </div>
        </div>
        <p className="data__source body-s">
          Sources: Shimadzu Application News on EPA Method 300.1 Parts A and B and on ASTM D6919-17 suppressed cation analysis
          with Nexera IC. Chromatograms are redrawn from the published figures.
        </p>
      </div>
    </section>
  );
}
