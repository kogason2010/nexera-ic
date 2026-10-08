import { useEffect, useRef } from 'react';
import { MagneticButton } from '../components/MagneticButton';
import { ArrowRight } from '../components/Icons';
import { useStageScene } from '../hooks/useStageScene';
import { gsap } from '../utils/gsap';

export function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useStageScene(ref, 'hero');
  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-a__line > span', { yPercent: 110, duration: 1.4, stagger: 0.1, ease: 'expo.out', delay: 0.2 });
      gsap.from('.hero-a__fade', { y: 18, opacity: 0, duration: 1.1, stagger: 0.08, delay: 0.5, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [reducedMotion]);
  return (
    <section id="top" className="hero-a" ref={ref} aria-labelledby="hero-title">
      <div className="container hero-a__inner">
        <p className="mono hero-a__fade hero-a__eyebrow">
          <span className="dot" aria-hidden="true" /> Unofficial · applications showcase
        </p>
        <h1 id="hero-title" className="h-xl hero-a__title">
          <span className="hero-a__line">
            <span>Nexera IC</span>
          </span>
          <span className="hero-a__line">
            <span className="grad-text">Applications</span>
          </span>
        </h1>
        <p className="lede hero-a__fade hero-a__lede">
          Three published methods, sixteen ions, one ion chromatograph. Scroll through drinking water, disinfection
          by-products and wastewater, and meet the ions behind every peak.
        </p>
        <div className="hero-a__ctas hero-a__fade">
          <MagneticButton href="#drinking-water">
            <span className="btn__label">Start with drinking water</span>
            <ArrowRight />
          </MagneticButton>
          <MagneticButton href="#atlas" variant="ghost">
            <span className="btn__label">Open the ion atlas</span>
          </MagneticButton>
        </div>
        <dl className="hero-a__stats hero-a__fade">
          <div>
            <dt className="mono">Published methods</dt>
            <dd className="display">3</dd>
          </div>
          <div>
            <dt className="mono">Ions</dt>
            <dd className="display">16</dd>
          </div>
          <div>
            <dt className="mono">Lowest MDL</dt>
            <dd className="display">
              0.2<small> µg/L</small>
            </dd>
          </div>
        </dl>
        <p className="hero-a__note mono hero-a__fade">
          In focus: sulfate with an illustrative shell of twelve water molecules. Models are drawn from textbook bond
          lengths, not to scale with one another.
        </p>
      </div>
    </section>
  );
}
