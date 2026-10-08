import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HERO_COPY, HERO_PHASES } from '../data/content';
import { MagneticButton } from '../components/MagneticButton';
import { ArrowDown, ArrowRight } from '../components/Icons';
import { useInView } from '../hooks/useInView';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { heroState } from '../utils/scrollStore';
import { smoothstep } from '../utils/math';
import { HERO_LABELS } from '../three/hero/labels';
import { heroLabelEls } from '../three/hero/HeroLabels3D';
import { PHASES, activePhase } from '../three/hero/timeline';
import { FlowDiagram } from './hero/FlowDiagram';
import { HeroChart, SuppressionGauge } from './hero/HeroChart';
import { gsap } from '../utils/gsap';
import '../styles/hero.css';

const HeroCanvas = lazy(() => import('../three/HeroCanvas'));

interface Props {
  webgl: boolean;
  reducedMotion: boolean;
  onSceneReady: () => void;
  introPlayed: boolean;
}

export function Hero({ webgl, reducedMotion, onSceneReady, introPlayed }: Props) {
  const section = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLDivElement>(null);
  const scrollCue = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLParagraphElement>(null);
  const product = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const visible = useInView(section, '0px');

  // scroll → progress (consumed by WebGL) + DOM choreography
  useScrollProgress(section, (p) => {
    heroState.progress = p;
    const i = p < 0.075 ? -1 : activePhase(p);
    if (i !== phaseRef.current) {
      phaseRef.current = i;
      setPhase(i);
    }
    if (intro.current) {
      const o = 1 - smoothstep(0.015, 0.07, p);
      intro.current.style.opacity = o.toFixed(3);
      intro.current.style.transform = `translate3d(0, ${(-p * 900).toFixed(1)}px, 0)`;
      intro.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    }
    if (railFill.current) {
      railFill.current.style.transform = `scaleY(${p.toFixed(4)})`;
      const rail = railFill.current.parentElement?.parentElement;
      if (rail) rail.style.opacity = (smoothstep(0.03, 0.09, p) * (1 - smoothstep(0.42, 0.45, p) * 0.85)).toFixed(3);
    }
    // the product still is the opening centrepiece; the flow-path scene takes over as scrolling starts
    const cv = sticky.current?.querySelector<HTMLCanvasElement>('canvas');
    if (cv) cv.style.opacity = smoothstep(0.035, 0.085, p).toFixed(3);
    if (product.current) {
      const o = 1 - smoothstep(0.02, 0.07, p);
      product.current.style.opacity = o.toFixed(3);
      product.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      product.current.style.transform = `translate3d(0, ${(-p * 600).toFixed(1)}px, 0) scale(${(1 + p * 0.6).toFixed(4)})`;
    }
    if (scrollCue.current) scrollCue.current.style.opacity = (1 - smoothstep(0.0, 0.03, p)).toFixed(3);
    if (gauge.current) {
      const g = smoothstep(0.44, 0.47, p) * (1 - smoothstep(0.56, 0.59, p));
      gauge.current.style.opacity = g.toFixed(3);
      gauge.current.style.visibility = g < 0.01 ? 'hidden' : 'visible';
    }
    if (note.current) note.current.style.opacity = (smoothstep(0.18, 0.22, p) * (1 - smoothstep(0.86, 0.9, p))).toFixed(3);
  });

  // pointer → normalized coordinates for camera parallax + particle field
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      heroState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      heroState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // headline entrance after the loader lifts
  useEffect(() => {
    if (!introPlayed || !intro.current) return;
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero__line > span', { yPercent: 115, duration: 1.5, stagger: 0.1, ease: 'expo.out' });
      gsap.from('.hero__fade', { y: 20, opacity: 0, duration: 1.2, stagger: 0.08, delay: 0.35, ease: 'power3.out' });
    }, intro);
    if (product.current)
      gsap.from(product.current.querySelector('img'), { y: 36, scale: 0.97, opacity: 0, duration: 1.8, delay: 0.15, ease: 'expo.out' });
    return () => ctx.revert();
  }, [introPlayed, reducedMotion]);

  return (
    <section id="top" className="hero" ref={section} aria-labelledby="hero-title">
      <div className="hero__sticky" ref={sticky}>
        <div className="hero__bg" aria-hidden="true" />

        {webgl ? (
          <Suspense fallback={null}>
            <HeroCanvas active={visible} reducedMotion={reducedMotion} onReady={onSceneReady} />
          </Suspense>
        ) : (
          <div className="hero__fallback" ref={() => onSceneReady()}>
            <FlowDiagram />
          </div>
        )}

        <div className="hero__vignette" aria-hidden="true" />

        {/* annotations positioned by the WebGL scene */}
        {webgl && (
          <div className="hero__labels" aria-hidden="true">
            {HERO_LABELS.map((l) => (
              <div
                key={l.id}
                className={`scene-label scene-label--${l.tone ?? 'hw'}`}
                ref={(el) => {
                  heroLabelEls[l.id] = el;
                }}
              >
                <span className="scene-label__t">{l.text}</span>
                {l.sub && <span className="scene-label__s">{l.sub}</span>}
              </div>
            ))}
          </div>
        )}
        {webgl && <HeroChart active={visible} sticky={sticky} />}
        <div className="hero__gauge" ref={gauge}>
          <SuppressionGauge />
        </div>
        <p className="hero__scale-note mono" ref={note}>
          <span className="hide-phone">Magnified schematic · particle sizes, spacing and speed are illustrative</span>
          <span className="show-phone">Magnified schematic · not to scale</span>
        </p>

        <div className="hero__product" ref={product}>
          <img
            src="assets/images/nexera-ic-system.webp"
            width={1600}
            height={1197}
            alt="Illustrative 3D model of a Nexera IC single system: SI-150 autosampler with eluent bottles in its rail, beside an IC-150 main unit."
          />
          <p className="hero__product-cap mono">SI-150 + IC-150 · illustrative 3D model</p>
        </div>

        <div className="hero__intro container" ref={intro}>
          <p className="mono hero__fade hero__eyebrow">
            <span className="dot" aria-hidden="true" /> {HERO_COPY.eyebrow}
          </p>
          <h1 id="hero-title" className="h-xl hero__title">
            {HERO_COPY.headline.map((l, i) => (
              <span className="hero__line" key={i}>
                <span className={i === 1 ? 'grad-text' : undefined}>{l}</span>
              </span>
            ))}
          </h1>
          <p className="lede hero__fade hero__lede">{HERO_COPY.lede}</p>
          <div className="hero__ctas hero__fade">
            <MagneticButton href="#science">
              <span className="btn__label">Explore the Science</span>
              <ArrowRight />
            </MagneticButton>
            <MagneticButton href="#technology" variant="ghost">
              <span className="btn__label">View Capabilities</span>
            </MagneticButton>
          </div>
        </div>

        {/* phase captions */}
        <div className="hero__captions container" aria-live="polite">
          {HERO_PHASES.map((c, i) => (
            <div key={c.num} className={`hero-caption ${phase === i ? 'is-active' : ''}`} aria-hidden={phase !== i}>
              <p className="mono hero-caption__num">
                <span>{c.num}</span> / 05
              </p>
              <h2 className="h-lg hero-caption__title">{c.title}</h2>
              <p className="hero-caption__text">{c.text}</p>
            </div>
          ))}
        </div>

        {/* progress rail */}
        <div className="hero__rail" aria-hidden="true">
          <div className="hero__rail-track">
            <div className="hero__rail-fill" ref={railFill} />
          </div>
          <ol>
            {PHASES.map((ph, i) => (
              <li key={ph.id} className={`mono ${phase >= i ? 'is-on' : ''} ${phase === i ? 'is-current' : ''}`}>
                {ph.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="hero__scroll mono" ref={scrollCue}>
          <span>Scroll to run the sample</span>
          <span className="hero__scroll-line" aria-hidden="true">
            <ArrowDown className="hero__scroll-icon" />
          </span>
        </div>
      </div>
    </section>
  );
}
