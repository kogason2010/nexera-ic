import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader } from './components/Loader';
import { Nav } from './components/Nav';
import { ScrollControls } from './components/ScrollControls';
import './styles/controls.css';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { ScrollTrigger } from './utils/gsap';
import { hasWebGL } from './utils/quality';
import { Hero } from './sections/Hero';
import { Workflow } from './sections/Workflow';
import { Separation } from './sections/Separation';
import { Instrument } from './sections/Instrument';
import { CaseStudy } from './sections/CaseStudy';
import { Molecular } from './sections/Molecular';
import { DataSection } from './sections/DataSection';
import { Applications } from './sections/Applications';
import { Software } from './sections/Software';
import { Specs } from './sections/Specs';
import { FinalCTA } from './sections/FinalCTA';
import { Footer } from './sections/Footer';
import { DISCLAIMER } from './data/nexera';

export default function App() {
  const reducedMotion = useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const [sceneReady, setSceneReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useSmoothScroll(!reducedMotion);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 1500);
    return () => clearTimeout(t);
  }, []);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onIntroDone = useCallback(() => {
    setIntroDone(true);
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Loader ready={sceneReady} onDone={onIntroDone} />
      <Nav />
      <ScrollControls />
      <p className="unofficial-ribbon mono" role="note">
        Unofficial showcase · not affiliated with Shimadzu
        <span className="sr-only">. {DISCLAIMER}</span>
      </p>
      <main id="main">
        <Hero webgl={webgl} reducedMotion={reducedMotion} onSceneReady={onSceneReady} introPlayed={introDone} />
        <Workflow />
        <Separation />
        <Instrument webgl={webgl} reducedMotion={reducedMotion} />
        <CaseStudy />
        <Molecular webgl={webgl} reducedMotion={reducedMotion} />
        <DataSection />
        <Applications />
        <Software />
        <Specs />
        <FinalCTA />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" style={{ backgroundImage: 'url(assets/textures/grain.png)' }} />
    </>
  );
}
