import { useRef } from 'react';
import { SectionIndex } from '../components/SectionIndex';
import { SplitText } from '../components/SplitText';
import { useReveal } from '../hooks/useReveal';
import { SOURCES, SPEC_CONFLICTS, SPECS } from '../data/nexera';
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
            Key figures from Shimadzu’s specifications page, the Nexera IC customer presentation and the system guide. Where
            those sources disagree, both values are listed below as unresolved. Confirm current specifications with
            Shimadzu.{' '}
            <a href={SOURCES.spec.url} target="_blank" rel="noopener noreferrer">
              Specifications page ↗
            </a>
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
        <div className="spec-conflicts" data-reveal>
          <h3 className="mono spec-conflicts__title">Unresolved source discrepancies</h3>
          <p className="spec-conflicts__lede">
            These figures differ between Shimadzu’s own materials. They are shown side by side, not as a validated operating
            range.
          </p>
          <dl>
            {SPEC_CONFLICTS.map((c) => (
              <div key={c.item} className="spec-conflict">
                <dt>{c.item}</dt>
                <dd>
                  <span>{c.a}</span>
                  <span>{c.b}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
