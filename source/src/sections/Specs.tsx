import { useRef } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useReveal } from '../hooks/useReveal';
import { SPECS } from '../data/nexera';
import '../styles/specs.css';

export function Specs() {
  const section = useRef<HTMLElement>(null);
  useReveal(section);
  return (
    <section id="specs" className="specs section" ref={section} aria-labelledby="specs-title">
      <div className="container">
        <div className="specs__head">
          <div>
            <SectionIndex num="10" label="Specifications" />
            <SplitText as="h2" id="specs-title" className="h-lg" text="The numbers, at a glance." />
          </div>
          <p className="lede" data-reveal>
            Key figures from the Nexera IC specification sheet, customer presentation and system guide. Where those sources
            disagree, the range is shown. Always confirm current specifications with Shimadzu before you buy.
          </p>
        </div>
        <div className="specs__grid">
          {SPECS.map((g) => (
            <div key={g.group} className="spec-group" data-reveal>
              <h3 className="mono spec-group__title">{g.group}</h3>
              <dl>
                {g.rows.map(([k, v]) => (
                  <div key={k} className="spec-row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
