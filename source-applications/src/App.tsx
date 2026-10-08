import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Nav } from './components/Nav';
import { ScrollControls } from './components/ScrollControls';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { ScrollTrigger } from './utils/gsap';
import { hasWebGL } from './utils/quality';
import { pointer } from './utils/stage';
import { DISCLAIMER, EPA_A, EPA_B, CATIONS, SUPPRESSION } from './data/nexera';
import { SOURCES } from './data/apps';
import { Hero } from './sections/Hero';
import { Chapter } from './sections/Chapter';
import { Atlas } from './sections/Atlas';
import { Methods } from './sections/Methods';
import { Footer } from './sections/Footer';
import { StageLabels } from './sections/StageLabels';
import { DbpChromatogram } from './sections/DbpChromatogram';
import { AnionChromatogram, CationChromatogram, DbpChart, MdlChart } from './sections/data/Charts';
import './styles/controls.css';
import './styles/data.css';
import './styles/apps.css';

const IonStage = lazy(() => import('./three/IonStage'));

function ChartCard({ cap, sub, children }: { cap: string; sub?: string; children: React.ReactNode }) {
  return (
    <figure className="chart-card" data-reveal>
      <figcaption>
        <span className="mono">{cap}</span>
        {sub && <span className="mono chart-card__sub">{sub}</span>}
      </figcaption>
      {children}
    </figure>
  );
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  useSmoothScroll(!reducedMotion);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="stage" aria-hidden="true">
        {webgl ? (
          <Suspense fallback={null}>
            <IonStage reducedMotion={reducedMotion} />
          </Suspense>
        ) : (
          <img className="stage__fallback" src="assets/images/molecular-field.png" alt="" />
        )}
        <div className="stage__shade" />
        {webgl && <StageLabels />}
      </div>
      <Nav />
      <ScrollControls />
      <p className="unofficial-ribbon mono" role="note">
        Unofficial showcase · not affiliated with Shimadzu
        <span className="sr-only">. {DISCLAIMER}</span>
      </p>
      <main id="main">
        <Hero reducedMotion={reducedMotion} />

        <Chapter
          id="drinking-water"
          scene="partA"
          num="01"
          label="Drinking water · EPA 300.1 Part A"
          title={
            <>
              Seven anions. <span className="grad-text">One twenty-minute run.</span>
            </>
          }
          lede={
            <p>
              Fluoride to sulfate, the common anions regulated in drinking water separate on a Shim-pack IC-SA3 with
              carbonate eluent and suppressed conductivity detection. On the stage they are arranged in elution order, each
              with its published retention time.
            </p>
          }
          facts={[
            ['Column', 'Shim-pack IC-SA3 + guard'],
            ['Eluent', '4.5 mmol/L Na₂CO₃, 0.85 mL/min, 40 °C'],
            ['Injection', '50 µL'],
            ['MDLs', '0.0004–0.003 mg/L'],
            ['Linearity', 'r² ≥ 0.9995'],
            ['Stability', `CCV ${EPA_A.recovery} over ~${EPA_A.hours} h`],
          ]}
          source={[SOURCES.partA]}
        >
          <div className="chapter__why" data-reveal>
            <p className="mono">Why this order?</p>
            <ul>
              <li>
                <b>Charge.</b> Divalent sulfate is held more strongly than the monovalent anions, so it elutes last.
              </li>
              <li>
                <b>Hydration.</b> Small, heavily hydrated fluoride barely interacts with the resin and comes out first.
              </li>
              <li>
                <b>Polarisability.</b> Large, soft bromide and nitrate are held longer than chloride.
              </li>
            </ul>
          </div>
          <ChartCard cap="Standard chromatogram" sub="redrawn from the application note">
            <AnionChromatogram />
          </ChartCard>
          <ChartCard cap="Method detection limits" sub="n = 7, mg/L, log scale">
            <MdlChart />
          </ChartCard>
        </Chapter>

        <Chapter
          id="by-products"
          scene="partB"
          num="02"
          label="Disinfection by-products · EPA 300.1 Part B"
          title={
            <>
              What disinfection <span className="grad-text">leaves behind.</span>
            </>
          }
          lede={
            <p>
              Chlorite, bromate and chlorate can form when water is disinfected, and bromide is their precursor. Part B
              measures them at µg/L levels, so the same column and eluent run with a four-times larger 200 µL injection.
            </p>
          }
          facts={[
            ['Analytes', 'ClO₂⁻, BrO₃⁻, Br⁻, ClO₃⁻'],
            ['Injection', '200 µL (Part A uses 50 µL)'],
            ['Run time', EPA_B.runTime],
            ['MDLs', EPA_B.mdlRange],
            ['Against the MCL', 'Chlorite 1.0 mg/L · bromate 0.010 mg/L'],
            ['Spike recovery', EPA_B.recovery],
          ]}
          source={[SOURCES.partB]}
        >
          <ChartCard cap="Standard chromatogram (STD 3)" sub="approximate, redrawn from Fig. 3">
            <DbpChromatogram />
          </ChartCard>
          <ChartCard cap="Method detection limits" sub="µg/L">
            <DbpChart />
          </ChartCard>
        </Chapter>

        <Chapter
          id="cations"
          scene="cations"
          num="03"
          label="Wastewater cations · ASTM D6919-17"
          title={
            <>
              Six cations, <span className="grad-text">each in its own shell of water.</span>
            </>
          }
          lede={
            <p>
              Lithium, sodium, ammonium, potassium, magnesium and calcium separate on a Shim-pack IC-C4 with
              methanesulfonic acid. Divalent magnesium and calcium hold their hydration shells tightly and stay on the
              column far longer than the monovalent ions.
            </p>
          }
          facts={[
            ['Column', 'Shim-pack IC-C4 + IC-GC4'],
            ['Eluent', '2.5 mmol/L methanesulfonic acid, 1.0 mL/min, 40 °C'],
            ['Injection', '10 µL'],
            ['MDLs', '0.2–1.6 µg/L'],
            ['Repeatability', 'peak-area RSD ≤ 0.18 % (n = 7)'],
            ['Recovery', CATIONS.recovery],
          ]}
          source={[SOURCES.cations]}
        >
          <div className="chapter__why" data-reveal>
            <p className="mono">Suppression for cations</p>
            <p>
              The ICDS-Ci suppressor turns the acid eluent into water and each cation into its more conductive hydroxide.
              In Shimadzu’s example, 50 ppb sodium rises from S/N {SUPPRESSION.cationSN.before} to{' '}
              {SUPPRESSION.cationSN.after.toLocaleString('en-US')}, about 30× better.
            </p>
          </div>
          <ChartCard cap="Standard chromatogram" sub="redrawn from the application note">
            <CationChromatogram />
          </ChartCard>
        </Chapter>

        <Chapter
          id="dual"
          scene="dual"
          num="04"
          label="Both at once · IC-150D"
          title={
            <>
              Anions and cations, <span className="grad-text">side by side.</span>
            </>
          }
          lede={
            <p>
              With the IC-150D second channel, an anion path and a cation path run at the same time, each with its own
              column, suppressor and conductivity cell. Results for both are reported in the same data file.
            </p>
          }
          facts={[
            ['Anion channel', 'IC-150 · carbonate eluent · ICDS-Ai'],
            ['Cation channel', 'IC-150D · MSA eluent · ICDS-Ci'],
            ['Injection', 'SI-150 loop injection in dual systems'],
            ['Output', 'one data file and report'],
          ]}
          source={[SOURCES.partA, SOURCES.cations]}
        >
          <div className="chapter__pair">
            <ChartCard cap="Anion channel" sub="EPA 300.1 Part A data">
              <AnionChromatogram />
            </ChartCard>
            <ChartCard cap="Cation channel" sub="ASTM D6919-17 data">
              <CationChromatogram />
            </ChartCard>
          </div>
          <p className="chapter__fine body-s" data-reveal>
            The two traces come from separate application notes, shown together to illustrate the dual-channel idea.
          </p>
        </Chapter>

        <Atlas />
        <Methods />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" style={{ backgroundImage: 'url(assets/textures/grain.png)' }} />
    </>
  );
}
